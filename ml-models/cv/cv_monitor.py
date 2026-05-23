#!/usr/bin/env python3
"""
Cognivue Real-Time CV Monitoring Foundation.

This module provides a local, privacy-first computer vision implementation
to track user face presence, calculate blink metrics (Eye Aspect Ratio),
evaluate posture alignment (Upright, Slouched, Leaning, Unknown),
measure visual fatigue, and log clean telemetry data to the console.

Features:
- Local-only webcam stream processing (RAM only, no frames are saved/uploaded).
- Concurrent MediaPipe FaceMesh & Pose model processing.
- 8-Second Multi-Parameter startup calibration.
- Double-blink and flicker filtering using a blink cooldown timer.
- Dynamic sliding 60-second rolling window for true blinks-per-minute calculations.
- Posture detection using scale-invariant vertical drop and shoulder tilt ratios.
- Rolling posture smoothing filter (last 20 frames majority vote with 1.5s persistence).
- Multi-factor posture confidence indicator (landmark visibility + prediction stability).
- CPU Performance Guard automatically scaling down landmark rendering complexity.
- CLI-driven Evaluation Mode with HUD and console logging metrics.
"""

import sys
import time
import json
import argparse
import os
from datetime import datetime
import numpy as np
from collections import Counter
import threading
try:
    import requests
except ImportError:
    requests = None

# =====================================================================
# THREAD-SAFE GLOBAL SYNC STATE FOR BACKEND TELEMETRY
# =====================================================================
backend_status = "Not streaming"  # "Connected", "Offline", "Error", "Not streaming", "Waiting for active session"
last_sync_time = "N/A"
active_session_id = None
sync_thread_lock = threading.Lock()

def send_telemetry_async(backend_url, payload):
    """
    Spawns a background daemon thread to send cognitive metrics payload 
    to the Cognivue FastAPI backend. Ensures no GUI freezing or frame lags.
    """
    if requests is None:
        print("[SYNC ERROR] requests library is not available.", flush=True)
        global backend_status
        with sync_thread_lock:
            backend_status = "Error"
        return

    def send_worker():
        global backend_status, last_sync_time
        url = f"{backend_url.rstrip('/')}/metrics/add"
        headers = {"Content-Type": "application/json"}
        try:
            # Enforce 3-second timeout so backend offline never freezes the CV window
            response = requests.post(url, json=payload, headers=headers, timeout=3)
            if response.status_code == 201:
                print("[SYNC] Metrics sent successfully", flush=True)
                with sync_thread_lock:
                    backend_status = "Connected"
                    last_sync_time = datetime.now().strftime("%H:%M:%S")
            else:
                # Check for session ended/invalid
                if response.status_code == 400:
                    print("[SYNC ERROR] Session ended or invalid (400). Returning to waiting mode.", flush=True)
                    with sync_thread_lock:
                        global active_session_id
                        active_session_id = None
                        backend_status = "Waiting for active session"
                elif response.status_code == 422:
                    print(f"[SYNC ERROR] 422 Validation Error Response Body: {response.text}", flush=True)
                    with sync_thread_lock:
                        backend_status = "Error"
                else:
                    print("[SYNC ERROR] backend offline / invalid session", flush=True)
                    with sync_thread_lock:
                        backend_status = "Error"
        except requests.exceptions.RequestException as e:
            print("[SYNC ERROR] backend offline / invalid session", flush=True)
            with sync_thread_lock:
                backend_status = "Offline"

    thread = threading.Thread(target=send_worker, daemon=True)
    thread.start()


# Verify OpenCV and MediaPipe are installable before starting
try:
    import cv2
    import mediapipe as mp
except ImportError as e:
    print(f"[ERROR] Required dependencies are missing: {e}")
    print("Please install them by running: pip install -r requirements.txt")
    sys.exit(1)


# =====================================================================
# CONFIGURABLE PRIVACY-FIRST TELEMETRY SETTINGS
# =====================================================================
# Minimum elapsed time (seconds) required between registering consecutive blinks
# to prevent double-counting or camera frame flickers
BLINK_COOLDOWN_SECONDS = 0.25

# Telemetry log intervals (seconds)
TELEMETRY_LOG_INTERVAL = 3.0

# Posture scale-invariant threshold parameters (defaults before calibration)
SLOUCH_THRESHOLD = 0.35
LEAN_THRESHOLD = 0.15
MIN_LANDMARK_VISIBILITY = 0.5
POSTURE_WINDOW_SIZE = 20

# CPU Performance Guard threshold (FPS)
LOW_PERFORMANCE_LIMIT = 15

# =====================================================================
# MEDIAPIPE SOLUTIONS LANDMARKS (STANDARD MAPPINGS)
# =====================================================================
# Left eye horizontal corners & vertical borders (FaceMesh)
LEFT_EYE_HORIZ_OUTER = 33
LEFT_EYE_HORIZ_INNER = 133
LEFT_EYE_VERT_TOP = 159
LEFT_EYE_VERT_BOTTOM = 145

# Right eye horizontal corners & vertical borders (FaceMesh)
RIGHT_EYE_HORIZ_INNER = 362
RIGHT_EYE_HORIZ_OUTER = 263
RIGHT_EYE_VERT_TOP = 386
RIGHT_EYE_VERT_BOTTOM = 374

# Skeleton landmarks (Pose)
POSE_NOSE = 0
POSE_LEFT_SHOULDER = 11
POSE_RIGHT_SHOULDER = 12


def calculate_ear(landmarks, width, height, horiz_idx, vert_top_idx, vert_bottom_idx):
    """
    Calculate the Eye Aspect Ratio (EAR) for a single eye.

    Mathematical formula:
    EAR = ||P_top - P_bottom|| / ||P_outer - P_inner||

    Where P coords represent normalized landmarks scaled to image dimensions.
    """
    p_outer = np.array([landmarks[horiz_idx].x * width, landmarks[horiz_idx].y * height])
    opp_idx = 133 if horiz_idx == 33 else 362
    p_inner = np.array([landmarks[opp_idx].x * width, landmarks[opp_idx].y * height])
    p_top = np.array([landmarks[vert_top_idx].x * width, landmarks[vert_top_idx].y * height])
    p_bottom = np.array([landmarks[vert_bottom_idx].x * width, landmarks[vert_bottom_idx].y * height])
    
    horizontal_dist = np.linalg.norm(p_outer - p_inner)
    vertical_dist = np.linalg.norm(p_top - p_bottom)
    
    if horizontal_dist > 0:
        return vertical_dist / horizontal_dist
    return 0.0


