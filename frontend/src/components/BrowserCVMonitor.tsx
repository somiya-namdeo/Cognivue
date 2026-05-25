import { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, ShieldAlert, Activity, VideoOff } from 'lucide-react';
import { FaceMesh } from '@mediapipe/face_mesh';
import type { Results } from '@mediapipe/face_mesh';

import { API_BASE_URL } from '../services/api';

interface BrowserCVMonitorProps {
  isActive: boolean;
  sessionId: string | null;
}

export function BrowserCVMonitor({ isActive, sessionId }: BrowserCVMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceMeshRef = useRef<any>(null);
  const isTrackingRef = useRef<boolean>(false);
  
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cvStreamStatus, setCvStreamStatus] = useState<'Waiting' | 'Connected' | 'Offline' | 'Error'>('Waiting');

  // CV Metric States
  const metricsRef = useRef({
    face_detected: false,
    blink_count: 0,
    blink_rate: 0,
    fatigue_score: 10, // Default low
    raw_fatigue: 10,
    focus_score: 85,
    cognitive_load: 40,
    gaze_status: 'Uncertain' as 'On Screen' | 'Off Screen' | 'Uncertain',
    posture_status: 'Unknown' as 'Upright' | 'Slouched' | 'Unknown',
    ui_posture_label: 'Unknown',
    attention_state: 'Neutral' as 'Focused' | 'Distracted' | 'Neutral',
    ui_attention_label: 'Neutral',
    eye_open_ratio: 0.0,
    face_center_x: 0.0,
    face_center_y: 0.0,
    smoothed_blink_rate: 0,
    focus_cap_reason: 'None',
    tracking_confidence: 0.0,
  });

  // Smoothing buffers
  const smoothingRef = useRef({
    gazeHistory: [] as string[],
    postureHistory: [] as string[],
    attentionHistory: [] as string[],
    lastFaceTime: Date.now()
  });

  // EAR tracking
  const earRef = useRef({
    framesCount: 0,
    baselineEar: 0,
    isCalibrated: false
  });

  // Helper refs for tracking over time
  const postureRef = useRef({
    baselineX: 0,
    baselineY: 0,
    framesCount: 0,
    isCalibrated: false,
  });

  const blinkTrackerRef = useRef({
    lastEar: 0.3,
    isBlinking: false,
    blinkTimestamps: [] as number[],
    sessionStartTime: Date.now(),
    lastBlinkTime: 0
  });

  // Math Helpers
  const getDistance = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  const startCamera = async () => {
    try {
      setPermissionState('prompt');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPermissionState('granted');
      initFaceMesh();
    } catch {
      setPermissionState('denied');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    isTrackingRef.current = false;
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    setCvStreamStatus('Waiting');
  };

  const processFrame = async () => {
    if (!isTrackingRef.current || !videoRef.current || !faceMeshRef.current) return;
    
    // Check if video is ready
    if (videoRef.current.readyState >= 2) {
      try {
        await faceMeshRef.current.send({ image: videoRef.current });
      } catch (err) {
        // Ignore minor frame drop errors
      }
    }
    
    if (isTrackingRef.current) {
      requestAnimationFrame(processFrame);
    }
  };

  const onResults = (results: Results) => {
    const now = Date.now();
    const hasFace = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
    
    let targetGaze = 'Uncertain';
    let targetPosture = 'Unknown';
    let targetAttention = 'Neutral';

    if (!hasFace) {
      if (now - smoothingRef.current.lastFaceTime > 1500) {
        // Lost face for > 1.5s
        targetGaze = 'Off Screen';
        targetAttention = 'Distracted';
        targetPosture = 'Unknown';
        metricsRef.current.ui_posture_label = 'Unknown';
        metricsRef.current.ui_attention_label = 'Away';
        
        // Decay focus smoothly
        metricsRef.current.focus_score = Math.max(10, metricsRef.current.focus_score - 2);
        metricsRef.current.cognitive_load = Math.max(metricsRef.current.cognitive_load, 65);
        metricsRef.current.tracking_confidence = Math.max(0, metricsRef.current.tracking_confidence - 0.1);
      } else {
        targetGaze = metricsRef.current.gaze_status;
        targetAttention = metricsRef.current.attention_state;
        targetPosture = metricsRef.current.posture_status;
        metricsRef.current.ui_attention_label = metricsRef.current.attention_state;
        metricsRef.current.tracking_confidence = Math.max(0, metricsRef.current.tracking_confidence - 0.05);
      }
      
      metricsRef.current.face_detected = false;
      metricsRef.current.raw_fatigue = Math.min(100, metricsRef.current.raw_fatigue + 0.1);
      
    } else {
      smoothingRef.current.lastFaceTime = now;
      metricsRef.current.face_detected = true;
      const landmarks = results.multiFaceLandmarks[0];

      // --- EAR (Eye Aspect Ratio) Math ---
      const leftEAR = (getDistance(landmarks[160], landmarks[144]) + getDistance(landmarks[158], landmarks[153])) / (2.0 * getDistance(landmarks[33], landmarks[133]));
      const rightEAR = (getDistance(landmarks[385], landmarks[380]) + getDistance(landmarks[387], landmarks[373])) / (2.0 * getDistance(landmarks[362], landmarks[263]));
      const avgEAR = (leftEAR + rightEAR) / 2.0;
      metricsRef.current.eye_open_ratio = avgEAR;

      // Calibrate EAR baseline
      if (!earRef.current.isCalibrated) {
        earRef.current.baselineEar += avgEAR;
        earRef.current.framesCount++;
        if (earRef.current.framesCount > 30) {
          earRef.current.baselineEar /= earRef.current.framesCount;
          earRef.current.isCalibrated = true;
        }
      }

      // Blink detection
      if (earRef.current.isCalibrated) {
        const blinkThreshold = earRef.current.baselineEar * 0.72;
        const recoveryThreshold = earRef.current.baselineEar * 0.85;

        if (avgEAR < blinkThreshold && !blinkTrackerRef.current.isBlinking) {
          if (now - blinkTrackerRef.current.lastBlinkTime > 200) {
            blinkTrackerRef.current.isBlinking = true;
          }
        } else if (avgEAR > recoveryThreshold && blinkTrackerRef.current.isBlinking) {
          blinkTrackerRef.current.isBlinking = false;
          blinkTrackerRef.current.lastBlinkTime = now;
          metricsRef.current.blink_count += 1;
          blinkTrackerRef.current.blinkTimestamps.push(now);
        }
      }

      // Clean up old blinks (> 60s)
      blinkTrackerRef.current.blinkTimestamps = blinkTrackerRef.current.blinkTimestamps.filter(t => now - t < 60000);
      metricsRef.current.blink_rate = blinkTrackerRef.current.blinkTimestamps.length;
      
      const elapsedSec = (now - blinkTrackerRef.current.sessionStartTime) / 1000;
      let targetBlinkRate = metricsRef.current.blink_rate;
      if (elapsedSec < 60 && elapsedSec > 5) {
        targetBlinkRate = (metricsRef.current.blink_count / elapsedSec) * 60;
      }
      
      // Smooth blink rate
      metricsRef.current.smoothed_blink_rate = metricsRef.current.smoothed_blink_rate * 0.9 + targetBlinkRate * 0.1;

      // --- Posture Math (Bounding Box Baseline) ---
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      for (let i = 0; i < landmarks.length; i++) {
        if (landmarks[i].x < minX) minX = landmarks[i].x;
        if (landmarks[i].x > maxX) maxX = landmarks[i].x;
        if (landmarks[i].y < minY) minY = landmarks[i].y;
        if (landmarks[i].y > maxY) maxY = landmarks[i].y;
      }
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      metricsRef.current.face_center_x = centerX;
      metricsRef.current.face_center_y = centerY;

      if (!postureRef.current.isCalibrated) {
        postureRef.current.baselineX += centerX;
        postureRef.current.baselineY += centerY;
        postureRef.current.framesCount++;
        if (postureRef.current.framesCount > 30) {
          postureRef.current.baselineX /= postureRef.current.framesCount;
          postureRef.current.baselineY /= postureRef.current.framesCount;
          postureRef.current.isCalibrated = true;
        }
        targetPosture = 'Unknown';
        metricsRef.current.ui_posture_label = 'Calibrating...';
      } else {
        const isSlouched = centerY > postureRef.current.baselineY + 0.10;
        const driftX = centerX - postureRef.current.baselineX;
        const isLeaning = Math.abs(driftX) > 0.12;

        if (isSlouched) {
          targetPosture = 'Slouched';
          metricsRef.current.ui_posture_label = 'Slouched';
        } else if (isLeaning) {
          targetPosture = 'Slouched'; // Backend safe
          metricsRef.current.ui_posture_label = driftX > 0 ? 'Leaning Left' : 'Leaning Right'; // Mirrored cam
        } else {
          targetPosture = 'Upright';
          metricsRef.current.ui_posture_label = 'Upright';
        }
      }

      // Gaze & Attention Logic
      targetGaze = 'On Screen';
      
      if (earRef.current.isCalibrated && (avgEAR < earRef.current.baselineEar * 0.5) || targetPosture === 'Slouched') {
        targetAttention = 'Distracted';
      } else {
        targetAttention = 'Focused';
      }

      // Dynamic Fatigue Logic
      let targetFatigue = metricsRef.current.raw_fatigue;
      if (metricsRef.current.smoothed_blink_rate > 25) {
        targetFatigue += 0.5;
      }
      if (earRef.current.isCalibrated && avgEAR < earRef.current.baselineEar * 0.6) {
        targetFatigue += 1.0;
      }
      if (targetGaze === 'On Screen' && targetAttention === 'Focused') {
        targetFatigue -= 0.5; // Faster recovery when stable
      }
      
      metricsRef.current.raw_fatigue = Math.min(100, Math.max(0, targetFatigue));

      // Exponential smoothing for fatigue
      const smoothed = metricsRef.current.fatigue_score * 0.85 + metricsRef.current.raw_fatigue * 0.15;
      
      // Clamp fatigue change per update
      let diff = smoothed - metricsRef.current.fatigue_score;
      if (diff > 6) diff = 6;
      if (diff < -4) diff = -4;
      
      metricsRef.current.fatigue_score = Math.min(100, Math.max(0, metricsRef.current.fatigue_score + diff));

      metricsRef.current.focus_cap_reason = 'None';
      
      let maxFocus = 100;
      if (metricsRef.current.fatigue_score >= 90) {
        maxFocus = 50;
        metricsRef.current.focus_cap_reason = 'Fatigue >= 90';
      } else if (metricsRef.current.fatigue_score >= 80) {
        maxFocus = 65;
        metricsRef.current.focus_cap_reason = 'Fatigue >= 80';
      }

      if (targetAttention === 'Focused') {
        const newFocus = metricsRef.current.focus_score + 1;
        metricsRef.current.focus_score = Math.min(maxFocus, newFocus);
        metricsRef.current.cognitive_load = 40;
      } else {
        // Make sure it doesn't stay stuck higher than the cap when not focused
        metricsRef.current.focus_score = Math.min(maxFocus, metricsRef.current.focus_score);
      }
      
      // Tracking Confidence Engine
      let confidenceTarget = 1.0;
      if (!earRef.current.isCalibrated) confidenceTarget -= 0.5;
      if (metricsRef.current.smoothed_blink_rate > 35) confidenceTarget -= 0.2;
      if (targetPosture === 'Unknown') confidenceTarget -= 0.2;
      if (targetAttention === 'Distracted') confidenceTarget -= 0.1;
      
      metricsRef.current.tracking_confidence = metricsRef.current.tracking_confidence * 0.9 + confidenceTarget * 0.1;
    }

    // Temporal Smoothing Function (requires 5 consecutive frames to change)
    const smooth = (arr: string[], val: string, current: string) => {
      arr.push(val);
      if (arr.length > 5) arr.shift();
      if (arr.length === 5 && arr.every(v => v === val)) return val;
      return current;
    };

    metricsRef.current.gaze_status = smooth(smoothingRef.current.gazeHistory, targetGaze, metricsRef.current.gaze_status) as any;
    metricsRef.current.posture_status = smooth(smoothingRef.current.postureHistory, targetPosture, metricsRef.current.posture_status) as any;
    metricsRef.current.attention_state = smooth(smoothingRef.current.attentionHistory, targetAttention, metricsRef.current.attention_state) as any;
    if (hasFace) {
       metricsRef.current.ui_attention_label = metricsRef.current.attention_state;
    }
  };

  const initFaceMesh = async () => {
    try {
      setModelStatus('loading');
      const faceMesh = new FaceMesh({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
      
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;
      
      // Warm up model
      await faceMesh.initialize();
      setModelStatus('ready');
      isTrackingRef.current = true;
      
      // Start processing loop
      processFrame();
      
    } catch {
      setModelStatus('error');
    }
  };

  // Main lifecycle handling
  useEffect(() => {
    if (isActive && sessionId) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive, sessionId]);

  // Telemetry Interval Push
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (isActive && sessionId && permissionState === 'granted' && modelStatus === 'ready') {
      intervalId = setInterval(async () => {
        if (!isTrackingRef.current || !isActive || !sessionId) return;
        
        try {
          const m = metricsRef.current;
          
          const payload = {
            session_id: sessionId,
            blink_rate: m.blink_rate,
            gaze_status: m.gaze_status,
            posture_status: m.posture_status,
            attention_state: m.attention_state,
            active_tab: "browser_cv_monitor",
            cognitive_load: Math.round(m.cognitive_load),
            focus_score: Math.round(m.focus_score),
            fatigue_score: Math.round(m.fatigue_score)
          };
          
          const response = await fetch(`${API_BASE_URL}/metrics/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (response.status === 201) {
            setCvStreamStatus('Connected');
          } else {
            setCvStreamStatus('Error');
          }
        } catch (err) {
          setCvStreamStatus('Offline');
        }
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, sessionId, permissionState, modelStatus]);

  // (Debug UI polling removed to fix unused TS errors)

  // Rendering Logic
  return (
    <div className="w-full h-full min-h-[460px] relative overflow-hidden bg-black flex flex-col items-center justify-center rounded-2xl">
      
      {/* Video element - keep it visible but mirrored and styled */}
      <video 
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-1000 ${
          permissionState === 'granted' && isActive ? 'opacity-40' : 'opacity-0'
        }`}
      />
      
      {/* Visual Overlay - Scanline / Neural dots */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 z-10" />
      {isActive && permissionState === 'granted' && (
        <div className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 pointer-events-none animate-scan z-20 shadow-[0_0_10px_#22d3ee]" />
      )}
      
      {/* Status Badges */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 shadow-[0_0_10px_rgba(6,182,212,0.15)] backdrop-blur-md">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
            Browser CV Active
          </span>
        </div>
        
        {isActive && permissionState === 'granted' && (
          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-md transition-colors ${
            cvStreamStatus === 'Connected' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
              : cvStreamStatus === 'Waiting'
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.2)]'
                : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cvStreamStatus === 'Connected' ? 'bg-green-400 animate-pulse' : cvStreamStatus === 'Waiting' ? 'bg-yellow-400' : 'bg-red-400'}`} />
            <span className="text-[9px] font-bold tracking-wider uppercase">
              {cvStreamStatus}
            </span>
          </div>
        )}
      </div>


      {/* Posture Warning */}
      {isActive && permissionState === 'granted' && modelStatus === 'ready' && (!postureRef.current.isCalibrated || !earRef.current.isCalibrated) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md animate-pulse">
          Move slightly back for better posture tracking. Calibrating...
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-30 flex justify-between items-end">
        <div className="text-[10px] text-zinc-400 font-medium bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-2 max-w-[80%]">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Privacy lock: Frames stay local. Only processed metrics are sent to the server.</span>
        </div>
      </div>

      {/* State Messages (Centered) */}
      <div className="relative z-20 flex flex-col items-center text-center p-6">
        {!isActive && (
          <>
            <VideoOff className="w-12 h-12 text-zinc-500 mb-4" />
            <h3 className="text-zinc-400 font-semibold text-sm">Camera Offline</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-[200px]">Click 'Start Session' to begin live CV monitoring.</p>
          </>
        )}
        
        {isActive && permissionState === 'prompt' && (
          <>
            <CameraIcon className="w-12 h-12 text-cyan-500 mb-4 animate-pulse" />
            <h3 className="text-white font-semibold text-sm">Permission Required</h3>
            <p className="text-zinc-400 text-xs mt-2 max-w-[250px]">Please allow camera access in your browser to start local cognitive tracking.</p>
          </>
        )}

        {isActive && permissionState === 'denied' && (
          <>
            <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-white font-semibold text-sm">Permission Denied</h3>
            <p className="text-zinc-400 text-xs mt-2 max-w-[280px]">
              Camera access was denied. Please update your browser settings or use the Python CV Research Monitor (`python cv_monitor.py`).
            </p>
          </>
        )}

        {isActive && permissionState === 'granted' && modelStatus === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
            <h3 className="text-cyan-400 font-semibold text-sm tracking-widest uppercase">Initializing Neural Mesh</h3>
            <p className="text-zinc-500 text-[10px] mt-2">Loading local @mediapipe/face_mesh...</p>
          </div>
        )}

        {isActive && permissionState === 'granted' && modelStatus === 'error' && (
          <>
            <ShieldAlert className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-orange-400 font-semibold text-sm">Model Load Failed</h3>
            <p className="text-zinc-400 text-xs mt-2 max-w-[280px]">
              CV unavailable in browser. The app will continue working. You can fallback to the Python CV Research Monitor.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
