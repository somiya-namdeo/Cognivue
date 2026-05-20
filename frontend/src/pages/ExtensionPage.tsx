import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  Download, 
  Code, 
  Eye, 
  Zap, 
  Coffee, 
  ShieldAlert, 
  Pause, 
  Play,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

export const ExtensionPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Extension');
  const [isPaused, setIsPaused] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        ease: 'easeOut',
        duration: 0.5
      }
    }
  };

  const handleDownloadClick = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-cyan-500/20 bg-cyan-950/80 px-4 py-3 text-sm font-semibold text-cyan-400 backdrop-blur-md shadow-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Redirecting to Chrome Web Store...</span>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-10 sm:gap-12 text-left"
      >
        {/* ================= TOP TITLE HEADER ================= */}
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
            Chrome Extension
          </h2>
          <p className="text-[15px] leading-[1.6] text-white/70 font-medium mt-2 antialiased">
            Your cognitive coach, embedded in the browser.
          </p>
        </div>

        {/* ================= TWO COLUMNS HERO GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-center">
          
          {/* Left Column: SaaS copy and specs */}
          <div className="lg:col-span-5 flex flex-col items-start text-left select-none">
            <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-400 font-bold block mb-3">
              COGNIVUE · CHROME
            </span>
            <h3 className="text-[32px] md:text-[36px] font-semibold tracking-tight leading-tight text-white mb-4 antialiased">
              A focus HUD, one click away.
            </h3>
            <p className="text-[15px] leading-[1.7] text-white/70 font-normal mb-8 antialiased">
              The Cognivue extension lives in your toolbar and keeps your cognitive state in sight while you work — without ever sending raw vision data to the cloud.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <button 
                onClick={handleDownloadClick}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-xs font-bold text-slate-950 hover:bg-white/90 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Add to Chrome</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/[0.02] hover:border-white/20 transition-all">
                <Code className="h-4 w-4 text-zinc-400" />
                <span>View source</span>
              </button>
            </div>

            {/* Features Bullet List */}
            <div className="flex flex-col gap-5 w-full">
              {[
                { label: 'Live focus score on the toolbar badge', icon: Eye, bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
                { label: 'Distraction alerts when high-risk tabs open', icon: Zap, bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
                { label: 'Quick-break reminders based on fatigue', icon: Coffee, bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                { label: '100% local inference — no raw data leaves your device', icon: ShieldAlert, bg: 'bg-rose-500/10 border-rose-500/20 text-rose-455' }
              ].map((feature, idx) => {
                const Icon = feature.icon;

                return (
                  <div key={idx} className="flex items-center gap-4.5 text-left">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${feature.bg}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[14.5px] leading-normal text-white/80 font-medium antialiased">
                      {feature.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High Fidelity Browser Window Mockup */}
          <div className="lg:col-span-7 w-full flex justify-center">
            
            {/* Realistic Browser Window container */}
            <div className="w-full max-w-[620px] rounded-2xl border border-white/10 bg-slate-950/40 p-4.5 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden select-none">
              <div className="absolute inset-0 grid-background opacity-[0.015] pointer-events-none" />
              
              {/* Browser bar top */}
              <div className="flex items-center justify-between pb-4.5 border-b border-white/5 relative z-10">
                {/* 3 Mac traffic light window buttons */}
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>
                
                {/* URL box Address bar */}
                <div className="flex-1 max-w-[340px] mx-4 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-1 flex items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-zinc-400 tracking-wide font-mono">docs.cognivue.ai/research</span>
                </div>

                {/* Dummy browser profile */}
                <div className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Clock className="h-3 w-3" />
                </div>
              </div>

              {/* Browser viewport workspace */}
              <div className="pt-6 pb-2 min-h-[360px] flex items-center justify-center relative z-10">
                
                {/* Visual grid in web view */}
                <div className="absolute inset-0 grid-background opacity-[0.02] pointer-events-none" />

                {/* Ambient glow behind floating extension */}
                <div className="absolute top-[40%] right-[30%] w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* THE POPUP ELEMENT: Highly premium layout styling */}
                <div className="w-[320px] rounded-xl border border-white/10 bg-[#05050f]/90 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-left flex flex-col gap-4 relative">
                  
                  {/* Logo + Version */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5.5 w-5.5 rounded bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-tight">Cognivue</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 font-mono">v2.4.1</span>
                  </div>

                  {/* Main Focus Score meter card */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex items-center justify-between">
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-white/45 block mb-0.5">Current focus score</span>
                      <span className="text-[28px] font-bold text-white leading-none antialiased">92</span>
                      <span className="text-[10px] font-bold text-zinc-500 block mt-1.5 leading-none">Deep focus · 42m sustained</span>
                    </div>

                    {/* Glowing circular active scan eye icon */}
                    <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 relative">
                      <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping opacity-60" />
                      <Eye className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  {/* Play/Pause Button */}
                  <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className={`w-full py-2.5 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      isPaused 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                        : 'bg-white/[0.03] border-white/5 text-white hover:bg-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume focus session</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause focus session</span>
                      </>
                    )}
                  </button>

                  {/* Active tab */}
                  <div className="rounded-lg bg-white/[0.01] border border-white/[0.03] p-3 flex flex-col text-left">
                    <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block mb-1">Active tab</span>
                    <span className="text-xs font-semibold text-white truncate">docs.cognivue.ai - Research</span>
                    <span className="text-[10px] font-bold text-emerald-400 block mt-1 leading-none">
                      Productivity - matched today's goal
                    </span>
                  </div>

                  {/* Warning Notification banner */}
                  <div className="rounded-lg bg-amber-500/[0.02] border border-amber-500/20 p-3 flex flex-col text-left">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Zap className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Distraction alert</span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 mt-1 leading-snug">
                      youtube.com opened in background tab.
                    </span>

                    {/* Quick-action buttons */}
                    <div className="flex items-center gap-2 mt-2.5 select-none">
                      <button className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/5 text-[9px] font-bold text-zinc-400 hover:text-white transition-all">
                        Snooze
                      </button>
                      <button className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-455 hover:bg-rose-500/15 transition-all">
                        Close tab
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ================= BOTTOM PRIVACY ASSURANCE SECTION ================= */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5 select-none hover:border-white/10 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.3)] mt-4">
          
          <div className="flex items-center gap-5 text-left w-full sm:w-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold block mb-0.5">
                Privacy guaranteed
              </span>
              <span className="text-[14.5px] font-medium text-white/80 antialiased leading-normal">
                All telemetry data is processed locally on your machine. We never track keys, keystrokes, or display screens.
              </span>
            </div>
          </div>

          <button className="rounded-xl border border-white/10 hover:border-white/20 px-5 py-3 text-[13px] font-semibold text-white hover:bg-white/[0.04] transition-all duration-300 shrink-0 w-full sm:w-auto justify-center">
            Read privacy manifesto
          </button>

        </div>

      </motion.div>
    </DashboardLayout>
  );
};
