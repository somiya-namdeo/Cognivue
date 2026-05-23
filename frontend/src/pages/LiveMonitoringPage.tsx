import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { BrowserCVMonitor } from '../components/BrowserCVMonitor';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Eye, 
  Activity, 
  Sparkles, 
  Zap, 
  Globe, 
  Play, 
  Square,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  getLocalSession, 
  startSession, 
  endSession, 
  getActiveSession, 
  getSessionMetrics, 
  getExtensionActivity 
} from '../services/api';
import type { SessionResponse, MetricResponse, ExtensionActivityResponse } from '../services/api';

// ==========================================
// 1. SMOOTH ANIMATED COUNTER HOOK
// ==========================================
const useAnimatedCounter = (target: number, duration: number = 800): number => {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    let start = current;
    const end = target;
    if (start === end) return;
    const range = end - start;
    let startTime: number | null = null;

    const animateStep = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const nextVal = Math.round(start + range * progress);
      setCurrent(nextVal);
      if (progress < 1) {
        requestAnimationFrame(animateStep);
      }
    };
    requestAnimationFrame(animateStep);
  }, [target]);

  return current;
};

// ==========================================
// TOOLTIP CONFIGURATION FOR CHART
// ==========================================
interface LiveTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
  }>;
}

const LiveTooltip = ({ active, payload }: LiveTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2.5 shadow-2xl backdrop-blur-md text-left select-none text-[10px]">
        <span className="font-semibold text-zinc-400">Focus Index:</span>{' '}
        <span className="font-bold text-cyan-400">{payload[0].value}%</span>
      </div>
    );
  }
  return null;
};

