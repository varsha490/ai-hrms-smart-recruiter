from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import Candidate, User, UserInDB, UserCreate, Token, QuestionRequest, AnswerEvaluationRequest, Employee, Attendance, Payroll
from db import get_database
from utils import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM, extract_text_from_pdf, analyze_resume_with_openai, generate_interview_questions, evaluate_interview_answer, calculate_rating
import jwt
from datetime import timedelta
import time
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_database)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user_dict = await db["users"].find_one({"username": username})
    if user_dict is None:
        raise credentials_exception
    return User(
        username=user_dict["username"],
        email=user_dict["email"],
        role=user_dict["role"]
    )

@router.post("/register")
async def register(user: UserCreate, db=Depends(get_database)):
    existing_user = await db["users"].find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    user_dict = user.dict()
    password = user_dict.pop("password")
    user_dict["hashed_password"] = get_password_hash(password)
    await db["users"].insert_one(user_dict)
    return {"message": "User created successfully"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_database)):
    t0 = time.perf_counter()
    user_dict = await db["users"].find_one({"username": form_data.username})
    t1 = time.perf_counter()
    pwd_ok = False
    t2 = None
    if user_dict:
        # time password verify in utils (it already prints duration), but record here too
        t_before = time.perf_counter()
        pwd_ok = verify_password(form_data.password, user_dict["hashed_password"])
        t_after = time.perf_counter()
        t2 = t_after - t_before

    total = time.perf_counter() - t0
    logger.info(f"/login timings: db_lookup_ms={(t1-t0)*1000:.2f}, pwd_verify_ms={(t2*1000) if t2 else 'N/A'}, total_ms={total*1000:.2f}, username={form_data.username}")
    if not user_dict or not pwd_ok:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(
        data={"sub": user_dict["username"], "role": user_dict["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/")
async def root():
    return {"message": "Welcome to AI HRMS Smart Recruiter API"}

@router.post("/candidates/")
async def create_candidate(candidate: Candidate, current_user: User = Depends(get_current_user), db=Depends(get_database)):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    candidate_dict = candidate.dict()
    result = await db["candidates"].insert_one(candidate_dict)
    return {"message": "Candidate created", "id": str(result.inserted_id)}

@router.get("/candidates/")
async def list_candidates(current_user: User = Depends(get_current_user), db=Depends(get_database)):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    candidates = await db["candidates"].find().to_list(100)
    for c in candidates:
        c["_id"] = str(c["_id"])
    return {"candidates": candidates}


@router.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    # Allow any authenticated user to analyze their resume
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    file_bytes = await file.read()
    try:
        text = extract_text_from_pdf(file_bytes)
        analysis_result = await analyze_resume_with_openai(text)
        return {"filename": file.filename, "extracted_text": text, "analysis": analysis_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")


@router.post("/chatbot/generate-questions/")
async def chatbot_generate_questions(req: QuestionRequest, current_user: User = Depends(get_current_user)):
    # Allow any authenticated user to generate questions
    result = await generate_interview_questions(req.topic)
    return result


@router.post("/chatbot/evaluate-answer/")
async def chatbot_evaluate_answer(req: AnswerEvaluationRequest, current_user: User = Depends(get_current_user)):
    # Allow any authenticated user to evaluate answers
    result = await evaluate_interview_answer(req.question, req.answer)
    return result

@router.post("/employees/")
async def add_employee(emp: Employee, current_user: User = Depends(get_current_user), db=Depends(get_database)):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    emp_dict = emp.dict()
    # If a username is provided, link employee to that user if it exists
    username = emp_dict.get("username")
    if username:
        user_doc = await db["users"].find_one({"username": username})
        if user_doc:
            emp_dict["user_id"] = str(user_doc.get("_id", user_doc.get("username")))
            emp_dict["username"] = user_doc["username"]

    result = await db["employees"].insert_one(emp_dict)
    # if we can, update linked user's role to 'Employee'
    if emp_dict.get("username"):
        existing = await db["users"].find_one({"username": emp_dict.get("username")})
        if existing:
            # remove old and insert updated to emulate update on JSON DB
            await db["users"].delete_one({"username": emp_dict.get("username")})
            existing["role"] = "Employee"
            await db["users"].insert_one(existing)
    return {"message": "Employee added", "id": str(result.inserted_id)}

@router.get("/employees/")
async def list_employees(current_user: User = Depends(get_current_user), db=Depends(get_database)):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    employees = await db["employees"].find().to_list(100)
    for e in employees:
        e["_id"] = str(e["_id"])
    return {"employees": employees}

@router.post("/attendance/")
async def mark_attendance(att: Attendance, current_user: User = Depends(get_current_user), db=Depends(get_database)):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    att_dict = att.dict()
    result = await db["attendance"].insert_one(att_dict)
    return {"message": "Attendance marked", "id": str(result.inserted_id)}

@router.post("/payroll/")
async def store_salary(pay: Payroll, current_user: User = Depends(get_current_user), db=Depends(get_database)):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    pay_dict = pay.dict()
    # normalize employee identifier: allow passing employee _id, name, or email
    emp_identifier = pay_dict.get("employee_id")
    if emp_identifier:
        emp = None
        # if looks like an email
        if isinstance(emp_identifier, str) and "@" in emp_identifier:
            emp = await db["employees"].find_one({"email": emp_identifier})
        # try by _id
        if not emp:
            emp = await db["employees"].find_one({"_id": emp_identifier})
        # try by name
        if not emp:
            emp = await db["employees"].find_one({"name": emp_identifier})
        if emp:
            pay_dict["employee_id"] = str(emp["_id"])

    # support employee_email field as alternative
    if not pay_dict.get("employee_id") and pay_dict.get("employee_email"):
        emp = await db["employees"].find_one({"email": pay_dict.get("employee_email")})
        if emp:
            pay_dict["employee_id"] = str(emp["_id"])

    result = await db["payroll"].insert_one(pay_dict)
    return {"message": "Salary stored", "id": str(result.inserted_id)}


@router.get("/payroll/me")
async def get_my_payroll(current_user: User = Depends(get_current_user), db=Depends(get_database)):
    # find employee record for current user by email or username
    emp = None
    if getattr(current_user, 'email', None):
        emp = await db["employees"].find_one({"email": current_user.email})
    if not emp:
        emp = await db["employees"].find_one({"name": current_user.username})

    if not emp:
        # no employee record found; return any payrolls that match username as a fallback
        all_payrolls = await db["payroll"].find().to_list(200)
        filtered = [p for p in all_payrolls if p.get("employee_id") in (current_user.username, current_user.email)]
        for p in filtered:
            p["_id"] = str(p["_id"])
        return {"payrolls": filtered}

    emp_id = str(emp["_id"])
    # collect payrolls matching normalized id, and fallback to name/email for legacy entries
    all_payrolls = await db["payroll"].find().to_list(200)
    filtered = [p for p in all_payrolls if p.get("employee_id") in (emp_id, emp.get("name"), emp.get("email"), current_user.username)]
    for p in filtered:
        p["_id"] = str(p["_id"])
    return {"payrolls": filtered}

@router.get("/payroll/{employee_id}")
async def get_salary(employee_id: str, current_user: User = Depends(get_current_user), db=Depends(get_database)):
    # Admin/HR can fetch any employee payroll by id/name/email
    if current_user.role in ["Admin", "HR"]:
        payrolls = await db["payroll"].find({"employee_id": employee_id}).to_list(100)
    else:
        # Employees can only fetch their own payrolls
        # resolve current user's employee record
        emp = None
        if getattr(current_user, 'email', None):
            emp = await db["employees"].find_one({"email": current_user.email})
        if not emp:
            emp = await db["employees"].find_one({"name": current_user.username})
        emp_id = str(emp["_id"]) if emp else None
        # allow if requested id matches resolved id or legacy name/email
        if employee_id not in (emp_id, current_user.username, getattr(current_user, 'email', None)):
            raise HTTPException(status_code=403, detail="Not enough permissions to view this payroll")
        payrolls = await db["payroll"].find({"employee_id": employee_id}).to_list(100)

    for p in payrolls:
        p["_id"] = str(p["_id"])
    return {"payrolls": payrolls}



@router.get("/payroll/me")
async def get_my_payroll(current_user: User = Depends(get_current_user), db=Depends(get_database)):
    # find employee record for current user by email or username
    emp = None
    if getattr(current_user, 'email', None):
        emp = await db["employees"].find_one({"email": current_user.email})
    if not emp:
        emp = await db["employees"].find_one({"name": current_user.username})

    if not emp:
        # no employee record found; return any payrolls that match username as a fallback
        all_payrolls = await db["payroll"].find().to_list(200)
        filtered = [p for p in all_payrolls if p.get("employee_id") in (current_user.username, current_user.email)]
        for p in filtered:
            p["_id"] = str(p["_id"])
        return {"payrolls": filtered}

    emp_id = str(emp["_id"])
    # collect payrolls matching normalized id, and fallback to name/email for legacy entries
    all_payrolls = await db["payroll"].find().to_list(200)
    filtered = [p for p in all_payrolls if p.get("employee_id") in (emp_id, emp.get("name"), emp.get("email"), current_user.username)]
    for p in filtered:
        p["_id"] = str(p["_id"])
    return {"payrolls": filtered}

@router.get("/dashboard/")
async def dashboard(current_user: User = Depends(get_current_user), db=Depends(get_database)):
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    candidates = await db["candidates"].find().to_list(100)
    
    dashboard_data = []
    top_candidate = None
    highest_score = -1
    
    for c in candidates:
        r_score = c.get("resume_score") or 0
        i_score = c.get("interview_score") or 0
        
        rating = calculate_rating(r_score, i_score)
        total_score = (r_score + i_score) / 2
        
        c_info = {
            "id": str(c["_id"]),
            "name": c.get("name"),
            "email": c.get("email"),
            "status": c.get("status"),
            "resume_score": r_score,
            "interview_score": i_score,
            "total_score": total_score,
            "rating": rating
        }
        
        dashboard_data.append(c_info)
        
        if total_score > highest_score:
            highest_score = total_score
            top_candidate = c_info
            
    return {
        "candidates": dashboard_data,
        "top_candidate": top_candidate
    }
