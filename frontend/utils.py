import os
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
import time
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Allow configuring bcrypt rounds via env var for development tuning
_bcrypt_rounds = int(os.getenv("BCRYPT_ROUNDS", "12"))
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=_bcrypt_rounds, deprecated="auto")

def verify_password(plain_password, hashed_password):
    start = time.perf_counter()
    try:
        ok = pwd_context.verify(plain_password, hashed_password)
        return ok
    finally:
        duration = (time.perf_counter() - start) * 1000.0
        # log to stdout for quick diagnostics
        print(f"[utils.verify_password] duration_ms={duration:.2f}")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_env_variable(var_name: str, default: str = None) -> str:
    """Helper utility to fetch environment variables."""
    return os.getenv(var_name, default)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    import io
    from pypdf import PdfReader
    
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text.strip()

async def analyze_resume_with_openai(text: str) -> dict:
    import json
    from openai import AsyncOpenAI
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Mock Response
        return {
            "skills": ["Python", "FastAPI", "React", "Docker", "Machine Learning"],
            "score": 85,
            "summary": "Experienced software engineer with a strong background in full-stack development and AI integrations. Demonstrates expertise in modern web frameworks and containerization."
        }
        
    client = AsyncOpenAI(api_key=api_key)
    prompt = f"""
    Analyze the following resume text and provide:
    1. A list of key skills.
    2. A score from 0 to 100 representing the overall quality and completeness of the resume.
    3. A short summary of the candidate's profile.
    
    Resume Text:
    {text}
    
    Return the response strictly in JSON format with keys: "skills" (list of strings), "score" (integer), "summary" (string).
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter and resume analyzer. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        return {"skills": [], "score": 0, "summary": f"Failed to analyze resume: {str(e)}"}

async def generate_interview_questions(topic: str) -> dict:
    import json
    from openai import AsyncOpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: 
        # Mock Response
        return {"questions": [
            f"Can you explain your experience with {topic}?",
            f"What are the most challenging aspects of working with {topic}?",
            f"How do you stay updated with the latest trends in {topic}?"
        ]}
    client = AsyncOpenAI(api_key=api_key)
    prompt = f"Generate 3 technical interview questions for the topic: {topic}. Return JSON with a key 'questions' containing a list of strings."
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are a technical interviewer. Always respond in JSON."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"questions": [f"Tell me about {topic}.", f"Why use {topic}?", f"Best practices for {topic}."]}

async def evaluate_interview_answer(question: str, answer: str) -> dict:
    import json
    from openai import AsyncOpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: 
        # Mock Response
        return {
            "feedback": "Great answer! You covered the core concepts well, though adding a specific project example would make it even stronger.",
            "score": 75
        }
    client = AsyncOpenAI(api_key=api_key)
    prompt = f"Evaluate the following interview answer.\nQuestion: {question}\nAnswer: {answer}\nReturn JSON with 'feedback' (string) and 'score' (integer 0-100)."
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are an expert technical interviewer evaluating answers. Always respond in JSON."},
                      {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"feedback": "Good attempt. Your explanation of the basics was clear.", "score": 60}

def calculate_rating(resume_score: int, interview_score: int) -> str:
    total = (resume_score + interview_score) / 2
    if total >= 80:
        return "Excellent"
    elif total >= 60:
        return "Good"
    else:
        return "Average"

