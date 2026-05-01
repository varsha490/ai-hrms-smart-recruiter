from pydantic import BaseModel
from typing import Optional

class Candidate(BaseModel):
    name: str
    email: str
    resume_text: Optional[str] = None
    status: str = "Applied"
    resume_score: Optional[int] = 0
    interview_score: Optional[int] = 0

class User(BaseModel):
    username: str
    email: str
    role: str # "Admin", "HR", "Employee"

class UserInDB(User):
    hashed_password: str

class UserCreate(User):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class QuestionRequest(BaseModel):
    topic: str

class AnswerEvaluationRequest(BaseModel):
    question: str
    answer: str

class Employee(BaseModel):
    name: str
    department: str
    role: str
    email: str
    # Optional link to a user account
    username: Optional[str] = None
    user_id: Optional[str] = None

class Attendance(BaseModel):
    employee_id: str
    date: str
    status: str # "Present" or "Absent"

class Payroll(BaseModel):
    employee_id: str
    month: str
    salary: float

