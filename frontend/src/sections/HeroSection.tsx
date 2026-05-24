import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Brain, Eye, Sparkles, Clock, Zap } from 'lucide-react';

export const HeroSection = () => {
  const [sessionTime, setSessionTime] = useState('00:42:18');
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  // Mouse Parallax listener only for the hero section
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Extremely subtle motion coefficient (max ~6px drift) to maintain elegant calmness
      const x = (e.clientX - window.innerWidth / 2) * 0.007;
      const y = (e.clientY - window.innerHeight / 2) * 0.007;
      setMouseCoords({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update live timer slightly to feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      const parts = sessionTime.split(':');
      let secs = parseInt(parts[2], 10);
      let mins = parseInt(parts[1], 10);
      let hrs = parseInt(parts[0], 10);

      secs += 1;
      if (secs >= 60) {
        secs = 0;
        mins += 1;
      }
      if (mins >= 60) {
        mins = 0;
        hrs += 1;
      }

      const pad = (num: number) => String(num).padStart(2, '0');
      setSessionTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionTime]);



  return (
    <section id="hero" className="relative mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 z-10">
      
      {/* Glow effects for Hero section - very soft atmospheric blurs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/[0.03] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-violet-500/[0.03] blur-[140px] rounded-full pointer-events-none" />

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:items-center">
        
        {/* Left Side Content */}
        <motion.div 
          className="lg:col-span-6 flex flex-col items-start text-left"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Glowing Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-950/15 px-3.5 py-1 text-xs font-semibold text-cyan-400 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.05)] select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            Local inference active
          </div>

          {/* Title */}
          <div className="relative mt-8 select-none">
            {/* Extremely subtle non-neon background glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 blur-xl opacity-40 pointer-events-none" />
            <h1 className="relative font-sans text-6xl sm:text-7xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400">
                Cognivue
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            Understand focus. Unlock performance.
          </h2>

          {/* Description */}
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            Cognivue helps you understand attention, fatigue and deep-work patterns in real time through privacy-first cognitive intelligence.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-wrap gap-4 items-center">
            {/* Start Monitoring */}
            <Link
              to="/signup"
              className="glow-btn group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.18)] select-none hover:scale-[1.01]"
            >
              Start Monitoring
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-200" />
            </Link>
          </div>

          {/* Clean, Research-Grade Metadata Row (Replaced trust badges) */}
          <div className="mt-16 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-900/50 pt-8 w-full text-xs font-semibold text-zinc-500 select-none tracking-wider uppercase">
            <span>On-device AI</span>
            <span className="text-cyan-500/35 font-extrabold select-none text-[8px] mx-1">•</span>
            <span>Privacy-first</span>
            <span className="text-cyan-500/35 font-extrabold select-none text-[8px] mx-1">•</span>
            <span>Real-time cognitive analytics</span>
          </div>
        </motion.div>

        {/* Right Side Content */}
        <motion.div 
          className="lg:col-span-6 relative flex justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
          style={{
            transform: `translate3d(${mouseCoords.x}px, ${mouseCoords.y}px, 0)`,
            transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)', // smooth spring inertia
          }}
        >
          {/* Main Panel Wrapper - Softened diffuse shadow */}
          <div className="relative w-full max-w-[480px] rounded-2xl glass-panel p-6 shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-white/5 bg-slate-950/40 select-none animate-float">
            
            {/* Ambient inner panel glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/3 to-violet-500/3 rounded-2xl pointer-events-none" />

            {/* TOP PIL: Burnout risk floating card */}
            <div className="absolute -top-5 -right-4 flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-950/70 px-4 py-1.5 text-[11px] font-semibold text-violet-300 backdrop-blur-xl shadow-lg">
              <Zap className="h-3 w-3 text-violet-400 fill-violet-400/20" />
              <span>Burnout risk · 14%</span>
            </div>

            {/* BOTTOM PIL: Productivity floating card */}
            <div className="absolute -bottom-5 -left-4 flex items-center gap-1.5 rounded-full border border-cyan-500/15 bg-cyan-950/70 px-4 py-1.5 text-[11px] font-semibold text-cyan-300 backdrop-blur-xl shadow-lg">
              <Activity className="h-3 w-3 text-cyan-400" />
              <span>Productivity index · 84</span>
            </div>

            {/* Panel Header */}
            <div className="flex items-center justify-between pb-5 border-b border-zinc-900/50">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">Live session - {sessionTime}</span>
              </div>
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Deep work</span>
            </div>

            {/* Matrix Core Widgets Grid */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              
              {/* FOCUS CARD */}
              <div className="rounded-xl border border-white/[0.015] bg-white/[0.01] p-4 flex flex-col justify-between hover:border-cyan-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Focus</span>
                  <Eye className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-cyan-400 tracking-tight">92</span>
                  <span className="text-sm font-medium text-zinc-650">/100</span>
                </div>
              </div>

              {/* COGNITIVE LOAD CARD */}
              <div className="rounded-xl border border-white/[0.015] bg-white/[0.01] p-4 flex flex-col justify-between hover:border-violet-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Cognitive Load</span>
                  <Brain className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-violet-400 tracking-tight">68</span>
                  <span className="text-sm font-medium text-zinc-650">%</span>
                </div>
              </div>

              {/* FATIGUE CARD */}
              <div className="rounded-xl border border-white/[0.015] bg-white/[0.01] p-4 flex flex-col justify-between hover:border-emerald-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Fatigue</span>
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">Low</span>
                </div>
              </div>

              {/* BLINK RATE CARD */}
              <div className="rounded-xl border border-white/[0.015] bg-white/[0.01] p-4 flex flex-col justify-between hover:border-amber-500/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Blink Rate</span>
                  <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-amber-550 tracking-tight">14</span>
                  <span className="text-sm font-medium text-zinc-650">/min</span>
                </div>
              </div>

            </div>

            {/* AI Suggestion Panel */}
            <div className="mt-5 rounded-xl border border-white/[0.015] bg-white/[0.015] p-4 text-left">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase block">AI suggestion</span>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-300 font-medium">
                You've sustained deep focus for 42m. Take a 5-minute hydration break to preserve performance.
              </p>
            </div>

            {/* Cognitive Activity Waveform */}
            <div className="mt-5 pt-5 border-t border-zinc-900/50 flex flex-col gap-2.5 text-left">
              <div className="flex items-center justify-between select-none">
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Cognitive Activity Waveform</span>
                <span className="text-[9px] font-semibold text-cyan-400 font-mono flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping" />
                  Live feedback loop
                </span>
              </div>
              <div className="h-12 w-full bg-[#030308]/60 border border-white/[0.02] rounded-lg overflow-hidden flex items-center relative p-1.5">
                <svg className="w-full h-full text-cyan-500/20 animate-pulse" viewBox="0 0 100 30" preserveAspectRatio="none">
                  {/* Static reference grid lines */}
                  <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                  
                  {/* Dynamic pulse graph */}
                  <motion.path
                    d="M 0 15 Q 10 5, 20 20 T 40 10 T 60 22 T 80 8 T 100 15"
                    fill="none"
                    stroke="url(#gradient-wave)"
                    strokeWidth="1.5"
                    animate={{
                      strokeDashoffset: [0, -100],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    style={{
                      strokeDasharray: "10, 2",
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient-wave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};
