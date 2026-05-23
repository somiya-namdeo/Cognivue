# Real-Time CV Monitoring Foundation

This directory houses the privacy-first Real-Time Computer Vision (CV) Monitoring Foundation for **Cognivue**. It uses locally-executed machine learning inference models to analyze user engagement, visual fatigue, and screen presence directly on the client machine — and can optionally stream processed numeric metrics to the Cognivue FastAPI backend.

---

## 🔒 Privacy-First Design Guarantees

> **No raw video or images are ever sent to any backend, saved to disk, or uploaded anywhere.**

| What happens locally (RAM only) | What is sent to the backend |
|---|---|
| Raw webcam frames (never stored) | Blink rate (integer, blinks/min) |
| MediaPipe FaceMesh inference | Gaze status (`On Screen` / `Off Screen`) |
| Pose keypoint extraction | Posture status (`Upright` / `Slouched` / `Unknown`) |
| EAR blink threshold calculations | Attention state (`Focused` / `Distracted` / `Neutral`) |
| Sliding window fatigue scoring | Focus score (0–100) |
| Posture ratio & tilt computations | Cognitive load (0–100) |
| All frame rendering & HUD display | Fatigue score (0–100) |

**All webcam processing executes purely in local RAM. Zero video frames, photos, or raw matrices ever leave the client environment.**

---

## 🚀 Setup & Execution

### 1. Prerequisites
Ensure you have Python 3.9–3.11 installed. (MediaPipe has excellent support on these versions.)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Modes

#### 🖥️ Local Mode (No backend required)
Runs full CV monitoring with HUD display — metrics are logged to the console only:
```bash
python cv_monitor.py
```

With a specific camera index:
```bash
python cv_monitor.py --camera 1
```

#### 📡 Streaming Mode (Live telemetry to Cognivue backend)
First, ensure the FastAPI backend is running:
```bash
cd backend
uvicorn app.main:app --reload
```

Start a focus session (via Swagger UI at `http://127.0.0.1:8000/docs` → `POST /sessions/start`), then copy the returned `session_id` UUID.

Launch the CV monitor with streaming enabled using your user ID to automatically discover active sessions:
```bash
python cv_monitor.py --camera 0 --stream --user-id <user_id>
```

Alternatively, you can manually attach to a specific session:
```bash
python cv_monitor.py --camera 0 --stream --session-id <session_id>
```

Full example with all streaming options:
```bash
python cv_monitor.py \
  --camera 0 \
  --stream \
  --session-id 5d9fbfab-31ad-4916-8cd2-118788c34af4 \
  --backend-url http://127.0.0.1:8000 \
  --stream-interval 5
```

### 4. CLI Arguments Reference

| Argument | Type | Default | Description |
|---|---|---|---|
| `--camera` | `int` | `0` | System webcam index |
| `--stream` | flag | disabled | Enable backend telemetry streaming |
| `--user-id` | `str` | `None` | UUID of a user for automatic active session discovery |
| `--session-id` | `str` | `None` | UUID of an active Cognivue focus session (manual attachment) |
| `--backend-url` | `str` | `http://127.0.0.1:8000` | FastAPI backend base URL |
| `--stream-interval` | `int` | `5` | Seconds between each telemetry push |
| `--eval` | `str` | `None` | Evaluation mode: `posture`, `attention`, or `fatigue` |
| `--label` | `str` | `None` | Expected ground-truth label for evaluation |
| `--no-log` | flag | disabled | Disable saving evaluation JSON logs |

### 5. Controls
- Click the video preview window and press **`q`** or **`ESC`** to quit gracefully.

---

## 📊 Core Features

1. **Local FaceMesh Landmark Ingest**: Tracks eye contours and facial landmarks in real-time.
2. **Normalized Eye Aspect Ratio (EAR)**: Detects blinks using:
   $$EAR = \frac{||P_{\text{top}} - P_{\text{bottom}}||}{||P_{\text{outer}} - P_{\text{inner}}||}$$
3. **Double-Blink Mitigation**: Configurable blink cooldown (`BLINK_COOLDOWN_SECONDS = 0.25`) and state-machine hysteresis.
4. **Rolling Telemetry Windows**: True rolling blink rate per minute over a dynamic 60-second sliding window.
5. **Presence Tracking**: Measures face presence and tracks micro-interruption events.
6. **Multi-Factor Fatigue Engine**: Composite 0–100 score using blink deviation, prolonged closures, eye droop ratio, posture, and micro-interruptions.
7. **Attention Cascade**: Smoothed state machine: `Focused → Distracted → Away → Fatigue Warning`.
8. **Derived Scoring**: Focus score and cognitive load computed from fatigue, attention, and posture data.
9. **CPU Performance Guard**: Automatically scales down landmark rendering under 15 FPS.
10. **JSON Console Output**: Structured telemetry printed every 3 seconds (suppressed in eval mode):
    ```json
    {
      "face_detected": true,
      "blink_count": 5,
      "blink_rate": 14,
      "eye_open_ratio": 0.28,
      "fatigue_score": 12,
      "fatigue_level": "Low",
      "attention_state": "Focused",
      "attention_reason": "stable_focused",
      "posture_status": "Upright",
      "confidence": {
        "face": 100,
        "posture": 94,
        "attention": 98,
        "overall": 97
      }
    }
    ```

---

## 📡 Backend Streaming Details

When `--stream` is active and a valid `--session-id` is provided, the monitor sends a lightweight JSON payload every `--stream-interval` seconds (default: 5s) to `POST {backend_url}/metrics/add`.

