import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';

// ==========================================
// MOCK DATA & CONFIGURATION
// ==========================================
const initialFocusStreamData = [
  { time: '1m ago', focus: 75 },
  { time: '2m ago', focus: 70 },
  { time: '3m ago', focus: 72 },
  { time: '4m ago', focus: 68 },
  { time: '5m ago', focus: 60 },
  { time: '6m ago', focus: 65 },
  { time: '7m ago', focus: 78 },
  { time: '8m ago', focus: 85 },
  { time: '9m ago', focus: 82 },
  { time: '10m ago', focus: 80 },
  { time: '11m ago', focus: 76 },
  { time: '12m ago', focus: 72 },
  { time: '13m ago', focus: 70 },
  { time: '14m ago', focus: 75 },
  { time: '15m ago', focus: 89 },
];

export const LiveMonitoringPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Live Monitoring');
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [liveFocusScore, setLiveFocusScore] = useState(89);
  const [focusStream, setFocusStream] = useState(initialFocusStreamData);

  // Simulated live fluctuating feeds
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      // 1. Fluctuate focus score
      setLiveFocusScore((prev) => {
        const diff = (Math.random() - 0.5) * 6;
        let score = Math.round(prev + diff);
        if (score < 75) score = 75;
        if (score > 98) score = 98;
        return score;
      });

      // 2. Stream focus timeline graph
      setFocusStream((prev) => {
        const nextData = [...prev];
        nextData.shift(); // remove oldest minute
        
        // Push fresh dynamic load value
        const lastVal = prev[prev.length - 1].focus;
        const diff = (Math.random() - 0.5) * 8;
        let score = Math.round(lastVal + diff);
        if (score < 60) score = 60;
        if (score > 98) score = 98;

        nextData.push({
          time: 'Just now',
          focus: score
        });

        // Restore historic timeline relative marks
        return nextData.map((d, idx) => {
          if (idx === nextData.length - 1) return d;
          return {
            ...d,
            time: `${nextData.length - 1 - idx}m ago`
          };
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // 1. Stacked Status Cards Configuration
  const metricCards = [
    {
      title: 'Blink rate',
      value: isSessionActive ? '14 /min' : '0 /min',
      status: 'Normal',
      statusColor: 'text-zinc-500/80',
      icon: Eye,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Gaze status',
      value: isSessionActive ? 'On screen' : 'Offline',
      status: isSessionActive ? '93% on target' : '--',
      statusColor: 'text-emerald-400/65',
      icon: Activity,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20'
    },
    {
      title: 'Attention state',
      value: isSessionActive ? 'Deep focus' : 'Idle',
      status: isSessionActive ? 'Sustained 42m' : '--',
      statusColor: 'text-violet-400/65',
      icon: Sparkles,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20'
    },
    {
      title: 'Posture',
      value: isSessionActive ? 'Upright' : 'Unknown',
      status: isSessionActive ? 'Slight forward lean' : '--',
      statusColor: 'text-amber-400/65',
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Active tab',
      value: isSessionActive ? 'docs.cognivue.ai' : 'None',
      status: 'Research category',
      statusColor: 'text-zinc-500/80',
      icon: Globe,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10 border-pink-500/20'
    }
  ];

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

        {/* ================= PRIMARY GRID SECTION ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Live Preview Panel */}
          <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8 w-full">
            
            {/* Webcam Preview glassmorphism container */}
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-md shadow-lg overflow-hidden flex flex-col min-h-[460px] relative select-none">
              
              {/* Overlay minimal design details */}
              <div className="absolute inset-0 grid-background opacity-[0.02] pointer-events-none" />
              
              {/* Top row controls */}
              <div className="flex items-center justify-between p-5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {isSessionActive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75" />
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isSessionActive ? 'bg-rose-500' : 'bg-zinc-500'}`} />
                  </span>
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${isSessionActive ? 'text-rose-400/90' : 'text-zinc-500'}`}>
                    LIVE
                  </span>
                </div>

                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-1.5 text-right flex flex-col gap-0.5 select-none">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Frame model</span>
                  <span className="text-[10px] font-bold text-zinc-200 leading-none mt-0.5">MediaPipe FaceMesh · 30fps</span>
                </div>
              </div>

              {/* Center Webcam Preview Placeholder */}
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[280px]">
                {/* Simulated webcam visual scanning layout */}
                <div className="absolute inset-x-8 inset-y-4 rounded-2xl border border-dashed border-white/[0.02] flex items-center justify-center">
                  <AnimatePresence>
                    {isSessionActive ? (
                      <motion.div 
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-4.5"
                      >
                        {/* Scanning Pulsing Camera Indicator */}
                        <div className="relative flex items-center justify-center">
                          <motion.div 
                            className="absolute h-18 w-18 rounded-full border border-cyan-400/20"
                            animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0.05, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                            <Camera className="h-5 w-5 animate-pulse" />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1 text-center">
                          <span className="text-xs font-semibold text-zinc-200 antialiased">
                            Webcam preview · 720p streaming
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500">
                            Facial tracking and optical flow vectors active
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="offline"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-3.5"
                      >
                        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-zinc-500/5 border border-white/5 text-zinc-650">
                          <Camera className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1 text-center">
                          <span className="text-xs font-semibold text-zinc-400 antialiased">
                            Session offline
                          </span>
                          <span className="text-[10px] font-medium text-zinc-600">
                            Local inference standby
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
                  <span className="text-3xl font-black text-cyan-400 tracking-tight leading-none mt-1 shadow-cyan-400/10 drop-shadow-[0_0_8px_rgba(6,182,212,0.15)]">
                    {isSessionActive ? liveFocusScore : '--'}
                  </span>
                </div>

                {/* Session triggers */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsSessionActive(true)}
                    disabled={isSessionActive}
                    className={`glow-btn inline-flex items-center gap-2 rounded-xl px-4.5 py-2.5 text-xs font-semibold text-white shadow-md transition-all duration-350 ${
                      isSessionActive 
                        ? 'opacity-40 cursor-not-allowed bg-white/[0.02] border border-white/5' 
                        : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500'
                    }`}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Start session</span>
                  </button>
                  <button 
                    onClick={() => setIsSessionActive(false)}
                    disabled={!isSessionActive}
                    className={`inline-flex items-center gap-2 rounded-xl border border-white/10 hover:border-white/20 px-4.5 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white transition-all duration-300 ${
                      !isSessionActive ? 'opacity-40 cursor-not-allowed bg-transparent' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <Square className="h-3.5 w-3.5 fill-current text-current" />
                    <span>End session</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Stacked Diagnostic Status Cards */}
          <div className="lg:col-span-4 flex flex-col gap-4 w-full">
            {metricCards.map((card, idx) => {
              const Icon = card.icon;

              return (
                <div 
                  key={idx}
                  className="group relative rounded-2xl border border-white/5 bg-slate-950/20 py-[18px] px-[22px] flex items-center justify-between select-none hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300"
                >
                  {/* Embedded soft atmospheric highlighting */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.005] via-transparent to-transparent pointer-events-none" />

                  {/* Left Info: Icon & labels */}
                  <div className="flex items-center gap-6 text-left relative z-10">
                    {/* Diagnostic Icon Box */}
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>

                    {/* Text block */}
                    <div className="flex flex-col gap-1 text-left justify-center">
                      <span className="text-[8px] font-bold text-zinc-500/90 uppercase tracking-widest leading-none">
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
        <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md shadow-lg select-none text-left relative overflow-hidden flex flex-col h-[280px]">
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
              <AreaChart data={focusStream} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="glowCyanLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.02)" vertical={false} />
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
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-white/10 bg-slate-950/90 p-2.5 shadow-2xl backdrop-blur-md text-left select-none text-[10px]">
                          <span className="font-semibold text-zinc-400">Focus Index:</span>{' '}
                          <span className="font-bold text-white">{payload[0].value}%</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: 'rgba(255, 255, 255, 0.04)', strokeWidth: 1 }} 
                />
                <Area 
                  type="monotone" 
                  name="Focus"
                  dataKey="focus" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#glowCyanLive)"
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#06b6d4' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= ADAPTIVE NUDGES SECTION ================= */}
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
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5">
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
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5">
                  Slight slouch — recalibrate in 2 min.
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
                  Load rising
                </h4>
                <p className="text-[11px] text-zinc-450 font-semibold mt-0.5">
                  Switching to dense reading. Consider chunking.
                </p>
              </div>
            </div>

          </div>
        </div>

      </motion.div>
    </DashboardLayout>
  );
};
