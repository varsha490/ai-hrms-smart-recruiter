# AI HRMS Smart Recruiter

A minimal, full-stack AI-powered Human Resource Management System (HRMS) and Smart Recruiter. This application leverages FastAPI for the backend, React for the frontend, and OpenAI for intelligent resume analysis and interview simulations.

## 🚀 Features

### Smart Recruitment
- **AI Resume Analysis**: Upload PDF resumes to extract skills, generate a summary, and provide a 0-100 score.
- **Interactive AI Chatbot**: Generate technical interview questions based on specific roles/topics and get AI-powered evaluation of answers.
- **Candidate Dashboard**: Visualize candidate scores, ratings (Excellent/Good/Average), and highlight top performers.

### HR Management
- **Employee Directory**: Manage and list organization employees.
- **Attendance Tracking**: Mark and track employee attendance.
- **Payroll Management**: Securely store and view salary history.

### Security & Access Control
- **JWT Authentication**: Secure login system with JSON Web Tokens.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access.
  - **HR**: Access to recruitment and employee data.
  - **Employee**: Limited to personal profile and salary view.

## 🛠 Tech Stack

- **Backend**: FastAPI (Python), Motor (Async MongoDB), PyJWT, Passlib, OpenAI API, pypdf.
- **Frontend**: React (Vite), React Router, Vanilla CSS.
- **Database**: MongoDB.

## 📥 Setup Instructions

### Backend Setup
1. Navigate to the root directory.
2. Create a virtual environment: `python -m venv venv`
3. Activate the environment:
   - Windows: `.\venv\Scripts\activate`
   - Unix/macOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file and add your credentials:
   ```env
   MONGO_URL=your_mongodb_uri
   OPENAI_API_KEY=your_openai_api_key
   SECRET_KEY=your_jwt_secret_key
   ```
6. Run the server: `python main.py`

### Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file (optional for local):
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
   Note: Ensure MongoDB is running on your machine (default: mongodb://localhost:27017).
4. Run the development server: `npm run dev`

## 📡 API Endpoints

### Auth
- `POST /register`: Create a new user.
- `POST /login`: Get JWT token.
- `GET /users/me`: Get current user info.

### Recruitment
- `POST /upload-resume/`: Extract text and analyze resume (PDF).
- `POST /chatbot/generate-questions/`: Generate AI interview questions.
- `POST /chatbot/evaluate-answer/`: Get AI feedback on interview answers.
- `GET /dashboard/`: Get candidate performance summary.

### HR
- `GET /employees/`: List all employees.
- `POST /attendance/`: Mark attendance.
- `GET /payroll/{employee_id}`: View salary history.

## 🌐 Deployment Links

- **Frontend (Vercel)**: [Live Demo](https://your-vercel-link.vercel.app)
- **Backend (Render)**: [API URL](https://your-render-link.onrender.com)
- **GitHub Repository**: [Source Code](https://github.com/your-username/ai-hrms-smart-recruiter)