def main():
    # Setup CLI command arguments
    parser = argparse.ArgumentParser(
        description="Cognivue local webcam computer vision monitor engine."
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="System index of the webcam to capture (default: 0)."
    )
    parser.add_argument(
        "--eval",
        type=str,
        choices=["posture", "attention", "fatigue"],
        default=None,
        help="Run in evaluation mode focusing on the given category."
    )
    parser.add_argument(
        "--label",
        type=str,
        default=None,
        help="Expected label for evaluation (e.g. 'Upright', 'Focused', 'Low')."
    )
    parser.add_argument(
        "--no-log",
        action="store_true",
        help="Disable logging metrics to evaluation_logs/ JSON files."
    )
    parser.add_argument(
        "--session-id",
        type=str,
        default=None,
        help="UUID of the active focus session for telemetry streaming."
    )
    parser.add_argument(
        "--user-id",
        type=str,
        default=None,
        help="UUID of the logged-in user to automatically discover active sessions."
    )
    parser.add_argument(
        "--backend-url",
        type=str,
        default="http://127.0.0.1:8000",
        help="URL of the Cognivue FastAPI backend (default: http://127.0.0.1:8000)."
    )
    parser.add_argument(
        "--stream",
        action="store_true",
        help="Enable real-time telemetry streaming to backend."
    )
    parser.add_argument(
        "--stream-interval",
        type=int,
        default=5,
        help="Interval in seconds for streaming metrics to backend (default: 5)."
    )
    args = parser.parse_args()


    # Validate evaluation arguments
    if args.eval is not None and args.label is None:
        print("[ERROR] Evaluation mode --eval requires an expected --label to compare against.")
        print("Example: python cv_monitor.py --eval posture --label Upright")
        sys.exit(1)

    # Initialize backend streaming status
    global backend_status, active_session_id
    active_session_id = args.session_id
    if args.stream:
        if not args.session_id and not args.user_id:
            print("[WARNING] --stream is enabled but neither --session-id nor --user-id was provided.")
            print("[WARNING] Telemetry will NOT be streamed. Running in local mode.")
            backend_status = "Not streaming"
        else:
            backend_status = "Waiting for active session" if not active_session_id else "Offline"
    else:
        backend_status = "Not streaming"


    print(f"[*] Starting Cognivue CV Monitor Foundation...")
    print(f"[*] Initializing camera stream index: {args.camera}")

    # Initialize webcam capture
    camera = cv2.VideoCapture(args.camera)
    if not camera.isOpened():
        print(f"\n[ERROR] Failed to open webcam at index {args.camera}.")
        print("[ERROR] Please verify your camera is connected and not in use by another app.")
        print("[ERROR] You can specify a different index using: python cv_monitor.py --camera <index>")
        sys.exit(1)

    print("[+] Camera stream successfully opened.")
    print("[+] Press 'q' on the preview window to exit gracefully.")

    # Initialize MediaPipe FaceMesh & Pose components
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    # Core state parameters (Face / Blinks / Calibration)
    blink_count = 0
    blink_timestamps = []
    last_blink_time = 0.0
    is_blinking = False
    blink_start_time = None
    prolonged_closures = []    # Timestamps of eye closures lasting 0.4s to 1.5s in the last 60s
    micro_interruptions = []   # Timestamps of short face loss events (<= 2s) in the last 60s
    
    # 8-Second Calibration Variables
    calibration_duration = 8.0
    calibration_start_time = None
    calibrated = False
    
    # Baseline Metrics
    baseline_ear = 0.30
    baseline_blink_rate = 15.0
    baseline_face_position = (0.5, 0.5)
    baseline_shoulder_width = 100.0
    baseline_posture_ratio = 0.40
    baseline_tilt_ratio = 0.02

    # Calibrated Thresholds
    blink_threshold = 0.20
    blink_recovery_threshold = 0.25
    posture_slouch_threshold = 0.30
    posture_lean_threshold = 0.15

    # Calibration Accumulator Lists
    calib_ears = []
    calib_face_positions = []
    calib_shoulder_widths = []
    calib_posture_ratios = []
    calib_tilt_ratios = []

    face_detected = False
    last_face_seen_time = time.time()
    last_face_present = True
    face_lost_start_time = None

    # Rolling window state smoothing parameters
    attention_history = []
    smoothed_attention = "Focused"
    face_movement_history = []  # Rolling window of face centroids to track high movement
    fatigue_history = []       # Historical rolling fatigue scores for smoothing
    high_fatigue_start_time = None  # Timer to trigger High fatigue state (needs 5+ seconds)
    fatigue_score = 0
    fatigue_level = "Low"
    recovery_multiplier = 1.0  # Dynamic multiplier to gradually decay fatigue score when alert
    ear_readings_60s = []      # (timestamp, ear) tuples for eye droop fraction calculation

    # Core state parameters (Posture)
    posture_history = []
    smoothed_posture = "Unknown"
    posture_confidence = 0
    posture_switch_candidate = None  # Track candidate posture for persistence check
    posture_switch_start_time = None

    # Prediction Confidence parameters
    face_confidence = 0
    attention_confidence = 0
    overall_confidence = 0

    # Attention State recovery timers and reasons
    distracted_start_time = None
    focused_stable_start_time = None
    away_start_time = None
    fatigue_warning_start_time = None
    attention_reason = "stable_focused"
    last_attention_reason = "stable_focused"
    posture_instability_active = False
    posture_instability_start_time = None
    posture_stable_upright_start_time = None
    last_distracted_reason = None

    # FPS tracking parameters
    prev_frame_time = 0.0
    fps = 0

    # Telemetry logging timer
    last_telemetry_time = time.time()
    last_stream_time = 0.0
    last_session_poll_time = 0.0


    # Evaluation Mode State
    eval_samples_total = 0
    eval_samples_correct = 0
    eval_confusion_stats = {}
    last_eval_time = 0.0
    eval_accuracy = 0.0

    # Pre-calculate BGR colors for clean premium HUD rendering
    COLOR_TEXT = (240, 240, 240)       # Soft white
    COLOR_HUD_BG = (20, 20, 20)        # Deep charcoal
    COLOR_FOCUSED = (230, 230, 0)      # Clean soft cyan/teal
    COLOR_FATIGUE = (0, 140, 255)      # Warm soft amber warning
    COLOR_AWAY = (150, 150, 150)       # Muted soft gray
    COLOR_DISTRACTED = (0, 200, 255)   # Light soft yellow-ish orange

    try:
        while True:
            ret, frame = camera.read()
            if not ret:
                print("\n[WARNING] Failed to grab frame from camera. Exiting monitor loop.")
                break

            current_time = time.time()
            h, w, _ = frame.shape

            # Calculate FPS
            if prev_frame_time > 0:
                time_diff = current_time - prev_frame_time
                if time_diff > 0:
                    fps = int(1.0 / time_diff)
            prev_frame_time = current_time

            # CPU Performance Guard activation check
            low_perf_mode = fps > 0 and fps < LOW_PERFORMANCE_LIMIT

            # Convert BGR image to RGB for MediaPipe inference processing
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results_mesh = face_mesh.process(rgb_frame)
            results_pose = pose.process(rgb_frame)

            # Determine face presence
            face_detected = False
            if results_mesh.multi_face_landmarks:
                face_detected = True
                last_face_seen_time = current_time

            # -----------------------------------------------------------------
            # STARTUP CALIBRATION TIMER INITIALIZATION
            # -----------------------------------------------------------------
            if face_detected and calibration_start_time is None and not calibrated:
                calibration_start_time = current_time
                print("[*] Face detected! Starting 8-second calibration phase...")

            # -----------------------------------------------------------------
            # FACE TRANSITION DETECTION (Track short absences / micro-interruptions)
            # -----------------------------------------------------------------
            if face_detected and not last_face_present:
                # Face recovered! Check if absence was a short micro-interruption (<= 2 seconds)
                if face_lost_start_time is not None:
                    lost_duration = current_time - face_lost_start_time
                    if lost_duration <= 2.0:
                        micro_interruptions.append(current_time)
                face_lost_start_time = None
            elif not face_detected and last_face_present:
                # Face lost! Mark the timestamp
                face_lost_start_time = current_time

            last_face_present = face_detected

            # =================================================================
            # 1. BLINK & FACE TELEMETRY EVALUATION
            # =================================================================
            avg_ear = 0.0
            left_shoulder_vis = 0.0
            right_shoulder_vis = 0.0
            p_l_sh, p_r_sh, p_nose = None, None, None
            is_high_movement = False

            if face_detected:
                # Extract first detected face landmarks
                landmarks = results_mesh.multi_face_landmarks[0].landmark

                # Calculate EAR for both eyes
                left_ear = calculate_ear(
                    landmarks, w, h,
                    LEFT_EYE_HORIZ_OUTER,
                    LEFT_EYE_VERT_TOP,
                    LEFT_EYE_VERT_BOTTOM
                )
                right_ear = calculate_ear(
                    landmarks, w, h,
                    RIGHT_EYE_HORIZ_OUTER,
                    RIGHT_EYE_VERT_TOP,
                    RIGHT_EYE_VERT_BOTTOM
                )

                # Average EAR across both eyes
                avg_ear = (left_ear + right_ear) / 2.0
                
                # Keep rolling 60s history of EAR readings
                ear_readings_60s.append((current_time, avg_ear))
                
                # Get Nose Tip Position
                nose_lm = landmarks[1]
                face_centroid = (nose_lm.x, nose_lm.y)

                # Track face movement for "high movement" distraction detection
                face_movement_history.append(face_centroid)
                if len(face_movement_history) > 30:
                    face_movement_history.pop(0)

                if len(face_movement_history) >= 10:
                    total_disp = 0.0
                    for i in range(1, len(face_movement_history)):
                        p1 = face_movement_history[i-1]
                        p2 = face_movement_history[i]
                        total_disp += np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
                    if total_disp > 0.25:
                        is_high_movement = True

                # -----------------------------------------------------------------
                # CALIBRATION PHASE DATA ACCUMULATION
                # -----------------------------------------------------------------
                if not calibrated and calibration_start_time is not None:
                    # Accumulate EAR (if eyes are open to avoid skewing baseline)
                    if avg_ear >= 0.20:
                        calib_ears.append(avg_ear)
                    calib_face_positions.append(face_centroid)

                    # Extract Pose details for calibration
                    if results_pose.pose_landmarks:
                        pose_landmarks = results_pose.pose_landmarks.landmark
                        l_sh = pose_landmarks[POSE_LEFT_SHOULDER]
                        r_sh = pose_landmarks[POSE_RIGHT_SHOULDER]
                        nose = pose_landmarks[POSE_NOSE]
                        
                        if l_sh.visibility >= 0.5 and r_sh.visibility >= 0.5:
                            p_l_sh_cal = np.array([l_sh.x * w, l_sh.y * h])
                            p_r_sh_cal = np.array([r_sh.x * w, r_sh.y * h])
                            p_nose_cal = np.array([nose.x * w, nose.y * h])
                            
                            p_sh_mid_cal = (p_l_sh_cal + p_r_sh_cal) / 2.0
                            sh_width = np.linalg.norm(p_l_sh_cal - p_r_sh_cal)
                            
                            if sh_width > 0:
                                p_ratio = (p_sh_mid_cal[1] - p_nose_cal[1]) / sh_width
                                t_ratio = abs(p_l_sh_cal[1] - p_r_sh_cal[1]) / sh_width
                                
                                calib_shoulder_widths.append(sh_width)
                                calib_posture_ratios.append(p_ratio)
                                calib_tilt_ratios.append(t_ratio)

                    # Check for calibration completion
                    if current_time - calibration_start_time >= calibration_duration:
                        baseline_ear = float(np.mean(calib_ears)) if calib_ears else 0.30
                        baseline_blink_rate = 15.0  # Default baseline blink rate (15 bpm)
                        
                        if calib_face_positions:
                            face_x_coords = [p[0] for p in calib_face_positions]
                            face_y_coords = [p[1] for p in calib_face_positions]
                            baseline_face_position = (float(np.mean(face_x_coords)), float(np.mean(face_y_coords)))
                        
                        baseline_shoulder_width = float(np.mean(calib_shoulder_widths)) if calib_shoulder_widths else 100.0
                        baseline_posture_ratio = float(np.mean(calib_posture_ratios)) if calib_posture_ratios else 0.40
                        baseline_tilt_ratio = float(np.mean(calib_tilt_ratios)) if calib_tilt_ratios else 0.02

                        # Derive dynamic thresholds
                        blink_threshold = baseline_ear * 0.65
                        blink_recovery_threshold = baseline_ear * 0.82
                        posture_slouch_threshold = baseline_posture_ratio * 0.75
                        posture_lean_threshold = max(0.15, baseline_tilt_ratio * 1.8)
                        
                        calibrated = True
                        
                        # Print Beautiful Calibration Summary
                        print("\n" + "=" * 50)
                        print("              CALIBRATION SUMMARY")
                        print("=" * 50)
                        print(f"Baseline EAR:             {baseline_ear:.4f}")
                        print(f"Baseline Blink Rate:      {baseline_blink_rate:.1f} bpm")
                        print(f"Baseline Face Centroid:   ({baseline_face_position[0]:.4f}, {baseline_face_position[1]:.4f})")
                        print(f"Baseline Shoulder Width:  {baseline_shoulder_width:.2f} px")
                        print(f"Baseline Posture Ratio:   {baseline_posture_ratio:.4f}")
                        print(f"Baseline Tilt Ratio:      {baseline_tilt_ratio:.4f}")
                        print("-" * 50)
                        print(f"Blink Threshold:          {blink_threshold:.4f}")
                        print(f"Blink Recovery Threshold: {blink_recovery_threshold:.4f}")
                        print(f"Posture Slouch Threshold: {posture_slouch_threshold:.4f}")
                        print(f"Posture Lean Threshold:   {posture_lean_threshold:.4f}")
                        print("=" * 50 + "\n", flush=True)

                # -----------------------------------------------------------------
                # STABLE BLINK & EYE CLOSURE HYSTERESIS STATE MACHINE
                # -----------------------------------------------------------------
                # Before calibration completes, use temporary default thresholds
                curr_blink_thresh = blink_threshold if calibrated else 0.20
                curr_recovery_thresh = blink_recovery_threshold if calibrated else 0.25

                if not is_blinking:
                    # Eye is open, waiting to drop below threshold
                    if avg_ear < curr_blink_thresh:
                        is_blinking = True
                        blink_start_time = current_time
                else:
                    # Eye is closed, waiting to rise above recovery threshold
                    if avg_ear >= curr_recovery_thresh:
                        duration = current_time - blink_start_time
                        is_blinking = False
                        blink_start_time = None
                        
                        # Validate duration (80ms to 800ms) to eliminate twitches and noise
                        if 0.08 <= duration <= 0.8:
                            if current_time - last_blink_time >= BLINK_COOLDOWN_SECONDS:
                                blink_count += 1
                                blink_timestamps.append(current_time)
                                last_blink_time = current_time
                        # Prolonged closures between 0.4s and 1.5s (indicates micro-naps)
                        elif 0.4 < duration <= 1.5:
                            prolonged_closures.append(current_time)
                            # Still count as a blink but mark as prolonged
                            if current_time - last_blink_time >= BLINK_COOLDOWN_SECONDS:
                                blink_count += 1
                                blink_timestamps.append(current_time)
                                last_blink_time = current_time

                # CPU Performance Guard: Skip dense node drawing if CPU is throttled
                if not low_perf_mode:
                    for idx in [LEFT_EYE_HORIZ_OUTER, LEFT_EYE_HORIZ_INNER, LEFT_EYE_VERT_TOP, LEFT_EYE_VERT_BOTTOM,
                                RIGHT_EYE_HORIZ_OUTER, RIGHT_EYE_HORIZ_INNER, RIGHT_EYE_VERT_TOP, RIGHT_EYE_VERT_BOTTOM]:
                        lm = landmarks[idx]
                        cx, cy = int(lm.x * w), int(lm.y * h)
                        cv2.circle(frame, (cx, cy), 2, (255, 255, 255), -1)

            else:
                avg_ear = 0.0
                is_blinking = False
                blink_start_time = None
                face_movement_history.clear()

            # Prune sliding rolling window histories to the last 60 seconds
            blink_timestamps = [t for t in blink_timestamps if current_time - t <= 60.0]
            blink_rate_per_minute = len(blink_timestamps)

            prolonged_closures = [t for t in prolonged_closures if current_time - t <= 60.0]
            micro_interruptions = [t for t in micro_interruptions if current_time - t <= 60.0]
            ear_readings_60s = [r for r in ear_readings_60s if current_time - r[0] <= 60.0]

            # =================================================================
            # 2. POSTURE DETECTION ENGINE
            # =================================================================
            posture_frame_state = "Unknown"

            if results_pose.pose_landmarks:
                pose_landmarks = results_pose.pose_landmarks.landmark
                l_sh = pose_landmarks[POSE_LEFT_SHOULDER]
                r_sh = pose_landmarks[POSE_RIGHT_SHOULDER]
                nose = pose_landmarks[POSE_NOSE]

                left_shoulder_vis = l_sh.visibility
                right_shoulder_vis = r_sh.visibility

                # Ignore low-confidence pose frames
                if left_shoulder_vis >= MIN_LANDMARK_VISIBILITY and right_shoulder_vis >= MIN_LANDMARK_VISIBILITY:
                    p_l_sh = np.array([l_sh.x * w, l_sh.y * h])
                    p_r_sh = np.array([r_sh.x * w, r_sh.y * h])
                    p_nose = np.array([nose.x * w, nose.y * h])

                    p_sh_mid = (p_l_sh + p_r_sh) / 2.0
                    shoulder_width = np.linalg.norm(p_l_sh - p_r_sh)

                    if shoulder_width > 0:
                        # Scale-invariant head-to-shoulder vertical drop
                        vertical_dist = p_sh_mid[1] - p_nose[1]
                        posture_ratio = vertical_dist / shoulder_width

                        # Scale-invariant shoulder height tilting
                        tilt_height = abs(p_l_sh[1] - p_r_sh[1])
                        tilt_ratio = tilt_height / shoulder_width

                        # Posture Cascade Evaluation using calibrated thresholds
                        curr_slouch_thresh = posture_slouch_threshold if calibrated else SLOUCH_THRESHOLD
                        curr_lean_thresh = posture_lean_threshold if calibrated else LEAN_THRESHOLD

                        if tilt_ratio > curr_lean_thresh:
                            posture_frame_state = "Leaning"
                        elif posture_ratio < curr_slouch_thresh:
                            posture_frame_state = "Slouched"
                        else:
                            posture_frame_state = "Upright"

            # Apply rolling-window majority state smoothing (last 20 frames)
            posture_history.append(posture_frame_state)
            if len(posture_history) > POSTURE_WINDOW_SIZE:
                posture_history.pop(0)

            majority_posture = Counter(posture_history).most_common(1)[0][0]

            # Posture Switch Persistence Check (1.5 seconds)
            if majority_posture != smoothed_posture:
                if majority_posture == posture_switch_candidate:
                    if posture_switch_start_time is None:
                        posture_switch_start_time = current_time
                    elif current_time - posture_switch_start_time >= 1.5:
                        smoothed_posture = majority_posture
                        posture_switch_candidate = None
                        posture_switch_start_time = None
                else:
                    posture_switch_candidate = majority_posture
                    posture_switch_start_time = current_time
            else:
                posture_switch_candidate = None
                posture_switch_start_time = None

            # Track posture stable upright consecutive duration and posture instability
            if smoothed_posture == "Upright":
                if posture_stable_upright_start_time is None:
                    posture_stable_upright_start_time = current_time
                elif current_time - posture_stable_upright_start_time >= 2.0:
                    if posture_instability_active:
                        print("[DEBUG] Posture instability cleared after stable upright recovery", flush=True)
                    posture_instability_active = False
                    posture_instability_start_time = None
            else:
                posture_stable_upright_start_time = None
                if smoothed_posture in ["Slouched", "Leaning"]:
                    if not posture_instability_active:
                        posture_instability_active = True
                        posture_instability_start_time = current_time

            # Calculate Posture Confidence (0-100)
            if smoothed_posture == "Unknown":
                posture_confidence = 0
            else:
                # Visibility score
                min_vis = min(left_shoulder_vis, right_shoulder_vis)
                vis_factor = (min_vis - MIN_LANDMARK_VISIBILITY) / (1.0 - MIN_LANDMARK_VISIBILITY)
                vis_score = max(0.0, min(1.0, vis_factor)) * 100.0
                # Stability score
                stability_score = (posture_history.count(majority_posture) / len(posture_history)) * 100.0
                posture_confidence = int((0.5 * vis_score) + (0.5 * stability_score))
                posture_confidence = max(0, min(100, posture_confidence))

            # =================================================================
            # 3. MULTI-FACTOR FATIGUE ENGINE (0-100 score)
            # =================================================================
            # 1. Blink Rate contribution (30% Weight): Deviation from baseline (bpm)
            blink_rate_deviation = abs(blink_rate_per_minute - baseline_blink_rate)
            blink_points = min(1.0, blink_rate_deviation / 15.0) * 30.0

            # 2. Long Blink Frequency contribution (25% Weight): prolonged closures
            closure_points = min(1.0, len(prolonged_closures) / 3.0) * 25.0

            # 3. Low Eye-Open Ratio (Eye Droop Duration) contribution (20% Weight)
            # Calculate fraction of the last 60s where eyes are below droop threshold
            droop_points = 0.0
            if face_detected and ear_readings_60s:
                droop_threshold = baseline_ear * 0.85
                low_ear_frames = sum(1 for r in ear_readings_60s if r[1] < droop_threshold)
                droop_ratio = low_ear_frames / len(ear_readings_60s)
                droop_points = min(1.0, droop_ratio * 2.0) * 20.0  # maxes out at 50% droop time

            # 4. Postural ergonomics contribution (15% Weight): Instability increases score
            posture_points = 0.0
            if smoothed_posture == "Slouched":
                posture_points = 15.0
            elif smoothed_posture == "Leaning":
                posture_points = 10.0

            # 5. Micro-interruptions contribution (10% Weight): Frequent short face losses
            interruption_points = min(1.0, len(micro_interruptions) / 4.0) * 10.0

            # Compute composite raw fatigue score
            raw_fatigue_score = int(blink_points + closure_points + droop_points + posture_points + interruption_points)
            raw_fatigue_score = max(0, min(100, raw_fatigue_score))

            # Fatigue Recovery Decay Heuristics
            is_recovering = (
                face_detected
                and calibrated
                and blink_rate_per_minute < 18
                and avg_ear >= baseline_ear * 0.90
                and len(prolonged_closures) == 0
                and smoothed_posture in ["Upright", "Unknown"]
                and len(micro_interruptions) == 0
            )

            if is_recovering:
                time_delta = current_time - prev_frame_time if prev_frame_time > 0 else 0.033
                recovery_multiplier = max(0.2, recovery_multiplier - (0.08 * time_delta))
            else:
                recovery_multiplier = 1.0

            raw_fatigue_score = int(raw_fatigue_score * recovery_multiplier)

            # Rolling average over the last 15 readings
            fatigue_history.append(raw_fatigue_score)
            if len(fatigue_history) > 15:
                fatigue_history.pop(0)

            smoothed_fatigue_score = int(np.mean(fatigue_history)) if fatigue_history else 0
            fatigue_score = smoothed_fatigue_score

            # Classify fatigue severity levels with 5-second hysteresis timing trigger
            if smoothed_fatigue_score < 45:
                fatigue_level = "Low"
                high_fatigue_start_time = None
            elif 45 <= smoothed_fatigue_score <= 70:
                fatigue_level = "Medium"
                high_fatigue_start_time = None
            else:  # smoothed_fatigue_score > 70
                if high_fatigue_start_time is None:
                    high_fatigue_start_time = current_time
                
                # Smoothed score must stay above 70 for 5+ seconds to declare High fatigue
                if current_time - high_fatigue_start_time >= 5.0:
                    fatigue_level = "High"
                else:
                    fatigue_level = "Medium"

            # =================================================================
            # 4. REFINED ATTENTION CASCADE & SMOOTHING
            # =================================================================
            # Evaluate current stable focused criteria:
            # - face_detected is True
            # - fatigue_level is Low or Medium
            # - smoothed_posture is Upright or Unknown
            # - not is_high_movement
            is_currently_stable_focused = (
                face_detected
                and fatigue_level in ["Low", "Medium"]
                and smoothed_posture in ["Upright", "Unknown"]
                and not is_high_movement
            )

            # Track fatigue warning start time
            if fatigue_level == "High":
                if fatigue_warning_start_time is None:
                    fatigue_warning_start_time = current_time
            else:
                fatigue_warning_start_time = None

            # Track focused stable start time
            if is_currently_stable_focused:
                if focused_stable_start_time is None:
                    focused_stable_start_time = current_time
            else:
                focused_stable_start_time = None

            # Determine raw attention state based on cascade priority
            if not face_detected:
                no_face_duration = current_time - last_face_seen_time
                if no_face_duration > 2.0:
                    raw_attention = "Away"
                    attention_reason = "face_missing"
                    if away_start_time is None:
                        away_start_time = current_time
                    distracted_start_time = None
                else:
                    raw_attention = "Distracted"
                    attention_reason = "face_missing"
                    if distracted_start_time is None:
                        distracted_start_time = current_time
                    away_start_time = None
            elif fatigue_level == "High" and fatigue_warning_start_time is not None and (current_time - fatigue_warning_start_time > 5.0):
                raw_attention = "Fatigue Warning"
                attention_reason = "fatigue_high"
                distracted_start_time = None
                away_start_time = None
            elif is_currently_stable_focused and focused_stable_start_time is not None and (current_time - focused_stable_start_time >= 3.0):
                raw_attention = "Focused"
                prev_attention = smoothed_attention if len(attention_history) > 0 else "Focused"
                if prev_attention != "Focused":
                    attention_reason = "stable_focused_recovery"
                    # Reset distracted triggers and timers
                    last_distracted_reason = None
                    posture_instability_active = False
                    posture_instability_start_time = None
                    micro_interruptions = []
                    attention_history = ["Focused"] * 10
                else:
                    attention_reason = "stable_focused"
                distracted_start_time = None
                away_start_time = None
            elif (smoothed_posture in ["Slouched", "Leaning"]) or is_high_movement or (len(micro_interruptions) >= 2):
                raw_attention = "Distracted"
                if smoothed_posture in ["Slouched", "Leaning"]:
                    attention_reason = "posture_instability"
                elif is_high_movement:
                    attention_reason = "high_movement"
                else:
                    attention_reason = "micro_interruptions"
                
                last_distracted_reason = attention_reason
                if distracted_start_time is None:
                    distracted_start_time = current_time
                away_start_time = None
            else:
                # Normal stable focused or awaiting recovery
                if is_currently_stable_focused:
                    prev_attention = smoothed_attention if len(attention_history) > 0 else "Focused"
                    if prev_attention in ["Distracted", "Away", "Fatigue Warning"]:
                        raw_attention = "Distracted"
                        attention_reason = "awaiting_focused_recovery"
                        if distracted_start_time is None:
                            distracted_start_time = current_time
                        away_start_time = None
                    else:
                        raw_attention = "Focused"
                        attention_reason = "stable_focused"
                        distracted_start_time = None
                        away_start_time = None
                else:
                    # Intermediate state (e.g. fatigue is High but < 5s)
                    prev_attention = smoothed_attention if len(attention_history) > 0 else "Focused"
                    if prev_attention in ["Distracted", "Away", "Fatigue Warning"]:
                        raw_attention = prev_attention
                        if prev_attention == "Distracted":
                            attention_reason = "awaiting_focused_recovery"
                            if distracted_start_time is None:
                                distracted_start_time = current_time
                        elif prev_attention == "Away":
                            attention_reason = "face_missing"
                            if away_start_time is None:
                                away_start_time = current_time
                        else:
                            attention_reason = "fatigue_high"
                    else:
                        raw_attention = "Focused"
                        attention_reason = "stable_focused"
                        distracted_start_time = None
                        away_start_time = None

            # Print debug message if reason shifts
            if attention_reason != last_attention_reason:
                print(f"[DEBUG] Attention transition: {last_attention_reason} -> {attention_reason} (State: {raw_attention})", flush=True)
                last_attention_reason = attention_reason

            # Apply rolling-window majority state smoothing (last 10 frames)
            attention_history.append(raw_attention)
            if len(attention_history) > 10:
                attention_history.pop(0)

            smoothed_attention = Counter(attention_history).most_common(1)[0][0]

            # Dynamic color coding for attention state BGR values
            if smoothed_attention == "Focused":
                state_color = COLOR_FOCUSED
            elif smoothed_attention == "Fatigue Warning":
                state_color = COLOR_FATIGUE
            elif smoothed_attention == "Distracted":
                state_color = COLOR_DISTRACTED
            else:
                state_color = COLOR_AWAY

            # =================================================================
            # 5. PREDICTION CONFIDENCE METRICS (0-100)
            # =================================================================
            face_confidence = 100 if face_detected else 0
            
            # Posture Confidence
            if smoothed_posture == "Unknown":
                posture_confidence = 0
            else:
                vis_factor = (min(left_shoulder_vis, right_shoulder_vis) - MIN_LANDMARK_VISIBILITY) / (1.0 - MIN_LANDMARK_VISIBILITY)
                vis_score = max(0.0, min(1.0, vis_factor)) * 100.0
                stability_score = (posture_history.count(majority_posture) / len(posture_history)) * 100.0
                posture_confidence = max(0, min(100, int(0.5 * vis_score + 0.5 * stability_score)))

            # Attention Confidence
            calib_score = 100 if calibrated else min(100, int((current_time - (calibration_start_time or current_time)) / 8.0 * 100))
            stability_score = (attention_history.count(smoothed_attention) / len(attention_history)) * 100.0 if attention_history else 0
            attention_confidence = max(0, min(100, int(0.4 * calib_score + 0.6 * stability_score)))

            # Overall Confidence
            if smoothed_attention == "Away":
                overall_confidence = 100
            else:
                overall_confidence = max(0, min(100, int((face_confidence + posture_confidence + attention_confidence) / 3.0)))

            # =================================================================
            # 6. EVALUATION MODE CONTROLLERS
            # =================================================================
            if args.eval is not None:
                # Determine predicted value for the eval category
                predicted_val = None
                if args.eval == "posture":
                    predicted_val = smoothed_posture
                elif args.eval == "attention":
                    predicted_val = smoothed_attention
                elif args.eval == "fatigue":
                    predicted_val = fatigue_level

                # Compare every 3 seconds
                if last_eval_time == 0.0 or current_time - last_eval_time >= 3.0:
                    eval_samples_total += 1
                    is_correct = predicted_val.lower() == args.label.lower()
                    if is_correct:
                        eval_samples_correct += 1
                    
                    eval_confusion_stats[predicted_val] = eval_confusion_stats.get(predicted_val, 0) + 1
                    eval_accuracy = (eval_samples_correct / eval_samples_total) * 100.0
                    
                    print(f"Expected: {args.label} | Predicted: {predicted_val} | Correct: {is_correct} | Accuracy: {eval_accuracy:.1f}%", flush=True)
                    last_eval_time = current_time

            if current_time - last_telemetry_time >= TELEMETRY_LOG_INTERVAL:
                telemetry = {
                    "face_detected": face_detected,
                    "blink_count": blink_count,
                    "blink_rate": blink_rate_per_minute,
                    "eye_open_ratio": round(avg_ear, 2) if face_detected else 0.0,
                    "fatigue_score": fatigue_score,
                    "fatigue_level": fatigue_level,
                    "attention_state": smoothed_attention,
                    "attention_reason": attention_reason,
                    "posture_status": smoothed_posture,
                    "confidence": {
                        "face": face_confidence,
                        "posture": posture_confidence,
                        "attention": attention_confidence,
                        "overall": overall_confidence
                    }
                }
                # Standard HUD Telemetry is not printed if in active evaluation mode to prevent stdout pollution
                if args.eval is None:
                    print(json.dumps(telemetry), flush=True)
                last_telemetry_time = current_time

            # Session Discovery Polling
            if args.stream and not active_session_id and args.user_id:
                if current_time - last_session_poll_time >= 5.0:
                    def poll_worker():
                        global active_session_id, backend_status
                        url = f"{args.backend_url.rstrip('/')}/sessions/active/{args.user_id}"
                        try:
                            response = requests.get(url, timeout=3)
                            if response.status_code == 200:
                                data = response.json()
                                if data and "id" in data and not data.get("end_time"):
                                    with sync_thread_lock:
                                        active_session_id = data["id"]
                                        backend_status = "Connected"
                                        print(f"\\n[*] Discovered active session: {active_session_id}", flush=True)
                        except Exception:
                            pass

                    if requests is not None:
                        thread = threading.Thread(target=poll_worker, daemon=True)
                        thread.start()
                    last_session_poll_time = current_time

            # Telemetry streaming timer check (Do not stream during calibration)
            if calibrated and args.stream and active_session_id:
                if last_stream_time == 0.0 or current_time - last_stream_time >= args.stream_interval:
                    # Derived focus score
                    derived_focus = 85.0 - (fatigue_score * 0.3)
                    if smoothed_attention == "Distracted":
                        derived_focus -= 15.0
                    elif smoothed_attention == "Away":
                        derived_focus -= 30.0
                    
                    if smoothed_posture in ["Slouched", "Leaning"]:
                        derived_focus -= 10.0
                    
                    derived_focus_score = max(0, min(100, int(round(derived_focus))))

                    # Derived cognitive load
                    base_load = 40.0
                    blink_load_factor = 0.0
                    if blink_rate_per_minute < 10:
                        blink_load_factor = (10.0 - blink_rate_per_minute) * 4.0
                    elif blink_rate_per_minute > 22:
                        blink_load_factor = min(30.0, (blink_rate_per_minute - 22.0) * 3.0)
                    
                    fatigue_load_factor = fatigue_score * 0.3
                    
                    posture_load_factor = 0.0
                    if posture_instability_active and posture_instability_start_time is not None:
                        instability_duration = current_time - posture_instability_start_time
                        posture_load_factor = min(20.0, instability_duration * 1.0)
                    elif smoothed_posture in ["Slouched", "Leaning"]:
                        posture_load_factor = 10.0
                        
                    derived_cognitive_load = max(0, min(100, int(round(base_load + blink_load_factor + fatigue_load_factor + posture_load_factor))))

                    # Map states for backend compatibility (keep local telemetry detailed)
                    # TODO: Update backend schema later to support "Leaning" and "Fatigue Warning" directly.
                    mapped_gaze = "On Screen" if face_detected else "Off Screen"
                    mapped_posture = "Unknown" if smoothed_posture == "Leaning" else (smoothed_posture if smoothed_posture != "Unknown" else "Unknown")
                    mapped_attention = "Neutral" if smoothed_attention in ["Away", "Fatigue Warning"] else smoothed_attention

                    stream_payload = {
                        "session_id": active_session_id,
                        "blink_rate": min(60, max(0, int(blink_rate_per_minute))),
                        "gaze_status": mapped_gaze,
                        "posture_status": mapped_posture,
                        "attention_state": mapped_attention,
                        "active_tab": "cv_monitor_local",
                        "cognitive_load": derived_cognitive_load,
                        "focus_score": derived_focus_score,
                        "fatigue_score": min(100, max(0, int(fatigue_score)))
                    }
                    
                    send_telemetry_async(args.backend_url, stream_payload)
                    last_stream_time = current_time


            # =================================================================
            # HUD VISUAL DRAWINGS & ALIGNMENTS
            # =================================================================
            # Draw shoulder and head guide markers if available
            if p_l_sh is not None and p_r_sh is not None and p_nose is not None:
                sh_color = (240, 240, 240)  # Soft white
                guide_color = COLOR_FOCUSED if smoothed_posture == "Upright" else (COLOR_FATIGUE if smoothed_posture == "Slouched" else COLOR_AWAY)

                # Draw shoulder horizontal guide
                cv2.line(frame, (int(p_l_sh[0]), int(p_l_sh[1])), (int(p_r_sh[0]), int(p_r_sh[1])), sh_color, 1, cv2.LINE_AA)
                
                # Draw vertical head-to-shoulder alignment line
                p_sh_mid = (p_l_sh + p_r_sh) / 2.0
                cv2.line(frame, (int(p_nose[0]), int(p_nose[1])), (int(p_sh_mid[0]), int(p_sh_mid[1])), guide_color, 1, cv2.LINE_AA)

                # Node circles
                cv2.circle(frame, (int(p_l_sh[0]), int(p_l_sh[1])), 4, sh_color, -1)
                cv2.circle(frame, (int(p_r_sh[0]), int(p_r_sh[1])), 4, sh_color, -1)
                cv2.circle(frame, (int(p_nose[0]), int(p_nose[1])), 4, guide_color, -1)

            # =================================================================
            # Sleek Minimalist HUD Rendering
            # =================================================================
            # Overlay translucent top panel bar (increased height for two lines of HUD)
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, 52), COLOR_HUD_BG, -1)
            frame = cv2.addWeighted(overlay, 0.75, frame, 0.25, 0)

            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.40
            thickness = 1

            # 1. State Label (y=20)
            cv2.putText(frame, "STATE: ", (10, 20), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
            cv2.putText(frame, smoothed_attention.upper(), (58, 20), font, font_scale, state_color, thickness + 1, cv2.LINE_AA)

            # 2. Fatigue Level & Score
            fatigue_text_color = COLOR_FOCUSED if fatigue_level == "Low" else (COLOR_FATIGUE if fatigue_level == "Medium" else (0, 0, 255))
            cv2.putText(frame, "FATIGUE: ", (160, 20), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
            cv2.putText(frame, f"{fatigue_level.upper()} ({fatigue_score})", (225, 20), font, font_scale, fatigue_text_color, thickness + 1, cv2.LINE_AA)

            # 3. Blink Rate
            cv2.putText(frame, "RATE: ", (315, 20), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
            cv2.putText(frame, f"{blink_rate_per_minute}/min", (360, 20), font, font_scale, COLOR_TEXT, thickness + 1, cv2.LINE_AA)

            # 4. Posture Status
            posture_text_color = COLOR_FOCUSED if smoothed_posture == "Upright" else (COLOR_FATIGUE if smoothed_posture in ["Slouched", "Leaning"] else COLOR_AWAY)
            cv2.putText(frame, "POST: ", (430, 20), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
            cv2.putText(frame, f"{smoothed_posture.upper()} ({posture_confidence}%)", (475, 20), font, font_scale, posture_text_color, thickness + 1, cv2.LINE_AA)

            # 5. Performance FPS Tracker
            fps_tag = f"FPS: {fps} (ECO)" if low_perf_mode else f"FPS: {fps}"
            cv2.putText(frame, fps_tag, (w - 75, 20), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)

            # 6. Backend Sync Status (y=42)
            cv2.putText(frame, "BACKEND: ", (10, 42), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
            with sync_thread_lock:
                status_str = backend_status
                sync_time_str = last_sync_time
            
            if status_str == "Connected":
                status_color = (0, 230, 0)       # Vibrant green
                if active_session_id:
                    cv2.putText(frame, f"Session: {active_session_id[:8]}", (220, 42), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
                    cv2.putText(frame, f"LAST SYNC: {sync_time_str}", (370, 42), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
                else:
                    cv2.putText(frame, f"LAST SYNC: {sync_time_str}", (220, 42), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)
            elif status_str == "Offline":
                status_color = (0, 0, 255)       # Red
            elif status_str == "Error":
                status_color = COLOR_FATIGUE     # Warm amber
            elif status_str == "Waiting for active session":
                status_color = COLOR_DISTRACTED  # Yellow-orange
            else:
                status_color = COLOR_AWAY        # Muted gray

            cv2.putText(frame, status_str.upper(), (80, 42), font, font_scale, status_color, thickness + 1, cv2.LINE_AA)
            
            if status_str != "Not streaming" and status_str != "Connected" and status_str != "Waiting for active session":
                cv2.putText(frame, f"LAST SYNC: {sync_time_str}", (220, 42), font, font_scale, COLOR_TEXT, thickness, cv2.LINE_AA)


            # 6. UX Calibration Prompt: "Unknown - move back slightly" when shoulders are not visible
            if smoothed_posture == "Unknown" and calibrated:
                # Render a premium calibration banner at the bottom center of the screen
                banner_w = int(w * 0.7)
                banner_h = 32
                bx = int((w - banner_w) / 2)
                by = h - 45
                
                banner_overlay = frame.copy()
                cv2.rectangle(banner_overlay, (bx, by), (bx + banner_w, by + banner_h), COLOR_HUD_BG, -1)
                frame = cv2.addWeighted(banner_overlay, 0.70, frame, 0.30, 0)
                
                calib_str = "Unknown - move back slightly"
                # Center text inside banner
                (t_w, t_h), _ = cv2.getTextSize(calib_str, font, font_scale, thickness)
                tx = bx + int((banner_w - t_w) / 2)
                ty = by + int((banner_h + t_h) / 2)
                cv2.putText(frame, calib_str, (tx, ty), font, font_scale, COLOR_FATIGUE, thickness, cv2.LINE_AA)

            # 7. Startup Calibration Banner overlay (Only during first 8 seconds)
            if not calibrated and calibration_start_time is not None:
                elapsed_calib = current_time - calibration_start_time
                time_remaining = max(0.0, calibration_duration - elapsed_calib)
                
                banner_w = int(w * 0.75)
                banner_h = 36
                bx = int((w - banner_w) / 2)
                by = int((h - banner_h) / 2)
                
                banner_overlay = frame.copy()
                cv2.rectangle(banner_overlay, (bx, by), (bx + banner_w, by + banner_h), COLOR_HUD_BG, -1)
                frame = cv2.addWeighted(banner_overlay, 0.75, frame, 0.25, 0)
                
                calib_str = f"Calibrating... sit naturally and look at screen ({time_remaining:.1f}s)"
                # Center text inside banner
                (t_w, t_h), _ = cv2.getTextSize(calib_str, font, font_scale, thickness)
                tx = bx + int((banner_w - t_w) / 2)
                ty = by + int((banner_h + t_h) / 2)
                cv2.putText(frame, calib_str, (tx, ty), font, font_scale, COLOR_FATIGUE, thickness, cv2.LINE_AA)
            elif not calibrated and calibration_start_time is None:
                banner_w = int(w * 0.75)
                banner_h = 36
                bx = int((w - banner_w) / 2)
                by = int((h - banner_h) / 2)
                
                banner_overlay = frame.copy()
                cv2.rectangle(banner_overlay, (bx, by), (bx + banner_w, by + banner_h), COLOR_HUD_BG, -1)
                frame = cv2.addWeighted(banner_overlay, 0.75, frame, 0.25, 0)
                
                calib_str = "Align face to begin 8s calibration"
                (t_w, t_h), _ = cv2.getTextSize(calib_str, font, font_scale, thickness)
                tx = bx + int((banner_w - t_w) / 2)
                ty = by + int((banner_h + t_h) / 2)
                cv2.putText(frame, calib_str, (tx, ty), font, font_scale, COLOR_FATIGUE, thickness, cv2.LINE_AA)

            # =================================================================
            # 8. EVALUATION MODE HUD OVERLAY (Bottom Banner)
            # =================================================================
            if args.eval is not None:
                eval_banner_h = 30
                eval_overlay = frame.copy()
                cv2.rectangle(eval_overlay, (0, h - eval_banner_h), (w, h), (30, 20, 20), -1)
                frame = cv2.addWeighted(eval_overlay, 0.85, frame, 0.15, 0)
                
                predicted_val = "Unknown"
                if args.eval == "posture":
                    predicted_val = smoothed_posture
                elif args.eval == "attention":
                    predicted_val = smoothed_attention
                elif args.eval == "fatigue":
                    predicted_val = fatigue_level
                    
                eval_text = f"EVAL [{args.eval.upper()}]: Expected: {args.label} | Predicted: {predicted_val} | Accuracy: {eval_accuracy:.1f}% | Samples: {eval_samples_total}"
                cv2.putText(frame, eval_text, (10, h - 10), font, font_scale, (0, 255, 255), thickness, cv2.LINE_AA)

            # Display the visual feed
            cv2.imshow("Cognivue CV Monitor", frame)

            # Escape key handler (press q or Esc to exit)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:
                print("\n[*] Exiting CV monitor gracefully...")
                break

    except KeyboardInterrupt:
        print("\n[*] CV monitor interrupted by user keyboard.")

    finally:
        # Graceful cleanup of camera, mesh, & pose resources
        camera.release()
        cv2.destroyAllWindows()
        print("[+] Webcam device released.")
        print("[+] OpenCV window closed. Offline.")

        # Print Evaluation confusion summary and save logs
        if args.eval is not None:
            print("\n" + "=" * 50)
            print("              EVALUATION SESSION SUMMARY")
            print("=" * 50)
            print(f"Category:         {args.eval.upper()}")
            print(f"Expected Label:   {args.label}")
            print(f"Total Samples:    {eval_samples_total}")
            print(f"Correct Samples:  {eval_samples_correct}")
            print(f"Accuracy:         {eval_accuracy:.2f}%")
            print("-" * 50)
            print("Confusion Statistics (Predictions):")
            for pred_label, count in eval_confusion_stats.items():
                pct = (count / eval_samples_total) * 100.0 if eval_samples_total > 0 else 0.0
                print(f"- {pred_label}: {count} ({pct:.1f}%)")
            print("=" * 50 + "\n", flush=True)

            # Log metrics to file unless --no-log is enabled
            if not args.no_log:
                try:
                    log_dir = "ml-models/cv/evaluation_logs"
                    os.makedirs(log_dir, exist_ok=True)
                    
                    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                    log_filename = f"eval_{args.eval}_{args.label.replace(' ', '_')}_{timestamp_str}.json"
                    log_filepath = os.path.join(log_dir, log_filename)
                    
                    eval_data = {
                        "timestamp": datetime.now().isoformat(),
                        "evaluation_category": args.eval,
                        "expected_label": args.label,
                        "total_samples": eval_samples_total,
                        "correct_samples": eval_samples_correct,
                        "accuracy_percent": round(eval_accuracy, 2) if eval_samples_total > 0 else 0.0,
                        "confusion_statistics": eval_confusion_stats
                    }
                    
                    with open(log_filepath, "w") as f:
                        json.dump(eval_data, f, indent=2)
                    print(f"[+] Saved evaluation metrics to: {log_filepath}")
                except Exception as e:
                    print(f"[ERROR] Failed to save evaluation JSON log: {e}")


if __name__ == "__main__":
    main()
