import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { getLocalSession, getDashboardAnalytics, getAIInsights, getExtensionActivity } from '../services/api';
import { useProfile } from '../hooks/useProfile';
import type { DashboardAnalytics, AdvancedAIInsightsResponse, ExtensionActivityResponse } from '../services/api';
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
  ArrowUpRight,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const profile = useProfile();
  const location = useLocation();
  const stateActiveTab = (location.state as { activeTab?: string } | null)?.activeTab;

  const [activeItem, setActiveItem] = useState(stateActiveTab || 'Dashboard');
  const [prevActiveTab, setPrevActiveTab] = useState(stateActiveTab);

  if (stateActiveTab !== prevActiveTab) {
    setPrevActiveTab(stateActiveTab);
    setActiveItem(stateActiveTab || 'Dashboard');
  }

  const [isSyncing, setIsSyncing] = useState(true);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [aiInsights, setAiInsights] = useState<AdvancedAIInsightsResponse | null>(null);
  const [extActivity, setExtActivity] = useState<ExtensionActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      const session = getLocalSession();
      if (!session.userId) {
        setApiError("User ID not found. Please log in again.");
        setIsLoading(false);
        setIsSyncing(false);
        return;
      }
      
      const data = await getDashboardAnalytics(session.userId);
      setAnalytics(data);

      try {
        const insightsData = await getAIInsights(session.userId);
        setAiInsights(insightsData);
      } catch (err) {
        console.warn("Failed to load Advanced AI Insights", err);
      }
      
      try {
        const extData = await getExtensionActivity(session.userId);
        if (extData && extData.length > 0) {
          setExtActivity(extData[0]);
        }
      } catch (err) {
        console.warn("Failed to load Extension Activity", err);
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard analytics:", err);
      setApiError("Unable to load dashboard analytics. Please make sure the backend server is running.");
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [location.state]);

  const derivedInsights = React.useMemo(() => {
    if (!analytics || analytics.total_sessions === 0) return [];
    
    // Prioritize 1: Latest AI Insight
    if (aiInsights?.insights && aiInsights.insights.length > 0) {
      const topAI = aiInsights.insights[0];
      return [{
        title: topAI.title,
        description: topAI.summary,
        type: (topAI.severity === 'positive' ? 'positive' : (topAI.severity === 'warning' || topAI.severity === 'critical') ? 'warning' : 'neutral') as 'positive' | 'warning' | 'neutral'
      }];
    }
    
    // Prioritize 2: Browser Extension context
    if (extActivity && extActivity.risk_level === 'High') {
      return [{
        title: "High Risk Browsing Activity",
        description: `You recently spent time on ${extActivity.domain} (${extActivity.category}). Consider closing distracting tabs to regain focus.`,
        type: "warning" as 'positive' | 'warning' | 'neutral'
      }];
    } else if (extActivity && extActivity.risk_level === 'Low' && extActivity.mode === 'Productive') {
      return [{
        title: "Productive Flow Maintained",
        description: `Your active domain ${extActivity.domain} aligns with your focus goals. Great work!`,
        type: "positive" as 'positive' | 'warning' | 'neutral'
      }];
    }

    // Prioritize 2: Telemetry Quality Warning
    // We can infer poor telemetry if there's an active session with low metrics, but the easiest is using recent sessions
    const recent = analytics.recent_sessions && analytics.recent_sessions.length > 0 ? analytics.recent_sessions[0] : null;
    if (recent && recent.focus_score !== undefined && recent.focus_score < 30 && recent.productivity_score < 20) {
      // It's hard to definitively know telemetry quality here, but we can assume if it's really low, it might be partial.
      // Alternatively, we use the backend coach_insights logic! The backend analytics service sends basic insights.
    }

    // Since the prompt asks to derive it based on real session history:
    const avgFocus = analytics.average_focus;
    const avgFatigue = analytics.average_fatigue_score;
    const recentSession = analytics.recent_sessions?.[0];

    if (recentSession && recentSession.focus_score !== null && recentSession.focus_score < 20 && (recentSession.duration_minutes || 0) > 1) {
       return [{
         title: "Tracking Instability",
         description: "Telemetry quality was limited. Complete a stable monitoring session for stronger coaching insights.",
         type: "warning" as 'positive' | 'warning' | 'neutral'
       }];
    }

    if (avgFatigue > 50 || (recentSession && recentSession.fatigue_level === 'High')) {
      return [{
        title: "Fatigue indicators suggest recovery breaks",
        description: "Elevated physical/mental weariness detected across recent history. A brief rest interval is highly recommended.",
        type: "warning" as 'positive' | 'warning' | 'neutral'
      }];
    }

    if (avgFocus >= 80) {
      return [{
        title: "Strong focus consistency detected",
        description: "Your session history shows stable attention performance.",
        type: "positive" as 'positive' | 'warning' | 'neutral'
      }];
    }

    // Fallback based on basic metrics
    return [{
      title: "Session data analyzed",
      description: "Keep tracking your deep work to unlock more precise behavioral coaching.",
      type: "neutral" as 'positive' | 'warning' | 'neutral'
    }];
  }, [analytics, aiInsights, extActivity]);

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
          <div className="h-8 w-64 bg-border-color rounded-lg" />
          <div className="h-4 w-96 bg-border-color rounded-md" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[92px] rounded-2xl border border-white/10 bg-white/[0.02] p-5.5 flex items-center gap-4.5">
              <div className="h-10 w-10 rounded-xl bg-border-color shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <div className="h-3 w-1/3 bg-border-color rounded" />
                <div className="h-5 w-1/2 bg-border-color rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Primary row: Charts & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-8 w-full">
            <div className="h-[360px] rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-4 w-48 bg-border-color rounded" />
                <div className="h-4 w-24 bg-border-color rounded" />
              </div>
              <div className="flex-1 flex items-end gap-3 mt-8">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-border-color rounded-t"
                    style={{ height: `${20 + (i % 4) * 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 w-full">
            <div className="h-[360px] rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-4">
              <div className="h-4 w-32 bg-border-color rounded" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 mt-2">
                  <div className="h-8 w-8 rounded-lg bg-border-color shrink-0" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="h-3 w-3/4 bg-border-color rounded" />
                    <div className="h-2 w-1/2 bg-border-color rounded" />
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
              <div className="h-[280px] rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between">
                <div className="h-4 w-32 bg-border-color rounded" />
                <div className="flex-1 bg-border-color rounded-xl mt-6" />
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

        if (apiError !== null) {
          return (
            <motion.div 
              key="dashboard-error"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6 sm:gap-8"
            >
              {/* Header welcome banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
                <div>
                  <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white select-none">
                    Welcome back, {profile.displayName}
                  </h2>
                  <p className="text-sm font-semibold text-zinc-400 mt-1">
                    Unable to retrieve latest statistics.
                  </p>
                </div>
              </div>

              {/* Error state glass card */}
              <div className="rounded-2xl border border-red-500/10 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center select-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-red-500/2 to-transparent pointer-events-none" />
                
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/35 shadow-[0_0_15px_rgba(239,68,68,0.2)] mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400 animate-bounce" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
                <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                  {apiError}
                </p>
                
                <button 
                  onClick={fetchAnalytics}
                  className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02]"
                >
                  <span>Retry Connection</span>
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        }

        if (analytics && analytics.total_sessions === 0) {
          return (
            <motion.div 
              key="dashboard-empty"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6 sm:gap-8"
            >
              {/* Header welcome banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
                <div>
                  <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white select-none">
                    Welcome back, {profile.displayName}
                  </h2>
                  <p className="text-sm font-semibold text-zinc-400 mt-1">
                    Start a session to generate analytics.
                  </p>
                </div>
                <button 
                  onClick={fetchAnalytics}
                  disabled={isLoading}
                  className="flex items-center gap-2 self-start sm:self-center px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white border border-white/10 hover:border-white/10 rounded-xl bg-white/[0.04] hover:bg-white/[0.04] transition-all duration-200 select-none disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh data</span>
                </button>
              </div>

              {/* Overview metric cards showing defaults */}
              <MetricCards 
                averageFocus={0}
                averageCognitiveLoad={0}
                averageProductivity={0}
                totalFocusMinutes={0}
                averageFatigueScore={0}
              />

              {/* Empty state glass card */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center select-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />
                
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4">
                  <Sparkles className="h-6 w-6 text-cyan-400 animate-pulse" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">No Cognitive Data Yet</h3>
                <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                  Start a live monitoring session to generate your first cognitive analytics.
                </p>
                
                <button 
                  onClick={() => setActiveItem('Live Monitoring')}
                  className="glow-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02]"
                >
                  <span>Go to Live Monitoring</span>
                  <Activity className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
              <div>
                <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white select-none">
                  Welcome back, {profile.displayName}
                </h2>
                <p className="text-sm font-semibold text-zinc-400 mt-1">
                  Here is your cognitive performance overview.
                </p>
              </div>
              <button 
                onClick={fetchAnalytics}
                disabled={isLoading}
                className="flex items-center gap-2 self-start sm:self-center px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white border border-white/10 hover:border-white/10 rounded-xl bg-white/[0.04] hover:bg-white/[0.04] transition-all duration-200 select-none disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh data</span>
              </button>
            </div>

            {/* 2. Overview metric cards */}
            <MetricCards 
              averageFocus={analytics?.average_focus}
              averageCognitiveLoad={analytics?.average_cognitive_load}
              averageProductivity={analytics?.average_productivity}
              totalFocusMinutes={analytics?.total_focus_minutes}
              averageFatigueScore={analytics?.average_fatigue_score}
            />

            {/* 3. Primary row: Attention vs load & coach insights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              <div className="lg:col-span-8 w-full">
                <AttentionLoadChart data={analytics?.focus_trend} />
              </div>
              <div className="lg:col-span-4 w-full">
                <InsightsPanel insights={derivedInsights} isLoading={isLoading} />
              </div>
            </div>

            {/* 4. Secondary row: Focus vs productivity & realtime timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              <div className="lg:col-span-6 w-full">
                <FocusProductivityChart data={analytics?.productivity_trend} />
              </div>
              <div className="lg:col-span-6 w-full">
                <RealtimeLoadChart />
              </div>
            </div>

            {/* 5. Tertiary row: Recent sessions history table */}
            <SessionsTable sessions={analytics?.recent_sessions} />

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
              <p className="text-sm font-semibold text-zinc-400 mt-1">Real-time telemetry stream from your local browser agent.</p>
            </div>

            {/* Interactive glass preview container */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4">
                <Activity className="h-6 w-6 text-cyan-400 animate-pulse" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Live Session Active</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
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
              <p className="text-sm font-semibold text-zinc-400 mt-1">Deep analysis and burnout risk profiling powered by local inference.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/2 via-cyan-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/35 shadow-[0_0_15px_rgba(139,92,246,0.2)] mb-4">
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Extended Analytics</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
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
              <p className="text-sm font-semibold text-zinc-400 mt-1">Browse, filter and export your historical cognitive load metrics.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.2)] mb-4">
                <Clock className="h-6 w-6 text-indigo-450" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Session Archives</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
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
              <p className="text-sm font-semibold text-zinc-400 mt-1">Sync your Chrome Extension to aggregate browser signals privately.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/35 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4">
                <Globe className="h-6 w-6 text-cyan-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Chrome Sync</h3>
              <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
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
              <p className="text-sm font-semibold text-zinc-400 mt-1">Configure profile metrics, on-device AI sensors, and data export.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/2 to-transparent pointer-events-none" />
              
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/35 shadow-[0_0_15px_rgba(139,92,246,0.2)] mb-4">
                <Settings className="h-6 w-6 text-violet-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Preference Portal</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
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
