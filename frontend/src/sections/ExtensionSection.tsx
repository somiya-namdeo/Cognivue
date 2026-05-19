import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Brain, Eye, Zap } from 'lucide-react';

export const ExtensionSection = () => {
  const bulletFeatures = [
    'Active tab awareness',
    'Real-time focus badge',
    'Quick break reminders',
    'One-click session control',
  ];

  return (
    <section id="extension" className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 z-10 border-t border-zinc-900/40">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Large Premium Glass Container */}
      <div className="relative w-full rounded-3xl glass-panel p-8 sm:p-12 md:p-16 border border-white/5 bg-slate-950/20 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-violet-500/2 to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center relative z-10">
          
          {/* Left Side Info */}
          <div className="lg:col-span-7 text-left flex flex-col items-start">
            <span className="text-[11px] font-extrabold tracking-wider text-cyan-400 uppercase">
              Chrome Extension
            </span>
            <h2 className="mt-4 font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white select-none leading-tight">
              Your cognitive coach, one click away.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 max-w-xl">
              A featherweight popup that runs alongside your work — flags distractions, surfaces your focus score and nudges micro-breaks.
            </p>

            {/* Button */}
            <a 
              href="#preview"
              className="mt-8 group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-zinc-100 hover:scale-[1.01] active:scale-[0.99] select-none shadow-sm"
            >
              Preview extension
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-200" />
            </a>

            {/* Bullet Checklist */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bulletFeatures.map((feat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-zinc-300">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Chrome Extension Popup Mockup */}
          <motion.div 
            className="lg:col-span-5 flex justify-center"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Pop-up Window Container */}
            <div className="relative w-full max-w-[340px] rounded-xl border border-white/5 bg-slate-950 p-5 shadow-2xl text-left select-none">
              
              {/* Pop-up Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-extrabold text-white tracking-tight">Cognivue</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-medium">v2.4</span>
              </div>

              {/* Pop-up Body Content */}
              <div className="mt-4 space-y-4">
                
                {/* Score panel with circular progress */}
                <div className="rounded-lg border border-white/[0.02] bg-white/[0.01] p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Focus score</span>
                    <span className="text-3xl font-extrabold text-white tracking-tight mt-1">92</span>
                  </div>
                  
                  {/* Gauge ring */}
                  <div className="relative h-12 w-12 flex items-center justify-center">
                    {/* Ring background */}
                    <svg className="absolute transform -rotate-90" width="48" height="48">
                      <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.03)" strokeWidth="3" fill="transparent" />
                      <circle 
                        cx="24" 
                        cy="24" 
                        r="20" 
                        stroke="url(#gradient-cyan-violet)" 
                        strokeWidth="3.5" 
                        fill="transparent" 
                        strokeDasharray="125.6" 
                        strokeDashoffset="10" 
                      />
                      <defs>
                        <linearGradient id="gradient-cyan-violet" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <Eye className="h-4 w-4 text-cyan-400" />
                  </div>
                </div>

                {/* Main Session Control Button */}
                <button className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 text-xs font-bold text-white shadow-md hover:opacity-90 active:scale-[0.99] transition-all">
                  Start Focus Session
                </button>

                {/* Active Tab Panel */}
                <div className="rounded-lg border border-white/[0.02] bg-white/[0.01] p-3">
                  <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase block">Active tab</span>
                  <span className="mt-1 text-xs text-zinc-300 font-semibold block overflow-hidden text-ellipsis whitespace-nowrap bg-zinc-950/40 p-2 rounded border border-white/[0.01]">
                    docs.cognivue.ai - Research
                  </span>
                </div>

                {/* Distraction Alert Card */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 flex items-center gap-2.5">
                  <Zap className="h-4.5 w-4.5 text-amber-500 shrink-0 fill-amber-500/20" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-amber-500 leading-snug">Distraction detected: youtube.com</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

        </div>
      </div>

    </section>
  );
};
