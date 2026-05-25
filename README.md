# Cognivue

A privacy-first, on-device cognitive intelligence platform analyzing focus, fatigue, and productivity patterns using local computer vision gaze tracking, biometrics, and active browser tab metrics.

### Live Deployments
- Frontend Dashboard: [cognivue-kappa.vercel.app](https://cognivue-kappa.vercel.app)
- Backend API Console: [cognivue-rmlz.onrender.com](https://cognivue-rmlz.onrender.com)

---

## Project Overview
Cognivue is designed to help professionals and students understand their deep work habits and manage cognitive fatigue. It merges local webcam-based attention mapping with active browser telemetry to provide deep focus analytics and personalized AI-generated coaching recommendations.

### The Problem
Traditional productivity trackers are either invasive (recording screenshots, logging keystrokes) or superficial (measuring total active time on an app). They fail to answer how focused a user actually was, ignore posture drift and visual fatigue, and pose severe security risks by uploading raw video streams or personal content to the cloud.

### The Solution
Cognivue processes raw biometric telemetry entirely inside the browser's local sandbox using client-side WebAssembly models. The local vision layer is coupled with a lightweight browser extension that logs productivity categories locally, syncing only sanitized numerical scores to the backend server. No camera feeds, screenshots, or page content are ever sent to a server.

---

## Key Features

1. Real-time Cognitive Monitoring
   - Live gaze tracking (on-screen vs. off-screen detection).
   - Fatigue indexing derived from blink rate fluctuations and eye-opening ratios.
   - Real-time posture calibration and slouch alerts using MediaPipe.
   
2. Privacy-First Local Webcam Processing
   - WebAssembly execution sandboxes webcam analysis locally.
   - Scans camera feeds at 30 FPS inside the browser and outputs only raw numerical metrics.
   
3. Browser Extension Activity Awareness
   - A Manifest V3 background service worker mapping current domains to productivity categories.
   - Pause/resume toggle and flicker-free connection key link mapping.
   
4. Sessions History & Analytics
   - Scalable session logging capturing deep-work stats, blink summaries, and productivity index consistency.
   - Interactive charts visualization showing focus index and fatigue over time.

5. AI Insights & Recommendations
   - Hybrid machine learning algorithms analyzing focus/fatigue correlations.
   - Personalized coaching insights and burnout prevention suggestions.

6. Account & Security Flows
   - Robust display profile controls and complete data elimination flows (account purge).

---

## Tech Stack

* Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts
* Backend: Python, FastAPI, Supabase client SDK
* Database & Auth: Supabase PostgreSQL, Supabase Auth, Row-Level Security (RLS)
* Vision & AI: MediaPipe FaceMesh WebAssembly library, hybrid Python analytics services
* Browser Integration: Chrome Extension API (Manifest V3)
* Hosting: Vercel (Frontend), Render (Backend)

---

## Architecture Overview

The Cognivue monorepo consists of four core building blocks:

```
                          ┌───────────────────────────┐
                          │     Chrome Toolbar HUD    │
                          │   (Manifest V3 Companion) │
                          └─────────────┬─────────────┘
                                        │ Telemetry Heartbeats
                                        ▼ (POST /extension/activity)
┌──────────────────────┐  Inference     ┌───────────────────────────┐
│    Local Webcam      ├───────────────►│    React Frontend App     │
│  (MediaPipe Mesh)    │  Gaze/Posture  │    (Dashboard & Charts)   │
└──────────────────────┘                └─────────────┬─────────────┘
                                                      │ REST API Requests
                                                      ▼
┌──────────────────────┐  Real-time Sync┌───────────────────────────┐
│     Supabase DB      │◄───────────────┤    Python FastAPI App     │
│   (Postgres RLS)     │  SQL Operations│     (Analytics Service)   │
└──────────────────────┘                └───────────────────────────┘
```

1. Frontend Dashboard: A single-page React app rendering live progress meters, historical session analysis charts, and settings.
2. FastAPI Backend: Python microservices serving session control endpoints, telemetry sync collection, and insights engine calculations.
3. Chrome Extension Companion: Lives in the browser toolbar, tracking active tab focus, domain category matches, and connection heartbeats.
4. Supabase Database: Houses profiles, focus sessions, metrics, browser categories, and account records securely using RLS policies.

---

## Screenshots

| View | Screenshot Path |
| --- | --- |
| Landing Page | docs/screenshots/landing-page.png |
| Authentication | docs/screenshots/login-page.png / docs/screenshots/register-page.png |
| Main Dashboard | docs/screenshots/dashboard-overview.png |
| Live Vision Monitoring | docs/screenshots/live-monitoring.png |
| AI Cognitive Insights | docs/screenshots/ai-insights-overview.png |
| Historical Graph Analysis | docs/screenshots/ai-insights-graphs.png |
| Coaching Recommendations | docs/screenshots/ai-insights-recommendations.png |
| Historical Sessions List | docs/screenshots/session-history.png |
| Toolbar Focus Extension | docs/screenshots/browser-extension.png |
| Security & Privacy Control | docs/screenshots/settings-privacy.png |

---

## Setup Instructions

Ensure Node.js (v18+) and Python (v3.10+) are installed.

### 1. Clone the Repository
```bash
git clone https://github.com/somiya-namdeo/Cognivue.git
cd Cognivue
```

### 2. Setup the FastAPI Backend
```bash
cd backend
python -m venv venv
# Windows venv activation
.\venv\Scripts\activate
# Linux/macOS venv activation
# source venv/bin/activate

pip install -r requirements.txt
# Copy environment variables and fill secrets
cp .env.example .env
uvicorn app.main:app --reload
```

### 3. Setup the React Frontend
```bash
cd ../frontend
npm install
# Copy environment variables and configure URL
cp .env.example .env
npm run dev
```

### 4. Load the Chrome Extension
1. Open Google Chrome and go to `chrome://extensions`.
2. Turn on Developer mode in the top-right toggle.
3. Click Load unpacked and select the `/extension` directory of this cloned repository.
4. Open the web dashboard, go to the Extension page, copy your connection key, and paste it into the toolbar extension popup to link it.

---

## Environment Variables Overview

### Backend (/backend/.env)
```ini
SUPABASE_URL=your_supabase_project_endpoint_url
SUPABASE_ANON_KEY=your_supabase_anonymous_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_private_service_role_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

### Frontend (/frontend/.env)
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Deployment

### Frontend (Vercel)
The React dashboard is optimized for Vercel deployment. Add VITE_API_BASE_URL pointing to your hosted API and run:
```bash
vercel --prod
```

### Backend (Render)
FastAPI can be deployed easily on Render as a Web Service. Specify:
* Build Command: pip install -r requirements.txt
* Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
* Add your Supabase keys and FRONTEND_URL in Render's environment dashboard.

---

## Privacy Guarantee
* No Camera Uploads: Facial landmarks mesh processing runs inside web workers locally in your browser sandbox. The raw webcam images never touch the network or are stored.
* Non-invasive Logging: Keystrokes, search forms, page content, and window details are ignored. The companion extension only logs top-level domain names and duration.

---

## Future Enhancements
* Automated break-nudging desktop native notifications.
* Focus profile customizations matching different ADHD study needs.
* Native Windows/macOS background activity category managers.

---

## Author & Collaboration

Designed, engineered, and maintained by Somiya Namdeo.

I am highly open to collaborating on cognitive intelligence systems, local WebAssembly model optimizations, or premium developer tools.

* Connect on LinkedIn: [Somiya Namdeo](https://linkedin.com)
* Send an Email: [somiya@example.com](mailto:namdeosomiya@gmail.com)
* Collaboration & Opportunities: If you are a recruiter, developer, or researcher looking to scale, integrate, or build upon Cognivue, feel free to open an Issue, submit a Pull Request, or reach out directly!
