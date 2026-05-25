# Cognivue Backend API

A scalable, high-performance Python FastAPI service layer serving telemetry sync collection, cognitive analysis, database orchestration, and JWT auth.

## Sub-module Overview
The backend functions as the centralized hub for telemetry aggregation, business logic enforcement, and analytics calculations. It acts as the secure middleman between the frontend, the toolbar companion extension, and the Supabase database.

---

## Tech Stack
* Framework: Python, FastAPI (High performance, ASGI standard)
* Web Server: Uvicorn (ASGI web server)
* Database & Auth Integration: Supabase Python Client SDK
* Security: JWT (JSON Web Tokens), BCrypt password hashing, Supabase Row-Level Security (RLS)
* Validation: Pydantic v2 (Strict type checking, data serialization)

---

## Core API Responsibilities
1. Telemetry Logging: Aggregates vision mesh stats (gaze, fatigue blink logs, posture shifts) and companion extension telemetry (active tab categories, switches) safely.
2. Session Controls: Handles starting and ending focus sessions, calculates average focus scores and fatigue ratings.
3. AI Coaching Engine: Analyzes correlations between browsing activities and cognitive metrics, generating customized burnout indicators and recommendations.
4. Data Purging (Wipe Flows): Securely deletes profiles, session logs, browser activities, and cognitive stats upon user confirmation.

---

## API Routes

* /auth (Authentication & Security)
  - POST /auth/signup - Register a profile and initialize credentials in database.
  - POST /auth/login - Verify password hashes and generate JWT tokens.
  - POST /auth/delete-account/{user_id} - Safely purge all user records, sessions, and logs permanently.
* /users (Profiles)
  - GET /users/profile/{user_id} - Retrieve active profile details.
* /sessions (Focus Sessions)
  - POST /sessions/start - Initiate a focus session timer block.
  - POST /sessions/end - Terminate focus tracking, compute productivity aggregates, and save stats.
  - GET /sessions/active/{user_id} - Check for active sessions on the page mount (gracefully handles 404s).
  - GET /sessions/history/{user_id} - Fetch historical focus registry chronologically descending.
* /metrics (Vision Biometrics)
  - POST /metrics/add - Append local browser webcam mesh stats into the database (every 5 seconds).
  - GET /metrics/session/{session_id} - Retrieve metric logs for a specific focus session.
  - GET /metrics/latest/{session_id} - Query latest metric frame safely.
* /insights (AI Engine)
  - POST /insights/generate - Trigger analytical insights comparing focus times and visual fatigue.
* /extension (Companion telemetry sync)
  - POST /extension/activity - Collect tab category logs or lightweight heartbeats (cleans nulls).
  - GET /extension/activity/{user_id} - Retrieve latest 20 browser logs for connection badges.

---

## Database Schema (Supabase PostgreSQL)

Cognivue uses a relational PostgreSQL database on Supabase. Below are the key tables:
1. profiles: Houses user identifiers, display names, email records, and account timestamps.
2. focus_sessions: Logs focus period details including start/end timestamps, average focus ratings, fatigue indexes, and productivity scores.
3. cognitive_metrics: Captures vision mesh frame logs (blink frequencies, eye ratios, gaze status, posture alignment, active tab) synced from the webcam panel.
4. ai_insights: Stores hybrid analysis reports, recommendations, and burnout ratings.
5. browser_activity: Houses companion telemetry sync blocks (active domain category, switches, heartbeat flag) mapped to optional session UUIDs.
6. deleted_accounts: Keeps lightweight audit logs (timestamp only) for Purge flows.

Row-Level Security (RLS) is enforced on all tables, ensuring users can only read and write data belonging explicitly to their authenticated user_id.

---

## Environment Variables
Configure the backend connection secrets inside /backend/.env:
```ini
SUPABASE_URL=your_supabase_project_endpoint_url
SUPABASE_ANON_KEY=your_supabase_anonymous_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_for_wipes
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

---

## Getting Started

### Local Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   * Windows:
     ```powershell
     .\venv\Scripts\activate
     ```
   * macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
4. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Copy variables and configure secrets:
   ```bash
   cp .env.example .env
   ```
6. Launch the ASGI web development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   (Swagger interactive API testing docs will be available at http://127.0.0.1:8000/docs).

---

## Production Deployment (Render)
FastAPI can be deployed easily on Render as a Web Service:
1. Link your GitHub repository in your Render dashboard.
2. Choose Web Service and select the /backend subdirectory path.
3. Choose Python environment and specify:
   - Build Command: pip install -r requirements.txt
   - Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
4. In Render's environment dashboard, configure your .env keys (ensure FRONTEND_URL points to your Vercel deployment domain).
