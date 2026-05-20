# Cognivue API Backend

Cognivue is an AI-powered cognitive intelligence platform for focus, fatigue, productivity, and real-time cognitive analytics. This directory contains the FastAPI-based backend.

## Backend Stack
- **FastAPI**: Modern, fast web framework for building APIs with Python.
- **Supabase**: PostgreSQL database and backend-as-a-service.
- **JWT**: Secure JSON Web Token authentication.
- **pydantic-settings / python-dotenv**: Environment configuration.

## Folder Structure
```
backend/
├── app/
│   ├── main.py            # Application entrypoint
│   ├── config.py          # Configuration settings
│   ├── database.py        # Supabase database client setup
│   ├── routes/            # API Route handlers (Auth, User, Session, Metrics, Insights)
│   ├── schemas/           # Pydantic data schemas
│   ├── services/          # Business logic layers
│   ├── utils/             # Helper utilities (JWT, helper functions)
│   └── middleware/        # Authentication/Authorization middleware
├── requirements.txt       # Dependencies
├── .env.example           # Environment template
└── README.md              # Setup instructions
```

## Setup & Installation Instructions

Follow these steps to set up and run the backend locally:

### 1. Create a Python Virtual Environment
Navigate to the `backend` folder and run:
```bash
cd backend
python -m venv venv
```

### 2. Activate the Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  venv\Scripts\Activate.ps1
  ```
- **Windows (CMD)**:
  ```cmd
  venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to create a `.env` file:
- On Windows:
  ```powershell
  copy .env.example .env
  ```
- On macOS/Linux:
  ```bash
  cp .env.example .env
  ```
Open the `.env` file and fill in your Supabase credentials.

### 5. Run the Application
Start the development server with live reload:
```bash
uvicorn app.main:app --reload
```
The API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).