### Payload sent to backend:
```json
{
  "session_id": "5d9fbfab-31ad-4916-8cd2-118788c34af4",
  "blink_rate": 14,
  "gaze_status": "On Screen",
  "posture_status": "Upright",
  "attention_state": "Focused",
  "active_tab": "cv_monitor_local",
  "cognitive_load": 42,
  "focus_score": 78,
  "fatigue_score": 12
}
```

### Derived Scoring Formulas:
- **`focus_score`** = `85 - (fatigue_score × 0.3) - [15 if Distracted] - [30 if Away] - [10 if Slouched/Leaning]`, clamped to `[0, 100]`
- **`cognitive_load`** = `40 + blink_deviation_factor + (fatigue_score × 0.3) + posture_instability_factor`, clamped to `[0, 100]`

### HUD Backend Status Indicator (bottom-left):
| Status | Meaning |
|---|---|
| `NOT STREAMING` | `--stream` flag not set or no `--session-id` provided |
| `OFFLINE` (red) | Backend unreachable — CV continues locally, retries next interval |
| `CONNECTED` (green) | Last sync succeeded — `LAST SYNC: HH:MM:SS` displayed |
| `ERROR` (amber) | Backend returned a non-201 response (e.g. 422 validation, 404 session not found) |

### Streaming Safety Guarantees:
- Telemetry is sent in a **background daemon thread** — the CV preview window never freezes.
- A **3-second network timeout** is enforced on every request.
- Streaming only begins **after the 8-second calibration is fully complete**.
- If the backend is offline or the session ends, the script **does not crash** — it logs the error and continues local CV processing.

---

## ⚙️ Multi-Parameter Startup Calibration

At startup, the system runs a **non-intrusive 8-second calibration phase** once a face is detected.

### What is Collected?
- **`baseline_ear`**: Average resting Eye Aspect Ratio when eyes are open.
- **`baseline_blink_rate`**: Resting blinks per minute (standard baseline: 15 bpm).
- **`baseline_face_position`**: 2D centroid $(X, Y)$ coordinates of face landmarks.
- **`baseline_shoulder_width`**: Scale-invariant pixel width between shoulder joints.
- **`baseline_posture_ratio`**: Vertical neck drop ratio (mid-shoulder to nose distance / shoulder width).
- **`baseline_tilt_ratio`**: Resting shoulder alignment tilt ratio.

### Dynamic Threshold Derivation:
- **Blink Threshold**: $\text{baseline\_ear} \times 0.65$
- **Blink Recovery (Hysteresis) Threshold**: $\text{baseline\_ear} \times 0.82$
- **Posture Slouch Threshold**: $\text{baseline\_posture\_ratio} \times 0.75$
- **Posture Lean Threshold**: $\max(0.15, \text{baseline\_tilt\_ratio} \times 1.8)$

A calibration summary is printed to the console upon completion and streaming activates immediately after.

---

## 📈 CLI Evaluation Mode

`cv_monitor.py` supports an objective CLI Evaluation Mode for repeatable benchmarking.

```bash
# Evaluate posture accuracy (Expected: Upright)
python cv_monitor.py --camera 0 --eval posture --label Upright

# Evaluate attention accuracy (Expected: Focused)
python cv_monitor.py --camera 0 --eval attention --label Focused

# Evaluate fatigue accuracy (Expected: Low)
python cv_monitor.py --camera 0 --eval fatigue --label Low
```

Disable file logging:
```bash
python cv_monitor.py --eval posture --label Upright --no-log
```

---

## 🧪 Standardized 120-Second Testing Protocol

1. **Calibration (0s–8s)**: Sit naturally, face forward, posture upright. Let the calibration complete.
2. **Phase 1 — Upright/Focused (8s–38s)**: Look at screen naturally, blink normally, sit straight.
3. **Phase 2 — Lateral Lean (38s–68s)**: Tilt torso significantly left or right.
4. **Phase 3 — Away/Face Block (68s–98s)**: Step out of frame or cover the camera.
5. **Phase 4 — Rapid Blink/Fatigue (98s–128s)**: Blink rapidly or close eyes for ~1s intervals and slouch.

---

## 🔧 Troubleshooting

### Backend won't connect (`OFFLINE` in red)
- Verify FastAPI backend is running: `uvicorn app.main:app --reload` from the `backend/` directory.
- Check that `--backend-url` matches your server (default: `http://127.0.0.1:8000`).
- Confirm your firewall is not blocking port 8000.

### `ERROR` status in HUD (amber)
- Verify your `--session-id` is a valid UUID from an **active** (not ended) focus session.
- Check console output for `[SYNC ERROR] 422 Validation Error Response Body: ...` details.
- Retrieve a fresh session ID from `POST /sessions/start` via Swagger: `http://127.0.0.1:8000/docs`.

### Streaming starts but metrics not appearing in database
- Ensure the session is not ended — ended sessions reject new metrics with 404.
- Check that `--stream-interval` is not set too high (default 5s is reliable).
- Confirm via `GET /metrics/session/{session_id}` at `http://127.0.0.1:8000/docs`.

### Camera not detected
```bash
# Try alternate camera indices
python cv_monitor.py --camera 1
python cv_monitor.py --camera 2
```

### MediaPipe/OpenCV not installed
```bash
pip install -r requirements.txt
```

---

## 📋 Evaluation Session Summary Output

When exiting (`q` or `ESC`), the terminal prints a full evaluation summary:

```text
==================================================
              EVALUATION SESSION SUMMARY
==================================================
Category:         POSTURE
Expected Label:   Upright
Total Samples:    20
Correct Samples:  19
Accuracy:         95.00%
--------------------------------------------------
Confusion Statistics (Predictions):
- Upright: 19 (95.0%)
- Slouched: 1 (5.0%)
==================================================
```
