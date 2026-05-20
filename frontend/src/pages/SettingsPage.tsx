import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Camera, 
  ShieldAlert, 
  Bell, 
  Globe, 
  Download, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { getCurrentUserProfile } from '../services/api';

export const SettingsPage: React.FC = () => {
  const profile = getCurrentUserProfile();
  const [activeItem, setActiveItem] = useState('Settings');
  const [email, setEmail] = useState(() => profile.email);
  const [location, setLocation] = useState('Bangalore, India');
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [shareData, setShareData] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-cyan-500/20 bg-cyan-950/80 px-4 py-3 text-sm font-semibold text-cyan-400 backdrop-blur-md shadow-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-8 text-left"
      >
        {/* ================= TOP TITLE SECTION ================= */}
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
            Profile & Settings
          </h2>
          <p className="text-[15px] leading-[1.6] text-white/70 font-medium mt-2 antialiased">
            Manage your account, privacy and device integrations.
          </p>
        </div>

        {/* ================= MAIN CONFIGURATION GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch select-none">
          
          {/* ================= LEFT COLUMN: Profile & Theme ================= */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Card 1: User Profile details card */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-6 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-white/10 transition-all duration-300">
              
              <div className="flex items-center gap-4.5 mb-6">
                {/* Custom Avatar Circle */}
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-[22px] font-bold tracking-tight shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  {profile.initials}
                </div>
                
                <div className="flex flex-col text-left">
                  <h4 className="text-[20px] font-semibold text-white tracking-tight leading-none">{profile.displayName}</h4>
                </div>
              </div>

              {/* Input details with icons */}
              <div className="flex flex-col gap-4">
                
                {/* Email row */}
                <div className="relative w-full">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.01] text-[14.5px] font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/20 transition-all"
                  />
                </div>

                {/* Location row */}
                <div className="relative w-full">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.01] text-[14.5px] font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/20 transition-all"
                  />
                </div>

                {/* 2FA check verification badge */}
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] text-emerald-400 text-left">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span className="text-xs font-semibold">Verified - 2FA enabled</span>
                </div>

                {/* Action button */}
                <button 
                  onClick={() => triggerToast('Profile changes saved successfully!')}
                  className="w-full py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 text-xs font-bold text-white transition-all mt-2"
                >
                  Edit profile
                </button>
              </div>

            </div>

            {/* Card 2: Appearance Theme Card selection */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-6 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-white/10 transition-all duration-300 select-none text-left">
              
              <div className="mb-5">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Appearance</span>
                <h4 className="text-[18px] font-semibold text-white tracking-tight">Pick the interface theme.</h4>
              </div>

              {/* Two Column cards */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Dark Mode active card */}
                <div className="rounded-xl border border-cyan-500/40 bg-[#030712] p-3.5 flex items-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <Moon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-none">Dark</span>
                    <span className="text-[10px] font-semibold text-zinc-500 mt-1.5 leading-none">Command center</span>
                  </div>
                </div>

                {/* Light Mode disabled card */}
                <div 
                  onClick={() => triggerToast('Cognivue is highly optimized for cinematic dark themes.')}
                  className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex items-center gap-3 hover:bg-white/[0.02] hover:border-white/10 transition-all cursor-pointer group opacity-60 hover:opacity-80 animate-none"
                >
                  <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center text-zinc-500 group-hover:text-white shrink-0 transition-all">
                    <Sun className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-zinc-400 leading-none">Light</span>
                    <span className="text-[10px] font-semibold text-zinc-600 mt-1.5 leading-none">Daytime</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* ================= RIGHT COLUMN: Privacy Configs & Telemetries ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Privacy Card options panel */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-6 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-white/10 transition-all duration-300">
              
              <div className="mb-6 text-left border-b border-white/[0.03] pb-4">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Privacy & devices</span>
                <h4 className="text-[20px] font-semibold text-white tracking-tight">All vision inference runs locally. Telemetry is opt-in.</h4>
              </div>

              {/* Rows checklist items */}
              <div className="flex flex-col">
                
                {/* webcam permission */}
                <div className="py-5 border-b border-white/[0.03] flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Camera className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Webcam permission</span>
                      <span className="text-xs font-medium text-zinc-400 mt-1 leading-normal">
                        Used for on-device gaze, blink and posture analysis.
                      </span>
                    </div>
                  </div>

                  {/* Toggle switch slider button */}
                  <button 
                    onClick={() => {
                      setWebcamEnabled(!webcamEnabled);
                      triggerToast(`Webcam telemetry tracking ${!webcamEnabled ? 'activated' : 'deactivated'}`);
                    }}
                    className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${webcamEnabled ? 'bg-cyan-500' : 'bg-white/[0.06] border border-white/5'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${webcamEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* share telemetry */}
                <div className="py-5 border-b border-white/[0.03] flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <ShieldAlert className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Share anonymous research data</span>
                      <span className="text-xs font-medium text-zinc-400 mt-1 leading-normal">
                        Help improve cognitive models. Opt-in, fully anonymised.
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShareData(!shareData);
                      triggerToast(`Data sharing setting updated to: ${!shareData ? 'Opt-in' : 'Opt-out'}`);
                    }}
                    className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${shareData ? 'bg-cyan-500' : 'bg-white/[0.06] border border-white/5'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${shareData ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* coach notifications */}
                <div className="py-5 border-b border-white/[0.03] flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Coach notifications</span>
                      <span className="text-xs font-medium text-zinc-400 mt-1 leading-normal">
                        Receive nudges for breaks, posture and focus drift.
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setNotifications(!notifications);
                      triggerToast(`Break & coach reminders ${!notifications ? 'allowed' : 'disabled'}`);
                    }}
                    className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${notifications ? 'bg-cyan-500' : 'bg-white/[0.06] border border-white/5'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${notifications ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* chrome extension connected status row */}
                <div className="py-5 flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-[#0e0e23] border border-white/[0.04] flex items-center justify-center text-zinc-400">
                      <Globe className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Chrome extension</span>
                      <span className="text-xs font-medium text-zinc-400 mt-1 leading-normal">
                        Connected · v2.4.1 · last sync 2m ago
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wide shrink-0">
                    Connected
                  </span>
                </div>

              </div>

            </div>

            {/* Data & accounts management cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full text-left select-none">
              
              {/* Export data */}
              <div 
                onClick={() => triggerToast('Your metrics data export has started!')}
                className="rounded-2xl border border-white/5 bg-slate-950/20 p-4.5 backdrop-blur-md flex flex-col justify-between gap-3 hover:border-white/10 hover:bg-slate-950/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Download className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col text-left mt-1.5">
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">Export my data</span>
                  <span className="text-xs font-semibold text-white/40 mt-1 leading-normal">
                    Download all sessions and insights as JSON.
                  </span>
                </div>
              </div>

              {/* Delete account */}
              <div 
                onClick={() => triggerToast('Please contact enterprise support to complete account deletion.')}
                className="rounded-2xl border border-rose-500/5 bg-slate-950/20 p-4.5 backdrop-blur-md flex flex-col justify-between gap-3 hover:border-rose-500/15 hover:bg-rose-950/[0.02] transition-all duration-300 cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-455">
                  <Trash2 className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col text-left mt-1.5">
                  <span className="text-sm font-semibold text-white group-hover:text-rose-450 transition-colors">Delete account</span>
                  <span className="text-xs font-semibold text-white/40 mt-1 leading-normal">
                    Permanently remove your data from Cognivue.
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </motion.div>
    </DashboardLayout>
  );
};
