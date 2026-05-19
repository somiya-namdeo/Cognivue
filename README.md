# Cognivue — Understand focus. Unlock performance.

Cognivue is a privacy-first, on-device cognitive intelligence platform designed to analyze real-time focus, fatigue, and productivity patterns using local computer vision gaze tracking, biometrics, and tab-activity metrics.

This repository is structured as a scalable monorepo to separate frontend client assets, local analytics servers, and browser helper modules.

---

## 📂 Repository Structure

```
cognivue/
├── frontend/         # React + Vite + TypeScript application (interactive dashboard, monitoring console)
├── backend/          # Local telemetry aggregator & DB syncing agent (planned)
├── extension/        # Browser session metrics & tab activities extension (planned)
├── ml-models/        # Pre-trained on-device weights & local execution scripts
└── README.md         # Repository documentation & guide
```

---

## ⚡ Getting Started (Frontend Dashboard)

The Cognivue frontend client is written in **React**, **TypeScript**, and **Tailwind CSS**, and uses **Vite** for fast, optimized hot-reloads.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or above) installed.

### Setup and Running the Dashboard
All command execution for the client dashboard happens inside the `/frontend` directory:

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Launch the local hot-reloading development server**:
   ```bash
   npm run dev
   ```

4. **Compile a production-ready minified bundle**:
   ```bash
   npm run build
   ```

---

## 🛸 Planned Sub-Systems

### 1. `/backend` (Planned Local Server)
A lightweight server (e.g. Express, Fastify, or Python FastAPI) built to securely collect posture and biometrics logs, aggregate analytics metrics, and provide secure local database persistence.
- See the [Backend README](./backend/README.md) for future integration steps.

### 2. `/extension` (Planned Browser Companion)
A lightweight Chrome / Manifest V3 extension designed to compute active active-tab time, scroll transitions, and workspace interruptions, sending unified metrics back to the local inference client.
- See the [Extension README](./extension/README.md) for initial companion layouts.

---

## 🛡️ Privacy & Local Inference
Cognivue runs entirely **on-device** using local inference web workers. Gaze, posture, and facial metrics are processed locally in your browser sandbox. **No camera data is ever sent to external cloud servers.**
