import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowLeft, Terminal, ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-transparent text-zinc-300 overflow-hidden flex flex-col items-center justify-center p-6 select-none">
      
      {/* ================= BACKGROUND SYSTEM ================= */}
      {/* 1. Base Grid Overlay */}
      <div className="grid-background absolute inset-0 z-0 opacity-[0.03] pointer-events-none" />

      {/* 2. Soft Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,#03030b_95%)] pointer-events-none z-0 opacity-80" />

      {/* 3. Cyan Blur Glow Blob (Left Side) */}
      <div className="absolute left-[15%] top-[25%] w-[450px] h-[450px] rounded-full bg-cyan-500/[0.045] blur-[100px] pointer-events-none z-0" />

      {/* 4. Violet Blur Glow Blob (Right Side) */}
      <div className="absolute right-[15%] bottom-[25%] w-[450px] h-[450px] rounded-full bg-violet-500/[0.04] blur-[110px] pointer-events-none z-0" />

      {/* Ambient Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute h-1 rounded-full ${i % 2 === 0 ? 'bg-cyan-400/10' : 'bg-violet-400/8'}`}
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              width: i % 2 === 0 ? '3px' : '4px',
              height: i % 2 === 0 ? '3px' : '4px',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.08, 0.25, 0.08],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ================= 404 CONTENT CONTAINER ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center relative z-10 flex flex-col items-center gap-6"
      >
        
        {/* Glowing Brain Scanner Icon with active warning alerts */}
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 relative shadow-[0_0_20px_rgba(6,182,212,0.08)]">
          <Brain className="h-7 w-7 text-cyan-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-455 flex items-center justify-center">
            <ShieldAlert className="h-3 w-3" />
          </div>
        </div>

        {/* Status Tag */}
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400 font-mono bg-cyan-950/20 border border-cyan-500/20 px-3 py-1 rounded-full">
          Error 404 · Synaptic Path Lost
        </span>

        {/* Message Head */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-bold text-white tracking-tight leading-tight">
            Pathway Unresolved
          </h1>
          <p className="text-sm font-medium text-zinc-400 leading-relaxed px-2">
            The neural route you requested is inactive or has been cleared from short-term memory.
          </p>
        </div>

        {/* Mock console logger showing details */}
        <div className="w-full bg-[#030308]/60 border border-white/[0.03] rounded-xl p-3.5 font-mono text-[11px] text-zinc-500 text-left flex flex-col gap-1.5 leading-normal relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-cyan-400/70 border-b border-white/[0.03] pb-1.5 mb-1">
            <Terminal className="h-3.5 w-3.5" />
            <span className="font-bold uppercase tracking-wider">Cognivue Terminal</span>
          </div>
          <div><span className="text-zinc-600">&gt;</span> request_uri: <span className="text-rose-450">{window.location.pathname}</span></div>
          <div><span className="text-zinc-600">&gt;</span> error_code: <span className="text-amber-400">PATH_NOT_RESOLVED_404</span></div>
          <div><span className="text-zinc-600">&gt;</span> telemetry: <span className="text-emerald-400">online_inference_valid</span></div>
        </div>

        {/* Return to home button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-xs font-bold text-slate-950 hover:bg-white/90 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all cursor-pointer w-full mt-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>

      </motion.div>
    </div>
  );
};