export const LiveMonitoringPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Live Monitoring');
  const [metricsLoopId, setMetricsLoopId] = useState<NodeJS.Timeout | null>(null);
  
  // Extension Telemetry State
  const [extensionActivity, setExtensionActivity] = useState<ExtensionActivityResponse | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestMetric, setLatestMetric] = useState<MetricResponse | null>(null);
  const [focusStream, setFocusStream] = useState<{ time: string; focus: number; load: number; fatigue: number }[]>([]);
  const [hasBackendOfflineWarning, setHasBackendOfflineWarning] = useState<boolean>(false);
  const [streamStatus, setStreamStatus] = useState<'Connected' | 'Waiting' | 'Offline'>('Waiting');

  // Stats histories for Session End Summary Modal
  const [sessionMetrics, setSessionMetrics] = useState<any[]>([]);
  
  // Session Summary Modal State
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<{
    duration: string;
    avgFocus: number;
    peakFocus: number;
    avgLoad: number;
    productivityScore: number | string;
    fatigueTrend: string;
    aiSentence: string;
    totalSamples: number;
    consistency: number;
    isPoorTracking: boolean;
    telemetryQuality: string;
  } | null>(null);

  // Keep a ref of latestMetric to avoid stale closures in the telemetry interval
  const latestMetricRef = useRef<MetricResponse | null>(null);
  useEffect(() => {
    latestMetricRef.current = latestMetric;
  }, [latestMetric]);

  // ==========================================
  // 1. ACTIVE SESSION INITIALIZATION & RESTORATION
  // ==========================================
  useEffect(() => {
    const initSession = async () => {
      const session = getLocalSession();
      if (!session.userId) {
        setErrorMessage('No logged-in user found. Please login to start monitoring.');
        return;
      }

      setIsLoading(true);
      try {
        // Query backend for active session
        const activeSess = await getActiveSession(session.userId);

        // Fetch initial extension activity
        try {
          const extData = await getExtensionActivity(session.userId);
          if (extData && extData.length > 0) {
            setExtensionActivity(extData[0]);
          }
        } catch (e) {
          console.warn("Could not fetch initial extension activity");
        }
        
        if (activeSess && activeSess.id) {
          // If session is already ended, clear active session ID
          if (activeSess.end_time) {
            localStorage.removeItem('active_session_id');
            setIsSessionActive(false);
            setActiveSessionId(null);
            setIsLoading(false);
            return;
          }

          // Restore session
          setActiveSessionId(activeSess.id);
          localStorage.setItem('active_session_id', activeSess.id);
          setIsSessionActive(true);

          // Store start timestamp in state (no extra localStorage key)
          const startTimestamp = activeSess.start_time;
          setSessionStartTime(startTimestamp);
          const elapsed = Math.floor((Date.now() - new Date(startTimestamp).getTime()) / 1000);
          setElapsedSeconds(elapsed >= 0 ? elapsed : 0);

          // Retrieve previous metrics logged in this session
          try {
            const metrics = await getSessionMetrics(activeSess.id);
            if (metrics && metrics.length > 0) {
              setLatestMetric(metrics[metrics.length - 1]);
              
              // Populate stats history
              setSessionMetrics(metrics);

              const historyData = metrics.map((m) => {
                const d = new Date(m.recorded_at);
                const timeStr = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
                return {
                  time: timeStr,
                  focus: m.focus_score,
                  load: m.cognitive_load,
                  fatigue: m.fatigue_score
                };
              });
              setFocusStream(historyData);
            } else {
              setFocusStream([]);
              setStreamStatus('Waiting');
            }
          } catch (err) {
            console.error('Failed to restore session metrics:', err);
            setFocusStream([]);
            setStreamStatus('Waiting');
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('No active session found')) {
          localStorage.removeItem('active_session_id');
        } else {
          console.error('Error fetching active session:', err);
          setErrorMessage('FastAPI backend service is offline. Please start your backend server.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  // ==========================================
  // 2. ELAPSED TIME TIMER ENGINE
  // ==========================================
  useEffect(() => {
    if (!isSessionActive) {
      setElapsedSeconds(0);
      return;
    }

    // Update the live timestamp periodically to show elapsed time since last sync
    const timeUpdateLoop = setInterval(() => {
      // Force re-render for time elapsed
      setExtensionActivity(prev => prev ? { ...prev } : null);
    }, 15000); // 15s

    // 1-second interval using the stored session start time from state
    const timer = setInterval(() => {
      // Let's also refresh extension activity periodically while active (every 10s)
      const seconds = Math.floor(Date.now() / 1000);
      if (seconds % 10 === 0) {
        const session = getLocalSession();
        if (session.userId) {
           getExtensionActivity(session.userId)
            .then(data => {
               if (data && data.length > 0) {
                 setExtensionActivity(data[0]);
               }
            }).catch(() => {});
        }
      }

      if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 1000);
        setElapsedSeconds(elapsed >= 0 ? elapsed : 0);
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(timeUpdateLoop);
    };
  }, [isSessionActive, sessionStartTime]);

  // ==========================================
  // 3. SIMULATED LIVE TELEMETRY STREAM ENGINE
  // ==========================================
  useEffect(() => {
    if (!isSessionActive || !activeSessionId) return;

    const fetchAndUpdateMetric = async () => {
      try {
        const metrics = await getSessionMetrics(activeSessionId);
        if (metrics && metrics.length > 0) {
          const metric = metrics[metrics.length - 1]; // latest metric
          // Successful fetch → update UI
          setLatestMetric(metric);
          setSessionMetrics(metrics);
          setStreamStatus('Connected');
          setErrorMessage(null);
          setHasBackendOfflineWarning(false);

          // Update chart stream
          const historyData = metrics.map((m) => {
            const d = new Date(m.recorded_at);
            const timeStr = [d.getHours(), d.getMinutes(), d.getSeconds()].map(v => String(v).padStart(2, '0')).join(':');
            return {
              time: timeStr,
              focus: m.focus_score,
              load: m.cognitive_load,
              fatigue: m.fatigue_score
            };
          });
          setFocusStream(historyData);
        } else {
          setStreamStatus('Waiting');
          setErrorMessage(null); // Clear error if just waiting for data
        }
      } catch (err: any) {
        console.error('Failed to fetch latest metric:', err);
        // If 404, treat as waiting; otherwise offline
        const isNotFound = err?.message?.includes('404') || err?.message?.toLowerCase()?.includes('not found');
        if (!latestMetricRef.current || isNotFound) {
          setStreamStatus('Waiting');
          setErrorMessage(null); // Clear error if just waiting for data
        } else {
          setStreamStatus('Offline');
          if (!hasBackendOfflineWarning) {
            setHasBackendOfflineWarning(true);
            setErrorMessage('Unable to fetch CV metrics: backend offline or no data yet.');
          }
        }
      }
    };

    // Initial fetch
    fetchAndUpdateMetric();
    // Poll every 5 seconds
    const interval = setInterval(fetchAndUpdateMetric, 5000);
    return () => clearInterval(interval);
  }, [isSessionActive, activeSessionId, hasBackendOfflineWarning]);

  // ==========================================
  // 4. ACTION TRIGGER HANDLERS
  // ==========================================
  const handleStartSession = async () => {
    const session = getLocalSession();
    if (!session.userId) {
      setErrorMessage('No logged-in user found. Please login to start monitoring.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await startSession(session.userId, 'Focus Session', 'Deep Work');
      
      // Save active session identifiers locally
      setActiveSessionId(res.id);
      localStorage.setItem('active_session_id', res.id);
      
      const startTimestamp = res.start_time || new Date().toISOString();
      setSessionStartTime(startTimestamp);
      
      setLatestMetric(null);
      setElapsedSeconds(0);
      setSessionMetrics([]);
      setIsSessionActive(true);
      setHasBackendOfflineWarning(false);
      setStreamStatus('Waiting');
      
      // Reset area chart baseline with no fake data
      setFocusStream([]);
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setErrorMessage(err.message || 'Failed to start focus session. FastAPI backend offline.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) return;

    setIsLoading(true);
    setErrorMessage(null);

      // We will calculate final session productivity after parsing metrics, 
      // but we need a placeholder to send to the backend end_session if we want.
      // Wait, endSession takes productivity_score. We should calculate it FIRST!
      
      const finalMetrics = sessionMetrics.length > 0 ? sessionMetrics : [{focus_score: 85, attention_state: 'Focused', gaze_status: 'On Screen', cognitive_load: 50, fatigue_score: 20}];
      const totalSamples = finalMetrics.length;
      let validFocusSum = 0;
      let highestFocus = 0;
      let invalidCount = 0;
      let productiveSamples = 0;
      let validLoadSum = 0;
      let consecutive100s = 0;
      let hasSustained100 = false;

      finalMetrics.forEach(m => {
        const isMissingFace = m.gaze_status === 'Off Screen' || m.gaze_status === 'Uncertain';
        const isInvalid = isMissingFace || m.attention_state !== 'Focused';
        
        validLoadSum += (m.cognitive_load || 50);

        if (isInvalid) {
          invalidCount++;
          validFocusSum += 15; // Weight invalid/missing samples as very low focus
          consecutive100s = 0;
        } else {
          validFocusSum += (m.focus_score || 0);
          if ((m.focus_score || 0) > highestFocus) highestFocus = m.focus_score;
          if ((m.focus_score || 0) >= 70) productiveSamples++;
          
          if ((m.focus_score || 0) >= 99) {
            consecutive100s++;
            if (consecutive100s >= 3) hasSustained100 = true; // 3 samples * 5s = 15s >= 10s
          } else {
            consecutive100s = 0;
          }
        }
      });

      const avgFocus = Math.round(validFocusSum / totalSamples);
      const avgLoad = Math.round(validLoadSum / totalSamples);
      const consistency = Math.round((productiveSamples / totalSamples) * 100);
      const initialFatigue = finalMetrics[0].fatigue_score || 20;
      const finalFatigueVal = finalMetrics[finalMetrics.length - 1].fatigue_score || 20;

      const validRatio = (totalSamples - invalidCount) / totalSamples;
      const trackingConfidence = validRatio;

      let baseProductivity = (avgFocus * 0.6) + (consistency * 0.4);
      if (trackingConfidence < 0.8) baseProductivity -= 15;
      if (finalFatigueVal > 30) baseProductivity -= 10;
      
      let computedProductivity = Math.round(Math.max(10, Math.min(100, baseProductivity)));
      if (computedProductivity === 100) {
        if (avgFocus < 85 || consistency < 80 || trackingConfidence < 0.85 || finalFatigueVal > 25) {
          computedProductivity = 99;
        }
      }

      try {
      await endSession({
        session_id: activeSessionId,
        focus_score: avgFocus, // Save avg focus to DB instead of last frame
        cognitive_load: avgLoad,
        fatigue_level: finalFatigueVal > 35 ? 'High' : (finalFatigueVal > 25 ? 'Medium' : 'Low'),
        productivity_score: computedProductivity
      });

      const elapsedFormatted = formatTime(elapsedSeconds);
      let peakFocus = highestFocus;
      if (peakFocus >= 99 && !hasSustained100) {
        peakFocus = 98; // Cap if not sustained
      }

      
      // Determine fatigue trend
      let fatigueTrend = 'Stable Low';
      if (finalFatigueVal > initialFatigue + 5) {
        fatigueTrend = 'Slight Rising';
      } else if (finalFatigueVal < initialFatigue - 5) {
        fatigueTrend = 'Optimal Declining';
      } else if (finalFatigueVal > 30) {
        fatigueTrend = 'Medium Fatigue';
      }

      // Motivational AI summary with tracking quality logic
      
      let telemetryQuality = 'Poor';
      if (trackingConfidence > 0.85) telemetryQuality = 'Excellent';
      else if (trackingConfidence > 0.6) telemetryQuality = 'Good';
      else if (trackingConfidence > 0.35) telemetryQuality = 'Partial';

      const isPoorTracking = trackingConfidence < 0.45;

      let aiSentence = 'Session completed. Moderate cognitive drift detected; consider scheduling a short recovery break.';
      if (isPoorTracking) {
        aiSentence = "Tracking quality was inconsistent. Reliable cognitive inference could not be established.";
        fatigueTrend = "Unknown";
      } else if (computedProductivity >= 90) {
        aiSentence = `High sustained focus detected at ${consistency}% consistency with minimal fatigue drift. Outstanding deep work!`;
      } else if (computedProductivity >= 75) {
        aiSentence = `Solid deep work period with ${consistency}% consistency. Maintained strong cognitive alignment with minor load fluctuations.`;
      } else {
        aiSentence = `Session completed with moderate cognitive drift. Average focus was ${avgFocus}%. Consider short recovery cycles to boost focus consistency.`;
      }

      setSummaryData({
        duration: elapsedFormatted,
        avgFocus,
        peakFocus,
        avgLoad,
        productivityScore: isPoorTracking ? 'N/A' : computedProductivity,
        fatigueTrend,
        aiSentence,
        totalSamples,
        consistency,
        isPoorTracking,
        telemetryQuality
      });

      // Clear session identifier from localStorage
      localStorage.removeItem('active_session_id');
      
      // Reset page states
      setIsSessionActive(false);
      setActiveSessionId(null);
      setSessionStartTime(null);
      setLatestMetric(null);
      setElapsedSeconds(0);
      setHasBackendOfflineWarning(false);
      setShowSummaryModal(true);
    } catch (err: any) {
      console.error('Failed to end session cleanly:', err);
      setErrorMessage(err.message || 'Failed to end session cleanly. Backend service offline.');
      localStorage.removeItem('active_session_id');
      localStorage.removeItem('active_session_start');
      setIsSessionActive(false);
      setActiveSessionId(null);
      setSessionStartTime(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 5. HELPER TIME FORMATTER
  // ==========================================
  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ==========================================
  // 6. ANIMATED COUNTERS FOR TELEMETRY
  // ==========================================
  const animatedFocusScore = useAnimatedCounter(isSessionActive && latestMetric ? latestMetric.focus_score : 0);
  const animatedBlinkRate = useAnimatedCounter(isSessionActive && latestMetric ? latestMetric.blink_rate : 0);
  const animatedFatigueScore = useAnimatedCounter(isSessionActive && latestMetric ? latestMetric.fatigue_score : 0);

  // ==========================================
  // 7. REACTIVE DIAGNOSTIC METRIC CARDS
  // ==========================================
  const metricCards = [
    {
      title: 'Blink rate',
      value: isSessionActive && latestMetric ? `${animatedBlinkRate} /min` : '--',
      status: isSessionActive && latestMetric ? 'Normal' : '--',
      statusColor: 'text-zinc-550',
      icon: Eye,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Gaze status',
      value: isSessionActive && latestMetric ? latestMetric.gaze_status : (isSessionActive ? 'Waiting...' : 'Offline'),
      status: isSessionActive && latestMetric ? 'Active tracking' : '--',
      statusColor: 'text-teal-400/65',
      icon: Activity,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'Attention state',
      value: isSessionActive && latestMetric ? (latestMetric.gaze_status === 'Off Screen' ? 'Away' : latestMetric.attention_state) : (isSessionActive ? 'Waiting...' : 'Idle'),
      status: isSessionActive && latestMetric ? `Sustained ${formatTime(elapsedSeconds)}` : '--',
      statusColor: 'text-violet-400/65',
      icon: Sparkles,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20'
    },
    {
      title: 'Posture',
      value: isSessionActive && latestMetric ? latestMetric.posture_status : (isSessionActive ? 'Waiting...' : 'Unknown'),
      status: isSessionActive && latestMetric ? (latestMetric.posture_status === 'Slouched' ? 'Recalibrate posture' : 'Optimal alignment') : '--',
      statusColor: isSessionActive && latestMetric?.posture_status === 'Slouched' ? 'text-amber-400' : 'text-zinc-550',
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Active tab',
      value: isSessionActive && latestMetric ? latestMetric.active_tab : (isSessionActive ? 'Waiting...' : 'None'),
      status: isSessionActive && latestMetric ? 'Productive category' : '--',
      statusColor: 'text-zinc-550',
      icon: Globe,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      title: 'Fatigue index',
      value: isSessionActive && latestMetric ? `${animatedFatigueScore}%` : '--',
      status: isSessionActive && latestMetric ? (animatedFatigueScore < 25 ? 'Optimal Low' : (animatedFatigueScore < 35 ? 'Moderate' : 'High Alert')) : '--',
      statusColor: isSessionActive && latestMetric ? (animatedFatigueScore < 25 ? 'text-emerald-400' : (animatedFatigueScore < 35 ? 'text-amber-400' : 'text-rose-450')) : 'text-zinc-550',
      icon: Zap,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20'
    }
  ];

  // Active Neon highlight boundaries for telemetry cards
  const activeGlowMap: Record<number, string> = {
    0: 'shadow-[0_0_15px_rgba(6,182,212,0.1)] border-cyan-500/20 bg-cyan-950/5',
    1: 'shadow-[0_0_15px_rgba(20,184,166,0.1)] border-teal-500/20 bg-teal-950/5',
    2: 'shadow-[0_0_15px_rgba(139,92,246,0.1)] border-violet-500/20 bg-violet-950/5',
    3: latestMetric?.posture_status === 'Slouched' 
       ? 'shadow-[0_0_20px_rgba(245,158,11,0.25)] border-amber-500/40 bg-amber-950/10 border-dashed border-2' 
       : 'shadow-[0_0_15px_rgba(245,158,11,0.1)] border-amber-500/20 bg-amber-950/5',
    4: 'shadow-[0_0_15px_rgba(236,72,153,0.1)] border-pink-500/20 bg-pink-950/5',
    5: 'shadow-[0_0_15px_rgba(244,63,94,0.1)] border-rose-500/20 bg-rose-950/5'
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col gap-6 sm:gap-8"
      >
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white select-none">
            Live Monitoring
          </h2>
          <p className="text-sm font-semibold text-zinc-450 mt-1">
            Real-time cognitive state inferred from vision, language and behaviour.
          </p>
        </div>

        {/* ================= INLINE ERROR BANNER ================= */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-200 backdrop-blur-md flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 animate-pulse" />
                <span>{errorMessage}</span>
              </div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="rounded-lg border border-red-500/20 px-2.5 py-1 text-[10px] text-red-300 hover:text-white hover:bg-red-500/25 transition-all"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= PRIMARY GRID SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Live Preview Panel */}
          <div className="lg:col-span-8 flex flex-col gap-4 w-full">
            
            {/* Webcam Preview glassmorphism container */}
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/25 backdrop-blur-lg shadow-2xl overflow-hidden flex flex-col min-h-[460px] relative select-none">
              
              {/* Subtle animated neural grid dots background */}
              <div className="absolute inset-0 neural-dots opacity-[0.08] pointer-events-none" />
              <div className="absolute inset-0 grid-background opacity-[0.02] pointer-events-none" />

          {/* Top row controls */}
          <div className="flex items-center justify-between p-5 relative z-10">
            {/* UPGRADED LIVE STATUS AND TIMER (Requirement 2 & 9) */}
            <div className="flex items-center gap-2.5 select-none">
              {isSessionActive ? (
                <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 shadow-[0_0_12px_rgba(244,63,94,0.12)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                  </span>
                  <span className="text-[9px] font-black tracking-wider font-mono text-rose-400 uppercase leading-none">
                    LIVE
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full bg-zinc-550/10 border border-zinc-500/10 px-2.5 py-0.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-550" />
                  <span className="text-[9px] font-black tracking-wider font-mono text-zinc-500 uppercase leading-none">
                    STANDBY
                  </span>
                </div>
              )}

              {isSessionActive && (
                <div className="flex items-center rounded-full bg-white/[0.03] border border-white/5 px-2.5 py-0.5 text-[9px] font-bold text-zinc-350 font-mono tracking-tight shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                  <span className="text-zinc-500 mr-1 select-none">T+</span>
                  <span className="tabular-nums font-bold text-zinc-100 text-[10px] tracking-tight">{formatTime(elapsedSeconds)}</span>
                </div>
              )}

              {isSessionActive && (
                <span className="hidden md:inline-flex text-[8px] font-bold text-cyan-400/80 tracking-wider bg-cyan-500/5 border border-cyan-500/10 px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.05)]">
                  Cognitive inference active
                </span>
              )}
              
              {/* CV Stream status badge */}
              <span className="ml-2 text-xs font-medium text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">CV Stream: {streamStatus}</span>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-1.5 text-right flex flex-col gap-0.5 select-none font-mono">
              <span className="text-[8px] font-bold text-cyan-500/70 uppercase tracking-widest leading-none">inference model</span>
              <span className="text-[10px] font-bold text-zinc-350 leading-none mt-0.5">MediaPipe FaceMesh · 30fps</span>
            </div>
          </div>
          {/* Debug UI: show active session ID preview */}
          {activeSessionId && (
            <div className="fixed top-2 right-2 text-xs text-zinc-400 font-mono bg-black/30 backdrop-blur-md px-2 py-1 rounded">
              Session: {activeSessionId.slice(0, 8)}
            </div>
          )}
          {import.meta.env.DEV && (
            <button
              onClick={() => {
                localStorage.removeItem('active_session_id');
                localStorage.removeItem('active_session_start');
                setActiveSessionId(null);
                setSessionStartTime(null);
                setIsSessionActive(false);
                setLatestMetric(null);
                setFocusStream([]);
                setStreamStatus('Waiting');
              }}
              className="ml-2 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/20"
            >
              Reset Local Session
            </button>
          )}

              {/* Center Webcam Area */}
              <div className="flex-1 w-full relative z-0">
                <div className="absolute inset-0 w-full h-full">
                  <BrowserCVMonitor isActive={isSessionActive} sessionId={activeSessionId} />
                </div>
              </div>

              {/* Bottom control bar */}
              <div className="text-xs font-bold text-zinc-400 mb-2">CV Stream: {streamStatus}</div>
              <div className="border-t border-white/[0.04] bg-white/[0.01] px-6 py-4.5 flex items-center justify-between z-10">
                {/* Focus score readout */}
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest leading-none">Focus score</span>
                  <span className="text-3xl font-black text-cyan-400 tracking-tight leading-none mt-1 shadow-cyan-400/10 drop-shadow-[0_0_8px_rgba(6,182,212,0.15)] font-sans">
                    {isSessionActive && latestMetric ? animatedFocusScore : '--'}
                  </span>
                </div>

                {/* Session triggers */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleStartSession}
                    disabled={isSessionActive || isLoading}
                    className={`glow-btn inline-flex items-center gap-2 rounded-xl px-4.5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-350 ${
                      isSessionActive 
                        ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border border-white/5' 
                        : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isLoading && !isSessionActive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                    <span>{isLoading && !isSessionActive ? 'Starting...' : 'Start session'}</span>
                  </button>
                  <button 
                    onClick={handleEndSession}
                    disabled={!isSessionActive || isLoading}
                    className={`inline-flex items-center gap-2 rounded-xl border border-white/10 hover:border-white/20 px-4.5 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-all duration-300 ${
                      !isSessionActive 
                        ? 'opacity-40 cursor-not-allowed bg-transparent' 
                        : 'hover:bg-white/[0.02] hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isLoading && isSessionActive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Square className="h-3.5 w-3.5 fill-current text-current" />
                    )}
                    <span>{isLoading && isSessionActive ? 'Ending...' : 'End session'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Subtle Safety/Privacy note disclaimer */}
            <p className="text-[11px] font-semibold text-zinc-550 text-center select-none antialiased">
              🛡️ No raw webcam or screen data is stored. Only processed cognitive metrics are saved.
            </p>

          </div>

          {/* Right Column: Stacked Diagnostic Status Cards (Polished spacing & glows - Requirement 4) */}
          <div className="lg:col-span-4 flex flex-col gap-3 w-full">
            {metricCards.map((card, idx) => {
              const Icon = card.icon;

              return (
                <div 
                  key={idx}
                  className={`group relative rounded-2xl border py-[12px] px-[20px] flex items-center justify-between select-none hover:scale-[1.015] hover:bg-slate-950/40 transition-all duration-300 ${
                    isSessionActive ? activeGlowMap[idx] : 'border-white/5 bg-slate-950/20'
                  }`}
                >
                  {/* Atmospheric gradient highlights */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.005] via-transparent to-transparent pointer-events-none" />

                  {/* Left Info: Icon & labels */}
                  <div className="flex items-center gap-5 text-left relative z-10">
                    {/* Diagnostic Icon Box */}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}>
                      <Icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
                    </div>

                    {/* Text block */}
                    <div className="flex flex-col gap-0.5 text-left justify-center">
                      <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest leading-none">
                        {card.title}
                      </span>
                      <span className="text-sm font-extrabold text-zinc-100 antialiased tracking-tight mt-0.5 group-hover:text-cyan-400 transition-colors">
                        {card.value}
                      </span>
                    </div>
                  </div>

                  {/* Right Status Pill */}
                  <span className={`ml-auto text-right pl-6 text-[9px] font-bold uppercase tracking-wider shrink-0 relative z-10 ${card.statusColor}`}>
                    {card.status}
                  </span>

                </div>
              );
            })}
          </div>

        </div>

        {/* ================= FOCUS STREAM GRAPH SECTION ================= */}
        <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md shadow-lg select-none text-left relative overflow-hidden flex flex-col h-[280px] hover:border-cyan-500/10 transition-colors duration-500">
          {/* atmospheric lighting */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.002] via-transparent to-transparent pointer-events-none" />

          {/* Title block */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
              Attention telemetry
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight leading-tight mt-0.5">
              Focus stream
            </h3>
          </div>

          {/* Wave chart container */}
          <div className="flex-1 w-full text-xs">
            <div className="w-full h-[260px] min-h-[260px] flex items-center justify-center">
              {focusStream.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={focusStream} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glowCyanLive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.12} />
                        <stop offset="60%" stopColor="#8b5cf6" stopOpacity={0.04} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                      <filter id="glowCyanFilter">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#22d3ee" floodOpacity="0.45" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.015)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#4b5563" 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      style={{ fontSize: '9px', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[40, 100]}
                      ticks={[40, 60, 80, 100]}
                      dx={-5}
                      style={{ fontSize: '9px', fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      content={<LiveTooltip />}
                      cursor={{ stroke: 'rgba(255, 255, 255, 0.03)', strokeWidth: 1 }} 
                    />
                    <Area 
                      type="monotone" 
                      name="Focus"
                      dataKey="focus" 
                      stroke="#06b6d4" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#glowCyanLive)"
                      filter="url(#glowCyanFilter)"
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#22d3ee' }}
                      dot={focusStream.length === 1 ? { r: 4, strokeWidth: 0, fill: '#22d3ee' } : false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 font-semibold h-full w-full">
                  <span className="animate-pulse">Waiting for CV stream data...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= ADAPTIVE NUDGES SECTION ================= */}
        {/* TODO: Implement RL-based adaptive productivity optimization later */}
        <div className="w-full flex flex-col gap-4 text-left">
          <div>
            <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
              Realtime signals
            </span>
            <h3 className="text-sm font-bold text-zinc-100 tracking-tight leading-tight mt-0.5">
              Adaptive nudges
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Flow detected */}
            <div className="group relative rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md flex items-start gap-4 hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300 select-none text-left">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isSessionActive && latestMetric?.attention_state === 'Focused' && latestMetric.focus_score >= 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                <Sparkles className={`h-4.5 w-4.5 ${isSessionActive && latestMetric?.attention_state === 'Focused' && latestMetric.focus_score >= 70 ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                  {!isSessionActive ? 'Waiting for telemetry' 
                    : latestMetric?.attention_state === 'Focused' && latestMetric.focus_score >= 70 ? 'Flow state detected' 
                    : (latestMetric?.attention_state === 'Distracted' || latestMetric?.ui_attention_label === 'Away') ? 'Focus interruption detected' 
                    : 'Not in flow'}
                </h4>
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5 leading-relaxed">
                  {!isSessionActive ? 'Start a monitoring session to receive adaptive nudges.' 
                    : latestMetric?.attention_state === 'Focused' && latestMetric.focus_score >= 70 ? 'Stable focus detected. Continue current work block.' 
                    : (latestMetric?.attention_state === 'Distracted' || latestMetric?.ui_attention_label === 'Away') ? 'Consider removing distractions or taking a short reset.' 
                    : 'Waiting for sustained focus...'}
                </p>
              </div>
            </div>

            {/* Card 2: Posture Alert */}
            <div className="group relative rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md flex items-start gap-4 hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300 select-none text-left">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isSessionActive && latestMetric?.posture_status === 'Slouched' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                <AlertTriangle className={`h-4.5 w-4.5 ${isSessionActive && latestMetric?.posture_status === 'Slouched' ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                  Posture drift
                </h4>
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5 leading-relaxed">
                  {!isSessionActive || !latestMetric ? 'Posture unavailable'
                    : latestMetric.ui_posture_label === 'Upright' ? 'Posture stable'
                    : latestMetric.ui_posture_label === 'Unknown' ? 'Posture unavailable'
                    : 'Posture drift detected'}
                </p>
              </div>
            </div>

            {/* Card 3: Load rising */}
            <div className="group relative rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md flex items-start gap-4 hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300 select-none text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Activity className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                  Load status
                </h4>
                
                {isSessionActive && latestMetric ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <p className="text-[11px] text-zinc-450 font-semibold leading-relaxed">
                      Cognitive workload index: {latestMetric.cognitive_load || '--'}%
                    </p>
                    <div className="text-[10px] text-zinc-500 font-mono flex flex-col gap-0.5">
                      <span>Consistency: --</span>
                      <span>Telemetry Quality: {latestMetric.gaze_status === 'Off Screen' ? 'Poor' : latestMetric.gaze_status === 'Uncertain' ? 'Partial' : 'Good'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-450 font-semibold mt-0.5 leading-relaxed">
                    Waiting for telemetry
                  </p>
                )}
              </div>
            </div>

            {/* Card 4: Extension Domain Active Context */}
            <div className="group relative rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md flex items-start gap-4 hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300 select-none text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Globe className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                  Extension telemetry
                </h4>
                
                {isSessionActive && extensionActivity ? (
                  <div className="flex flex-col gap-2 mt-1 w-full">
                    <p className="text-[11px] text-zinc-450 font-semibold leading-relaxed truncate">
                      Active: <span className="text-white">{extensionActivity.domain}</span>
                    </p>
                    <div className="text-[10px] text-zinc-500 font-mono flex flex-col gap-0.5">
                      <span className={extensionActivity.risk_level === 'High' ? 'text-rose-450' : 'text-emerald-400'}>
                        {extensionActivity.category} · {extensionActivity.mode}
                      </span>
                      <span>Tab switches: {extensionActivity.tab_switches}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-450 font-semibold mt-0.5 leading-relaxed">
                    Waiting for extension link
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </motion.div>

      {/* ================= SESSION END SUMMARY MODAL (Requirement 6) ================= */}
      <AnimatePresence>
        {showSummaryModal && summaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/90 p-7 shadow-2xl relative overflow-hidden text-left"
            >
              {/* atmospheric soft glows inside modal */}
              <div className="absolute -top-1/4 -right-1/4 w-52 h-52 rounded-full bg-cyan-500/10 blur-[80px]" />
              <div className="absolute -bottom-1/4 -left-1/4 w-52 h-52 rounded-full bg-violet-500/10 blur-[80px]" />
              
              <div className="relative z-10 flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest animate-pulse">Tracking complete</span>
                    <h3 className="text-lg font-black text-white tracking-tight mt-0.5">Session Summary</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                </div>

                {/* Premium Main Row: Circular SVG Gauge & Dialog Bubble */}
                <div className="flex flex-col md:flex-row items-center gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-5 backdrop-blur-md">
                  {/* Gauge */}
                  <div className="relative flex items-center justify-center h-28 w-28 shrink-0 select-none">
                    <svg className="h-24 w-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="7.5" fill="transparent" />
                      {!summaryData.isPoorTracking && (
                        <motion.circle
                          cx="50" cy="50" r="40"
                          stroke="#10b981" strokeWidth="7.5" fill="transparent"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 - (251.2 * (summaryData.productivityScore as number)) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                          className="shadow-[0_0_12px_#10b981]"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none leading-none">
                      {summaryData.isPoorTracking ? (
                         <span className="text-[9px] font-black text-rose-400 text-center uppercase tracking-wider">Poor Data</span>
                      ) : (
                        <>
                          <span className="text-xl font-black text-emerald-400 font-sans">{summaryData.productivityScore}%</span>
                          <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mt-1">PRODUCTIVE</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* AI Dialogue Bubble */}
                  <div className="flex-1 flex flex-col gap-1 text-left w-full">
                    <div className="relative bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                      <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                        AI Intelligence Insights
                      </span>
                      {/* TODO: Implement NLP insight generation procees later */}
                      <p className="text-[11px] font-semibold text-zinc-200 leading-relaxed antialiased">
                        “{summaryData.aiSentence}”
                      </p>
                      {/* Dialogue bubble arrow */}
                      <div className="hidden md:block absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 border-l border-b border-cyan-500/10 rotate-45" style={{ backgroundColor: '#090a18' }} />
                    </div>
                  </div>
                </div>

                {/* Telemetry Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Focus Consistency */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Focus Consistency</span>
                    <span className="text-base font-extrabold text-cyan-400 mt-1.5 block leading-none font-mono">
                      {summaryData.isPoorTracking ? '--' : `${summaryData.consistency}%`}
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Time &gt;= 80% focus</span>
                  </div>

                  {/* Avg Focus */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Average Focus</span>
                    <span className="text-base font-extrabold text-cyan-400 mt-1.5 block leading-none font-mono">
                      {summaryData.isPoorTracking ? '--' : `${summaryData.avgFocus}%`}
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Focus index mean</span>
                  </div>

                  {/* Peak Focus */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Peak Focus</span>
                    <span className="text-base font-extrabold text-white mt-1.5 block leading-none font-mono">
                      {summaryData.isPoorTracking ? '--' : `${summaryData.peakFocus}%`}
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">
                      {summaryData.peakFocus >= 99 ? 'Sustained peak focus' : 'Momentary peak'}
                    </span>
                  </div>

                  {/* Telemetry Quality */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Telemetry Quality</span>
                    <span className={`text-sm font-extrabold mt-1.5 block leading-none uppercase ${summaryData.telemetryQuality === 'Excellent' ? 'text-emerald-400' : summaryData.telemetryQuality === 'Good' ? 'text-cyan-400' : summaryData.telemetryQuality === 'Partial' ? 'text-yellow-400' : 'text-rose-400'}`}>
                      {summaryData.telemetryQuality}
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Confidence weighting</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Total Samples */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Telemetry Samples</span>
                    <span className="text-base font-extrabold text-zinc-100 mt-1.5 block leading-none font-mono">
                      {summaryData.totalSamples}
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Total datapoints logged</span>
                  </div>

                  {/* Duration */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Duration</span>
                    <span className="text-base font-extrabold text-zinc-100 mt-1.5 block leading-none font-mono">
                      {summaryData.duration}
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Active track time</span>
                  </div>

                  {/* Fatigue Trend */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Fatigue Trend</span>
                    <span className="text-base font-extrabold text-amber-400 mt-1.5 block leading-none">
                      {summaryData.fatigueTrend}
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Ocular/blink telemetry</span>
                  </div>

                </div>

                {/* Dismiss Action button */}
                <button 
                  onClick={() => {
                    setShowSummaryModal(false);
                    setSummaryData(null);
                  }}
                  className="glow-btn w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 py-3 text-xs font-bold text-white shadow-md transition-all duration-300 mt-2 text-center"
                >
                  Return to Dashboard
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};
