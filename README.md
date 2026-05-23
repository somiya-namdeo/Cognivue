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

## 🛸 Sub-Systems

### 1. `/backend` (Python FastAPI Server)
A robust FastAPI backend powered by Supabase, serving local telemetry aggregation, computer-vision metrics, sessions management, and AI-driven coaching insights.
- Ensure you have `.env` configured for Supabase authentication.
- See the [Backend README](./backend/README.md) for detailed setup.

### 2. `/extension` (Chrome Focus Coach Companion)
A Manifest V3 extension engineered to analyze tab behavior, domain time, and mode switching. Telemetry syncs seamlessly with the local backend to inform AI Insights.

**Installation (Developer Mode):**
1. Navigate to `chrome://extensions` in your browser.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `/extension` directory from this repository.
4. Pin the Cognivue extension to your toolbar.
5. In the main application's **Settings > Extension Page**, copy your Demo Connection Key and paste it into the extension popup.

---

## 🛡️ Privacy & Local Inference
Cognivue runs entirely **on-device** using local inference web workers. Gaze, posture, and facial metrics are processed locally in your browser sandbox. **No camera data is ever sent to external cloud servers.**
