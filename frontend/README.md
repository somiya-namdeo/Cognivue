# Cognivue Frontend Dashboard

An interactive, premium dark-mode React application displaying cognitive stats, real-time attention tracking, and personalized coaching charts.

## Sub-module Overview
This directory houses the client-side single page application (SPA) for Cognivue. It runs the computer-vision eye tracking and posture mesh locally inside browser sandbox web workers using MediaPipe libraries, fetches API telemetry from the FastAPI service layer, and maps historical focus statistics into charts using Recharts.

---

## Tech Stack
* Framework: React 18, Vite (Fast build system)
* Language: TypeScript (Strict type checks)
* Styling: Tailwind CSS (Harmonious sleek dark gradients)
* Animation: Framer Motion (Premium micro-interactions and transitions)
* Visualization: Recharts (Live attention maps, fatigue waves)
* Biometrics Inference: MediaPipe FaceMesh Web Worker bindings
* Routing: React Router DOM v6

---

## Folder Structure
```
frontend/
├── public/                 # Static assets (logo, icons, metadata)
├── src/
│   ├── assets/             # Global premium stylesheet & glassmorphic tokens
│   ├── components/         # Reusable modules (Sidebar, BrowserCVMonitor, Topbar, Modals)
│   ├── hooks/              # Custom reactivity hooks (useProfile, useAnimatedCounter)
│   ├── pages/              # Primary dashboard page views
│   │   ├── DashboardPage.tsx       # Historical summary and quick-stats
│   │   ├── LiveMonitoringPage.tsx  # Vision tracker & separated status HUD
│   │   ├── AIInsightsPage.tsx      # Fatigue analytics and coaching engine
│   │   ├── SessionsPage.tsx        # Deep work log registry
│   │   ├── ExtensionPage.tsx       # Companion setup & key copy
│   │   └── SettingsPage.tsx        # Profile options & data wipe purges
│   ├── services/           # API fetch wrappers (auth, sessions, telemetry, notifications)
│   ├── utils/              # Shared logic (extensionStatus, formatters)
│   ├── App.tsx             # Route registry
│   └── main.tsx            # App entrypoint
├── .env.example            # Sample client config
├── index.html              # HTML5 entry skeleton
├── package.json            # Node dependency registry
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite server and build plugins
```

---

## Environment Variables
Configure the backend connection inside /frontend/.env:
```ini
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Getting Started

### Prerequisites
Make sure you have Node.js (v18 or above) installed on your system.

### Local Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install all dependencies:
   ```bash
   npm install
   ```
3. Configure local environment variables:
   ```bash
   cp .env.example .env
   ```
   (Ensure VITE_API_BASE_URL points to your running FastAPI backend server).
4. Launch the local development server:
   ```bash
   npm run dev
   ```
   (Open http://localhost:5173 inside your browser).
5. Compile a production minified bundle:
   ```bash
   npm run build
   ```

---

## Key Dashboard Pages

1. Dashboard Overview: Displays your daily progress metrics, active time by domain category, distraction alerts, and highlights.
2. Live Monitoring: The focal point of browser biometric tracking. It fires the webcam locally, runs facial landmark scans at 30 FPS, and visualizes gaze trends (on-screen/away), fatigue ratios, and posture slouching in real time.
3. AI Insights: Runs historical cross-correlations between total focus time, blink frequencies, and workload intensity, giving burnout-prevention coaching guides.
4. Sessions: A chronologically ordered diary of past focus sessions, listing duration, average focus intensity, fatigue severity, and productivity.
5. Extension Panel: Displays the connection credentials and unpacked manual guide to link the companion Chrome Toolbar extension.
6. Settings Page: Manages display name modifications, webcam permissions, and a safe account wipe mechanism that permanently purges all profile records and telemetry logs.

---

## Production Deployment
The frontend is optimized for zero-config Vercel hosting:
1. Navigate to the root directory and run the Vercel CLI command:
   ```bash
   vercel
   ```
2. In Vercel's online dashboard, define VITE_API_BASE_URL in Project Settings > Environment Variables pointing to your deployed FastAPI Render service.
3. Vercel compiles a minified SPA bundle and serves it globally over static CDN.
