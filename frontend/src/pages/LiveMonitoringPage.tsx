import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
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
  Camera, 
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
  addMetric,
  getSessionMetrics
} from '../services/api';
import type { MetricResponse, MetricCreateRequest } from '../services/api';

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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestMetric, setLatestMetric] = useState<MetricResponse | null>(null);
  const [focusStream, setFocusStream] = useState<{ time: string; focus: number; cognitiveLoad?: number }[]>([]);
  const [hasBackendOfflineWarning, setHasBackendOfflineWarning] = useState<boolean>(false);

  // Responsive window tracking for particle density control (Dynamic Particle Count)
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stats histories for Session End Summary Modal
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [loadHistory, setLoadHistory] = useState<number[]>([]);
  const [fatigueHistory, setFatigueHistory] = useState<number[]>([]);
  
  // Session Summary Modal State
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<{
    duration: string;
    avgFocus: number;
    peakFocus: number;
    avgLoad: number;
    productivityScore: number;
    fatigueTrend: string;
    aiSentence: string;
    totalSamples: number;
    consistency: number;
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
        
        if (activeSess && activeSess.id) {
          // If session is already ended, automatically clear from localStorage (Requirement 7)
          if (activeSess.end_time) {
            localStorage.removeItem('active_session_id');
            localStorage.removeItem('active_session_start');
            setIsSessionActive(false);
            setActiveSessionId(null);
            setIsLoading(false);
            return;
          }

          // Restore session
          setActiveSessionId(activeSess.id);
          localStorage.setItem('active_session_id', activeSess.id);
          setIsSessionActive(true);

          // Calculate elapsed time from precise start timestamp
          const startTimestamp = activeSess.start_time;
          localStorage.setItem('active_session_start', startTimestamp);
          const elapsed = Math.floor((Date.now() - new Date(startTimestamp).getTime()) / 1000);
          setElapsedSeconds(elapsed >= 0 ? elapsed : 0);

          // Retrieve previous metrics logged in this session
          try {
            const metrics = await getSessionMetrics(activeSess.id);
            if (metrics && metrics.length > 0) {
              setLatestMetric(metrics[metrics.length - 1]);
              
              // Populate stats history
              const fScores = metrics.map(m => m.focus_score);
              const lScores = metrics.map(m => m.cognitive_load);
              const fatScores = metrics.map(m => m.fatigue_score);
              setFocusHistory(fScores);
              setLoadHistory(lScores);
              setFatigueHistory(fatScores);

              const historyData = metrics.map((m) => {
                const ageMinutes = Math.round((Date.now() - new Date(m.recorded_at).getTime()) / 60000);
                return {
                  time: ageMinutes <= 0 ? 'Just now' : `${ageMinutes}m ago`,
                  focus: m.focus_score,
                  cognitiveLoad: m.cognitive_load
                };
              });
              // Keep only latest 30 points to avoid memory growth (Requirement 6)
              setFocusStream(historyData.slice(-30));
            } else {
              setFocusStream([{ time: 'Just now', focus: 85, cognitiveLoad: 50 }]);
            }
          } catch (err) {
            console.error('Failed to restore session metrics:', err);
            setFocusStream([{ time: 'Just now', focus: 85, cognitiveLoad: 50 }]);
          }
        }
      } catch (err: any) {
        // If 404 was returned, that's fine (no active session). Otherwise, backend is offline.
        if (err.message && err.message.includes('No active session found')) {
          localStorage.removeItem('active_session_id');
          localStorage.removeItem('active_session_start');
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

    // Run a 1-second interval to increment session duration cleanly (Requirement 1)
    const timer = setInterval(() => {
      const startTimestamp = localStorage.getItem('active_session_start');
      if (startTimestamp) {
        const elapsed = Math.floor((Date.now() - new Date(startTimestamp).getTime()) / 1000);
        setElapsedSeconds(elapsed >= 0 ? elapsed : 0);
      } else {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionActive]);

  // ==========================================
  // 3. SIMULATED LIVE TELEMETRY STREAM ENGINE
  // ==========================================
  useEffect(() => {
    if (!isSessionActive || !activeSessionId) return;

    const generateAndUploadMetric = async () => {
      // Fetch latest values for smoothing calculations
      const lastM = latestMetricRef.current;
      const prevFocus = lastM ? lastM.focus_score : 85;
      const prevFatigue = lastM ? lastM.fatigue_score : 20;
      const prevCognitive = lastM ? lastM.cognitive_load : 55;

      // Telemetry smoothing: previous focus score ± minor drift (Requirement 5)
      // Keep transitions believable and human-like with very gentle, natural drift bounds
      const focusDrift = Math.round((Math.random() - 0.5) * 4); // drift between -2 and +2
      const focus_score = Math.max(72, Math.min(96, prevFocus + focusDrift));

      const fatigueDrift = Math.round((Math.random() - 0.5) * 2); // drift between -1 and +1
      const fatigue_score = Math.max(12, Math.min(42, prevFatigue + fatigueDrift));

      const loadDrift = Math.round((Math.random() - 0.5) * 4); // drift between -2 and +2
      const cognitive_load = Math.max(48, Math.min(78, prevCognitive + loadDrift));

      // Range boundaries: blink rate 10 to 22
      const blink_rate = Math.floor(Math.random() * 13) + 10; 

      // Gaze status weighted randomized options correctly annotated with exact union literals
      const gazeRand = Math.random();
      const gaze_status: 'On Screen' | 'Off Screen' | 'Uncertain' = gazeRand < 0.88 ? 'On Screen' : (gazeRand < 0.96 ? 'Off Screen' : 'Uncertain');

      // Posture status weighted randomized options correctly annotated with exact union literals
      const postureRand = Math.random();
      const posture_status: 'Upright' | 'Slouched' | 'Unknown' = postureRand < 0.85 ? 'Upright' : (postureRand < 0.96 ? 'Slouched' : 'Unknown');

      // Attention state weighted randomized options correctly annotated with exact union literals
      const attentionRand = Math.random();
      const attention_state: 'Focused' | 'Distracted' | 'Neutral' = attentionRand < 0.85 ? 'Focused' : (attentionRand < 0.96 ? 'Neutral' : 'Distracted');

      // TODO: Replace active tab placeholder with extension telemetry later
      const active_tab = 'docs.cognivue.ai';

      // Assemble payload - correctly typed as MetricCreateRequest
      // TODO: Replace simulated telemetry with MediaPipe integration later
      const metricData: MetricCreateRequest = {
        session_id: activeSessionId,
        blink_rate,
        gaze_status,
        posture_status,
        attention_state,
        active_tab,
        cognitive_load,
        focus_score,
        fatigue_score
      };

      try {
        const res = await addMetric(metricData);
        
        // Success: store results and clear any inline offline warnings
        setLatestMetric(res);
        setFocusHistory(prev => [...prev, focus_score]);
        setLoadHistory(prev => [...prev, cognitive_load]);
        setFatigueHistory(prev => [...prev, fatigue_score]);

        if (hasBackendOfflineWarning) {
          setHasBackendOfflineWarning(false);
          setErrorMessage(null);
        }

        // Push new point into chart data stream
        setFocusStream((prev) => {
          const nextData = [...prev, { time: 'Just now', focus: focus_score, cognitiveLoad: cognitive_load }];
          
          // Limit stream items size to maximum 30 to avoid memory leak (Requirement 6)
          if (nextData.length > 30) {
            nextData.shift();
          }

          // Restore relative scale labels
          return nextData.map((d, idx) => {
            if (idx === nextData.length - 1) return d;
            return {
              ...d,
              time: `${nextData.length - 1 - idx}m ago`
            };
          });
        });
      } catch (err) {
        // Backend offline throttling (Requirement 2):
        // Show one single inline warning card and retry silently every 5 seconds.
        console.error('Failed to log telemetry metric:', err);
        if (!hasBackendOfflineWarning) {
          setHasBackendOfflineWarning(true);
          setErrorMessage('Telemetry upload failed: FastAPI backend is offline. Retrying silently in background...');
        }
      }
    };

    // Execute immediately on startup
    generateAndUploadMetric();

    // 5-second interval timer (Requirement 1)
    const interval = setInterval(generateAndUploadMetric, 5000);

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
      localStorage.setItem('active_session_start', startTimestamp);
      
      setLatestMetric(null);
      setElapsedSeconds(0);
      setFocusHistory([]);
      setLoadHistory([]);
      setFatigueHistory([]);
      setIsSessionActive(true);
      setHasBackendOfflineWarning(false);
      
      // Reset area chart baseline
      setFocusStream([{ time: 'Just now', focus: 85, cognitiveLoad: 50 }]);
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

    // Compute session-end aggregates based on latest telemetry snapshot
    const lastM = latestMetric;
    const focus_score = lastM ? lastM.focus_score : 85;
    const cognitive_load = lastM ? lastM.cognitive_load : 55;
    const fatigueVal = lastM ? lastM.fatigue_score : 20;

    let fatigue_level: 'Low' | 'Medium' | 'High' = 'Low';
    if (fatigueVal >= 25 && fatigueVal <= 35) {
      fatigue_level = 'Medium';
    } else if (fatigueVal > 35) {
      fatigue_level = 'High';
    }

    const productivity_score = Math.max(50, Math.min(100, Math.round(focus_score - fatigueVal / 3)));

    try {
      await endSession({
        session_id: activeSessionId,
        focus_score,
        cognitive_load,
        fatigue_level,
        productivity_score
      });

      // Prepare Session Summary Details
      const elapsedFormatted = formatTime(elapsedSeconds);
      const finalFocusArr = focusHistory.length > 0 ? focusHistory : [85];
      const finalLoadArr = loadHistory.length > 0 ? loadHistory : [50];
      const finalFatigueArr = fatigueHistory.length > 0 ? fatigueHistory : [20];

      const avgFocus = Math.round(finalFocusArr.reduce((a,b) => a+b, 0) / finalFocusArr.length);
      const peakFocus = Math.max(...finalFocusArr);
      const avgLoad = Math.round(finalLoadArr.reduce((a,b) => a+b, 0) / finalLoadArr.length);
      const totalSamples = finalFocusArr.length;

      // Focus Consistency %: percentage of samples where focus score >= 80% (Requirement 6)
      const highFocusSamples = finalFocusArr.filter(f => f >= 80).length;
      const consistency = Math.round((highFocusSamples / finalFocusArr.length) * 100);
      
      // Determine fatigue trend
      const initialFatigue = finalFatigueArr[0];
      const finalFatigueVal = finalFatigueArr[finalFatigueArr.length - 1];
      let fatigueTrend = 'Stable Low';
      if (finalFatigueVal > initialFatigue + 5) {
        fatigueTrend = 'Slight Rising';
      } else if (finalFatigueVal < initialFatigue - 5) {
        fatigueTrend = 'Optimal Declining';
      } else if (finalFatigueVal > 30) {
        fatigueTrend = 'Medium Fatigue';
      }

      // Motivational AI summary with consistency metrics integrated
      // TODO: Implement NLP insight generation procees later
      let aiSentence = 'Session completed. Moderate cognitive drift detected; consider scheduling a short recovery break.';
      if (consistency >= 85) {
        aiSentence = `High sustained focus detected at ${consistency}% consistency with minimal fatigue drift. Outstanding deep work!`;
      } else if (avgFocus >= 80) {
        aiSentence = `Solid deep work period with ${consistency}% consistency. Maintained strong cognitive alignment with minor load fluctuations.`;
      } else if (avgFocus >= 75) {
        aiSentence = `Good attention balance achieved during this session. Consider short recovery cycles to boost focus consistency.`;
      }

      setSummaryData({
        duration: elapsedFormatted,
        avgFocus,
        peakFocus,
        avgLoad,
        productivityScore: productivity_score,
        fatigueTrend,
        aiSentence,
        totalSamples,
        consistency
      });

      // Clear session values from localStorage
      localStorage.removeItem('active_session_id');
      localStorage.removeItem('active_session_start');
      
      // Reset page states
      setIsSessionActive(false);
      setActiveSessionId(null);
      setLatestMetric(null);
      setElapsedSeconds(0);
      setHasBackendOfflineWarning(false);
      setShowSummaryModal(true);
    } catch (err: any) {
      console.error('Failed to end session cleanly:', err);
      setErrorMessage(err.message || 'Failed to end session cleanly. Backend service offline.');
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
  const animatedFocusScore = useAnimatedCounter(isSessionActive && latestMetric ? latestMetric.focus_score : 85);
  const animatedBlinkRate = useAnimatedCounter(isSessionActive && latestMetric ? latestMetric.blink_rate : 0);
  const animatedCognitiveLoad = useAnimatedCounter(isSessionActive && latestMetric ? latestMetric.cognitive_load : 0);
  const animatedFatigueScore = useAnimatedCounter(isSessionActive && latestMetric ? latestMetric.fatigue_score : 20);

  // ==========================================
  // 7. REACTIVE DIAGNOSTIC METRIC CARDS
  // ==========================================
  const metricCards = [
    {
      title: 'Blink rate',
      value: isSessionActive && latestMetric ? `${animatedBlinkRate} /min` : '0 /min',
      status: 'Normal',
      statusColor: 'text-zinc-550',
      icon: Eye,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Gaze status',
      value: isSessionActive && latestMetric ? latestMetric.gaze_status : (isSessionActive ? 'Calculating...' : 'Offline'),
      status: isSessionActive ? 'Active tracking' : '--',
      statusColor: 'text-teal-400/65',
      icon: Activity,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'Attention state',
      value: isSessionActive && latestMetric ? latestMetric.attention_state : (isSessionActive ? 'Calculating...' : 'Idle'),
      status: isSessionActive ? `Sustained ${formatTime(elapsedSeconds)}` : '--',
      statusColor: 'text-violet-400/65',
      icon: Sparkles,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20'
    },
    {
      title: 'Posture',
      value: isSessionActive && latestMetric ? latestMetric.posture_status : (isSessionActive ? 'Calculating...' : 'Unknown'),
      status: isSessionActive ? (latestMetric?.posture_status === 'Slouched' ? 'Recalibrate posture' : 'Optimal alignment') : '--',
      statusColor: isSessionActive && latestMetric?.posture_status === 'Slouched' ? 'text-amber-400' : 'text-zinc-550',
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Active tab',
      value: isSessionActive && latestMetric ? latestMetric.active_tab : 'None',
      status: isSessionActive ? 'Productive category' : '--',
      statusColor: 'text-zinc-550',
      icon: Globe,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      title: 'Fatigue index',
      value: isSessionActive && latestMetric ? `${animatedFatigueScore}%` : (isSessionActive ? 'Calculating...' : 'Offline'),
      status: isSessionActive ? (animatedFatigueScore < 25 ? 'Optimal Low' : (animatedFatigueScore < 35 ? 'Moderate' : 'High Alert')) : '--',
      statusColor: isSessionActive ? (animatedFatigueScore < 25 ? 'text-emerald-400' : (animatedFatigueScore < 35 ? 'text-amber-400' : 'text-rose-450')) : 'text-zinc-550',
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
              
              {/* Animated scanning bar overlay sweep (Requirement 1) */}
              {isSessionActive && (
                <div className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent pointer-events-none animate-scan z-20 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              )}

              {/* Subtle animated neural grid dots background (Requirement 1) */}
              <div className="absolute inset-0 neural-dots opacity-[0.08] pointer-events-none" />
              <div className="absolute inset-0 grid-background opacity-[0.02] pointer-events-none" />

              {/* Spawning dynamic particles system that scales density by viewport size (Requirement 3 & 7) */}
              {isSessionActive && Array.from({ length: windowWidth > 1024 ? 8 : (windowWidth > 640 ? 4 : 2) }).map((_, idx) => {
                const colors = ['bg-cyan-400', 'bg-violet-400', 'bg-emerald-400', 'bg-pink-400'];
                const glows = ['shadow-[0_0_8px_#06b6d4]', 'shadow-[0_0_10px_#8b5cf6]', 'shadow-[0_0_8px_#10b981]', 'shadow-[0_0_10px_#ec4899]'];
                const color = colors[idx % colors.length];
                const glow = glows[idx % glows.length];
                const startLeft = 10 + (idx * 11) % 80;
                const startTop = 20 + (idx * 9) % 60;
                return (
                  <motion.div
                    key={idx}
                    className={`absolute w-1 h-1 rounded-full ${color} ${glow} opacity-[0.25] pointer-events-none z-10`}
                    style={{ left: `${startLeft}%`, top: `${startTop}%` }}
                    animate={{
                      y: [0, -35, 0],
                      x: [0, (idx % 2 === 0 ? 15 : -15), 0],
                      opacity: [0.15, 0.45, 0.15],
                    }}
                    transition={{
                      duration: 6 + (idx * 1.5) % 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.4,
                    }}
                  />
                );
              })}

              {/* "AI ACTIVE" status chip floating (Requirement 8) */}
              {isSessionActive && (
                <div className="absolute top-[20px] left-[20px] z-30 flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[8px] font-black tracking-widest text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)] uppercase select-none pointer-events-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_4px_#22d3ee]" />
                  AI ACTIVE
                </div>
              )}

              {/* Low-opacity technical corner brackets HUD (Requirement 1) */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/20 pointer-events-none z-10" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/20 pointer-events-none z-10" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/20 pointer-events-none z-10" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/20 pointer-events-none z-10" />
              
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
                </div>

                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-1.5 text-right flex flex-col gap-0.5 select-none font-mono">
                  <span className="text-[8px] font-bold text-cyan-500/70 uppercase tracking-widest leading-none">inference model</span>
                  <span className="text-[10px] font-bold text-zinc-350 leading-none mt-0.5">MediaPipe FaceMesh · 30fps</span>
                </div>
              </div>

              {/* Center Webcam Preview Placeholder with Animated FaceMesh SVG (Requirement 1) */}
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[280px]">
                
                {/* SVG Biometric FaceMesh Overlay (Requirement 1) */}
                {isSessionActive && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 text-cyan-500/15" viewBox="0 0 400 300" preserveAspectRatio="none">
                    {/* Face boundary wireframe contour */}
                    <motion.path 
                      d="M200,55 C250,55 275,105 275,150 C275,215 240,255 200,255 C160,255 125,215 125,150 C125,105 150,55 200,55 Z"
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="0.8" 
                      strokeDasharray="4 6"
                      animate={{ strokeDashoffset: [0, -20], opacity: [0.25, 0.55, 0.25] }}
                      transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                    />
                    
                    {/* Eyes tracking nodes */}
                    <motion.circle cx="170" cy="120" r="3" fill="#22d3ee" className="shadow-[0_0_6px_#22d3ee]" animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }} transition={{ repeat: Infinity, duration: 1.8 }} />
                    <motion.circle cx="230" cy="120" r="3" fill="#22d3ee" className="shadow-[0_0_6px_#22d3ee]" animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }} />
                    
                    {/* Eyebrow wireframes (Complex Mesh) */}
                    <path d="M150,110 Q170,103 185,112 M215,112 Q230,103 250,110" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />

                    {/* Outer cheekbones jaw tracking anchors */}
                    <motion.circle cx="130" cy="155" r="1.5" fill="currentColor" opacity="0.5" />
                    <motion.circle cx="270" cy="155" r="1.5" fill="currentColor" opacity="0.5" />
                    <motion.circle cx="200" cy="250" r="2" fill="currentColor" opacity="0.5" />

                    {/* Vector Gaze Projection trackers */}
                    <motion.line 
                      x1="170" y1="120" x2="155" y2="100" 
                      stroke="#22d3ee" strokeWidth="0.8" opacity="0.5"
                      animate={{ x2: [155, 175, 155], y2: [100, 115, 100] }}
                      transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                    />
                    <motion.line 
                      x1="230" y1="120" x2="245" y2="100" 
                      stroke="#22d3ee" strokeWidth="0.8" opacity="0.5"
                      animate={{ x2: [245, 225, 245], y2: [100, 115, 100] }}
                      transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.35 }}
                    />

                    {/* Nose Wireframe mapping anchor */}
                    <path d="M200,115 L200,165 L190,180 L210,180 Z" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
                    
                    {/* Mouth micro-expression mapping ring */}
                    <motion.path 
                      d="M175,200 Q200,210 225,200 Q200,192 175,200 Z" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="0.8"
                      animate={{ opacity: [0.25, 0.65, 0.25] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    />

                    {/* Transverse forensic tracking vector lines */}
                    <line x1="200" y1="55" x2="200" y2="115" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                    <line x1="125" y1="150" x2="170" y2="120" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                    <line x1="275" y1="150" x2="230" y2="120" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                    <line x1="170" y1="120" x2="200" y2="115" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                    <line x1="230" y1="120" x2="200" y2="115" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                  </svg>
                )}

                {/* Randomized low-opacity HUD Telemetry overlays (Requirement 1 & 4) */}
                {isSessionActive && (
                  <div className="absolute right-[20px] top-[10px] flex flex-col gap-1.5 text-right font-mono text-[8px] text-zinc-550 select-none pointer-events-none z-10 leading-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-cyan-400 animate-pulse">●</span>
                      <span>GAZE_LOCK:</span>
                      <span className="text-zinc-400 font-bold">{latestMetric?.gaze_status === 'On Screen' ? '1.000' : '0.000'}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-violet-400">●</span>
                      <span>ATTN_INDEX:</span>
                      <span className="text-zinc-400 font-bold">{(animatedFocusScore / 100).toFixed(3)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-pink-400">●</span>
                      <span>COG_LOAD:</span>
                      <span className="text-zinc-400 font-bold">{(animatedCognitiveLoad / 100).toFixed(3)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-amber-400">●</span>
                      <span>FACE_VECTOR:</span>
                      <span className="text-zinc-400 font-bold">
                        {(0.452 + (Math.random() - 0.5) * 0.004).toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[6px] text-emerald-400">●</span>
                      <span>FLOW_STATE:</span>
                      <span className="text-zinc-400 font-bold">
                        {animatedFocusScore >= 80 ? 'ACTIVE' : 'STABLE'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Shifting mesh tracking values bottom-left (Requirement 1) */}
                {isSessionActive && (
                  <div className="absolute left-[20px] bottom-[15px] font-mono text-[8px] text-zinc-650 flex flex-col gap-0.5 select-none pointer-events-none z-10 leading-none">
                    <span>SYS_COORD_MESH: [{(200.45 + (Math.random() - 0.5) * 0.05).toFixed(2)}, {(115.12 + (Math.random() - 0.5) * 0.05).toFixed(2)}]</span>
                    <span>VECTOR_PITCH: [{(Math.random() * 0.02).toFixed(3)}, {(Math.random() * 0.02).toFixed(3)}]</span>
                  </div>
                )}

                {/* Simulated webcam visual scanning layout */}
                <div className="absolute inset-x-8 inset-y-4 rounded-2xl border border-dashed border-white/[0.02] flex items-center justify-center">
                  <AnimatePresence>
                    {isSessionActive ? (
                      <motion.div 
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4.5 relative z-10"
                      >
                        {/* Scanning Pulsing Concentric Radar Rings (Requirement 1) */}
                        <div className="relative flex items-center justify-center">
                          <motion.div 
                            className="absolute h-18 w-18 rounded-full border border-cyan-400/20 animate-radar"
                          />
                          <motion.div 
                            className="absolute h-26 w-26 rounded-full border border-violet-400/10 animate-radar [animation-delay:1.5s]"
                          />
                          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative z-10">
                            {/* TODO: Replace placeholder webcam visualization with OpenCV gaze estimation later */}
                            <Camera className="h-5 w-5 animate-pulse" />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1 text-center">
                          <span className="text-xs font-semibold text-zinc-200 antialiased font-sans">
                            Webcam feed mapping active
                          </span>
                          <span className="text-[10px] font-medium text-zinc-550 font-mono">
                            Facial vectors & ocular micro-expressions active
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="offline"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3.5 relative z-10"
                      >
                        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-zinc-550/5 border border-white/5 text-zinc-650">
                          <Camera className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1 text-center">
                          <span className="text-xs font-semibold text-zinc-400 antialiased">
                            Local model standby
                          </span>
                          <span className="text-[10px] font-medium text-zinc-600 font-mono">
                            Press start to activate inference engine
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom control bar */}
              <div className="border-t border-white/[0.04] bg-white/[0.01] px-6 py-4.5 flex items-center justify-between z-10">
                {/* Focus score readout */}
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest leading-none">Focus score</span>
                  <span className="text-3xl font-black text-cyan-400 tracking-tight leading-none mt-1 shadow-cyan-400/10 drop-shadow-[0_0_8px_rgba(6,182,212,0.15)] font-sans">
                    {isSessionActive ? (latestMetric ? animatedFocusScore : 'Calcul...') : '--'}
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusStream.length > 0 ? focusStream : [{ time: 'Just now', focus: 85 }]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                />
              </AreaChart>
            </ResponsiveContainer>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                  Flow state detected
                </h4>
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5 leading-relaxed">
                  Suppressing notifications for 25 min.
                </p>
              </div>
            </div>

            {/* Card 2: Posture Alert */}
            <div className="group relative rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md flex items-start gap-4 hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300 select-none text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                  Posture drift
                </h4>
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5 leading-relaxed">
                  {isSessionActive && latestMetric?.posture_status === 'Slouched' 
                    ? 'Slouch detected! Recalibrate posture alignment now.' 
                    : 'Upright and supported alignment active.'}
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
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5 leading-relaxed">
                  {isSessionActive && latestMetric 
                    ? `Cognitive workload index: ${animatedCognitiveLoad}%`
                    : 'System standby.'}
                </p>
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
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="7.5"
                        fill="transparent"
                      />
                      {/* Progress circle */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#10b981"
                        strokeWidth="7.5"
                        fill="transparent"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * summaryData.productivityScore) / 100 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                        className="shadow-[0_0_12px_#10b981]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center select-none leading-none">
                      <span className="text-xl font-black text-emerald-400 font-sans">{summaryData.productivityScore}%</span>
                      <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mt-1">PRODUCTIVE</span>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  
                  {/* Focus Consistency */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Focus Consistency</span>
                    <span className="text-base font-extrabold text-cyan-400 mt-1.5 block leading-none font-mono">
                      {summaryData.consistency}%
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Time &gt;= 80% focus</span>
                  </div>

                  {/* Avg Focus */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Average Focus</span>
                    <span className="text-base font-extrabold text-cyan-400 mt-1.5 block leading-none font-mono">
                      {summaryData.avgFocus}%
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Focus index mean</span>
                  </div>

                  {/* Peak Focus */}
                  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3.5 hover:border-cyan-500/10 hover:bg-slate-900/60 transition-colors">
                    <span className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest block leading-none">Peak Focus</span>
                    <span className="text-base font-extrabold text-violet-400 mt-1.5 block leading-none font-mono">
                      {summaryData.peakFocus}%
                    </span>
                    <span className="text-[7px] font-medium text-zinc-500 mt-1 block">Highest concentration</span>
                  </div>

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
