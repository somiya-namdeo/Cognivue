import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { MetricCards } from '../components/MetricCards';
import { 
  AttentionLoadChart, 
  FocusProductivityChart, 
  RealtimeLoadChart 
} from '../components/AnalyticsCharts';
import { InsightsPanel } from '../components/InsightsPanel';
import { SessionsTable } from '../components/SessionsTable';
import { 
  Activity, 
  Sparkles, 
  Clock, 
  Globe, 
  Settings,
  Cpu,
  ArrowUpRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(() => {
    return (location.state as any)?.activeTab || 'Dashboard';
  });

  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    if ((location.state as any)?.activeTab) {
      setActiveItem((location.state as any).activeTab);
    }
    const timer = setTimeout(() => {
      setIsSyncing(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [location.state]);

  // Animation variants for panel transitions
  const fadeVariants: Variants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
  };

  const renderDashboardSkeleton = () => {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 animate-pulse text-left select-none">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 bg-white/5 rounded-lg" />
          <div className="h-4 w-96 bg-white/5 rounded-md" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[92px] rounded-2xl border border-white/5 bg-white/[0.01] p-5.5 flex items-center gap-4.5">
              <div className="h-10 w-10 rounded-xl bg-white/5 shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <div className="h-3 w-1/3 bg-white/5 rounded" />
                <div className="h-5 w-1/2 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Primary row: Charts & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-8 w-full">
            <div className="h-[360px] rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-4 w-48 bg-white/5 rounded" />
                <div className="h-4 w-24 bg-white/5 rounded" />
              </div>
              <div className="flex-1 flex items-end gap-3 mt-8">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-white/5 rounded-t"
                    style={{ height: `${20 + (i % 4) * 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 w-full">
            <div className="h-[360px] rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col gap-4">
              <div className="h-4 w-32 bg-white/5 rounded" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 mt-2">
                  <div className="h-8 w-8 rounded-lg bg-white/5 shrink-0" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                    <div className="h-2 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Row: Mini charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="lg:col-span-6 w-full">
              <div className="h-[280px] rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col justify-between">
                <div className="h-4 w-32 bg-white/5 rounded" />
                <div className="flex-1 bg-white/5 rounded-xl mt-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Sub-view router inside the dashboard
  const renderContent = () => {
    switch (activeItem) {
      case 'Dashboard':
        if (isSyncing) {
          return renderDashboardSkeleton();
        }
        return (
          <motion.div 
            key="dashboard"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6 sm:gap-8"
          >
            {/* 1. Header welcome banner */}
            <div className="flex flex-col text-left">
              <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white select-none">
                Welcome back, Aarav
              </h2>
              <p className="text-sm font-semibold text-zinc-450 mt-1">
                Your cognitive performance is up{' '}
                <span className="text-cyan-400 font-extrabold">12%</span> this week.
              </p>
            </div>

            {/* 2. Overview metric cards */}
            <MetricCards />

            {/* 3. Primary row: Attention vs load & coach insights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              <div className="lg:col-span-8 w-full">
                <AttentionLoadChart />
              </div>
              <div className="lg:col-span-4 w-full">
                <InsightsPanel />
              </div>
            </div>

            {/* 4. Secondary row: Focus vs productivity & realtime timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              <div className="lg:col-span-6 w-full">
                <FocusProductivityChart />
              </div>
              <div className="lg:col-span-6 w-full">
                <RealtimeLoadChart />
              </div>
            </div>

            {/* 5. Tertiary row: Recent sessions history table */}
            <SessionsTable />

          </motion.div>
        );

      case 'Live Monitoring':
        return (
          <motion.div 
            key="live"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col gap-6 text-left"
          >
            <div>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white">Live Monitoring</h2>
              <p className="text-sm font-semibold text-zinc-450 mt-1">Real-time telemetry stream from your local browser agent.</p>
            </div>

            {/* Interactive glass preview container */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4">
                <Activity className="h-6 w-6 text-cyan-400 animate-pulse" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Live Session Active</h3>
              <p className="text-sm text-zinc-450 max-w-sm mb-6 leading-relaxed">
                Connect your webcam or Chrome extension to initiate real-time focus calibration and cognitive load analytics.
              </p>
              
              <button className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md">
                <span>Calibrate sensor</span>
                <Cpu className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );

      case 'AI Insights':
        return (
          <motion.div 
            key="insights"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col gap-6 text-left"
          >
            <div>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white">AI Insights</h2>
              <p className="text-sm font-semibold text-zinc-450 mt-1">Deep analysis and burnout risk profiling powered by local inference.</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/2 via-cyan-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/35 shadow-[0_0_15px_rgba(139,92,246,0.2)] mb-4">
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Extended Analytics</h3>
              <p className="text-sm text-zinc-450 max-w-sm mb-6 leading-relaxed">
                Your performance reports require a minimum of three logs this week. Keep monitoring to unlock focus heatmaps.
              </p>
            </div>
          </motion.div>
        );

      case 'Sessions':
        return (
          <motion.div 
            key="sessions"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col gap-6 text-left"
          >
            <div>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white">Session History</h2>
              <p className="text-sm font-semibold text-zinc-450 mt-1">Browse, filter and export your historical cognitive load metrics.</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.2)] mb-4">
                <Clock className="h-6 w-6 text-indigo-450" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Session Archives</h3>
              <p className="text-sm text-zinc-450 max-w-sm mb-6 leading-relaxed">
                All telemetry data is stored locally in an encrypted sandbox. You can download your sessions as standard JSON files.
              </p>
            </div>
          </motion.div>
        );

      case 'Extension':
        return (
          <motion.div 
            key="extension"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col gap-6 text-left"
          >
            <div>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white">Browser Extension</h2>
              <p className="text-sm font-semibold text-zinc-450 mt-1">Sync your Chrome Extension to aggregate browser signals privately.</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4">
                <Globe className="h-6 w-6 text-cyan-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Chrome Sync</h3>
              <p className="text-sm text-zinc-450 max-w-md mb-6 leading-relaxed">
                Unlock tab-switching analytics, scroll rates, and active tab cognitive load scoring. Install from the Chrome Web Store in one click.
              </p>
              
              <button className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md">
                <span>Download Extension</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );

      case 'Settings':
        return (
          <motion.div 
            key="settings"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col gap-6 text-left"
          >
            <div>
              <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white">Settings</h2>
              <p className="text-sm font-semibold text-zinc-450 mt-1">Configure profile metrics, on-device AI sensors, and data export.</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/35 shadow-[0_0_15px_rgba(139,92,246,0.2)] mb-4">
                <Settings className="h-6 w-6 text-violet-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Preference Portal</h3>
              <p className="text-sm text-zinc-450 max-w-sm mb-6 leading-relaxed">
                Tweak local AI inference rates, modify alerts sensitivity, and manage your device pairing codes securely.
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </DashboardLayout>
  );
};
