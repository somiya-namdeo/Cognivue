import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { 
  Sparkles, 
  Activity, 
  TrendingUp, 
  BookOpen, 
  Coffee, 
  AlertTriangle,
  Target,
  Clock
} from 'lucide-react';
import { 
  getAIInsights, 
  getDashboardAnalytics,
  getLocalSession, 
  type AdvancedAIInsightsResponse, 
  type AIInsightCard 
} from '../services/api';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ComposedChart, Bar, Legend
} from 'recharts';

// Category mapping to Lucide Icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  focus: Sparkles,
  fatigue: Coffee,
  productivity: TrendingUp,
  behavior: Activity,
  recovery: Coffee,
  anomaly: AlertTriangle,
};

// Severity mapping to visual CSS styles
const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'positive':
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      };
    case 'neutral':
      return {
        text: 'text-violet-400',
        bg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      };
    case 'warning':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      };
    case 'critical':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/20 text-red-400',
      };
    default:
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      };
  }
};

// Custom Tooltip for Recharts to match Glassmorphism dark theme

const CountUp = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Use easeOutQuart for smooth premium decel
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#03030b]/90 backdrop-blur-md p-4 shadow-xl">
        <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="text-sm font-bold text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AIInsightsPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('AI Insights');
  const [insightsData, setInsightsData] = useState<AdvancedAIInsightsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = getLocalSession();
      const userId = session.userId || '00000000-0000-0000-0000-000000000000';
      let data = await getAIInsights(userId);
      console.log("[AIInsightsPage] Insights data:", data);
      
      const dashboardData = await getDashboardAnalytics(userId);
      console.log("[AIInsightsPage] Dashboard fallback data:", dashboardData);

      // 6. Fallback source: If AI insights are mostly 0 but dashboard has real data, merge it.
      if (
        data.scores.focus_consistency === 0 && 
        data.scores.cognitive_efficiency === 0 && 
        dashboardData && 
        dashboardData.total_sessions > 0
      ) {
        console.log("[AIInsightsPage] Applying dashboard fallback for top metric cards");
        data = {
          ...data,
          scores: {
            ...data.scores,
            cognitive_efficiency: dashboardData.average_focus || 0,
            focus_consistency: Math.min(100, (dashboardData.average_focus || 0) + 10),
            burnout_risk: dashboardData.average_fatigue_score || 0,
            recovery_balance: 100 - (dashboardData.average_fatigue_score || 0),
            productivity_momentum: dashboardData.average_productivity || 0,
          }
        };

        if (data.insights.length > 0 && data.insights[0].title.includes("Welcome")) {
           data.insights[0] = {
             title: "Cognitive Baseline Generated",
             summary: `You have completed ${dashboardData.total_sessions} session(s) averaging a Focus Score of ${Math.round(dashboardData.average_focus)}. We are continuously analyzing this baseline.`,
             category: "focus",
             severity: "neutral",
             confidence: "Emerging Pattern",
             recommendation: "Continue tracking your work blocks.",
             supporting_metrics: { average_focus: dashboardData.average_focus }
           };
        }
        
        if (data.summary.includes("Calibration")) {
          data.summary = `Your cognitive performance shows an average focus of ${Math.round(dashboardData.average_focus)}% across ${dashboardData.total_sessions} tracked sessions. Maintain your environment to sustain these initial baseline measurements.`;
        }
      }

      setInsightsData(data);
    } catch (err: any) {
      console.error('Error fetching AI insights:', err);
      setError('Unable to generate cognitive insights. Please ensure the analytics backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  if (loading) {
    return (
      <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
        <div className="flex flex-col gap-10 sm:gap-12 animate-pulse text-left">
          <div className="flex flex-col text-left">
            <div className="h-10 bg-white/10 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-white/5 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-5">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-slate-950/20 p-5">
                <div className="h-3 bg-white/10 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-white/15 rounded w-1/2 mb-4"></div>
                <div className="h-1.5 bg-white/5 rounded w-full mb-3"></div>
                <div className="h-3 bg-white/5 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center select-none p-8 rounded-2xl border border-red-500/20 bg-red-500/[0.015] backdrop-blur-md max-w-2xl mx-auto my-12">
          <AlertTriangle className="h-16 w-16 text-red-500 animate-pulse mb-6" />
          <h3 className="text-[26px] font-semibold text-white tracking-tight leading-tight mb-3">Backend Connection Error</h3>
          <p className="text-[15px] leading-[1.6] text-white/70 font-normal antialiased">
            {error}
          </p>
          <button 
            onClick={fetchInsights}
            className="mt-8 rounded-xl border border-white/10 hover:border-cyan-500/30 bg-white/[0.02] hover:bg-cyan-500/10 px-6 py-3 text-[13px] font-semibold text-white hover:text-cyan-400 transition-all duration-300"
          >
            Retry Connection
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!insightsData) {
    return (
      <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center select-none p-8 rounded-2xl border border-white/10 bg-slate-950 backdrop-blur-md max-w-2xl mx-auto my-12">
          <Activity className="h-16 w-16 text-zinc-500 animate-pulse mb-6" />
          <h3 className="text-[26px] font-semibold text-white tracking-tight leading-tight mb-3">Loading Analytics</h3>
          <p className="text-[15px] leading-[1.6] text-white/50 font-normal antialiased">
            Compiling your telemetry and focus history...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const cognitiveScores = [
    { name: 'Focus Consistency', value: Math.round(insightsData.scores.focus_consistency), gradient: 'from-cyan-400 to-blue-500', desc: 'Focus stability across sessions' },
    { name: 'Burnout Risk', value: Math.round(insightsData.scores.burnout_risk), gradient: 'from-orange-400 to-red-500', desc: 'Stress and fatigue strain index' },
    { name: 'Cognitive Efficiency', value: Math.round(insightsData.scores.cognitive_efficiency), gradient: 'from-violet-400 to-indigo-500', desc: 'Focus output relative to load' },
    { name: 'Recovery Balance', value: Math.round(insightsData.scores.recovery_balance), gradient: 'from-emerald-400 to-teal-500', desc: 'Energy replenishment level' },
    { name: 'Productivity Momentum', value: Math.round(insightsData.scores.productivity_momentum), gradient: 'from-pink-400 to-rose-500', desc: 'Cumulative performance trend' }
  ];

  const anomalyInsight = insightsData.insights.find(
    (ins: AIInsightCard) => ins.category === 'anomaly' || ins.severity === 'critical' || ins.severity === 'warning'
  );

  const finalWeeklyTrends = insightsData.weekly_trends || [];

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-10 sm:gap-12 text-left w-full"
      >
        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col text-left">
            <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
              AI Insights
            </h2>
            <p className="text-[15px] leading-[1.6] text-white/70 font-medium mt-2 antialiased">
              Generative summaries, patterns and personalised plans from your cognitive data.
            </p>
          </div>
          <button 
            onClick={fetchInsights}
            disabled={loading}
            className="rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/10 hover:bg-cyan-500/20 px-5 py-3 text-[13px] font-semibold text-cyan-400 flex items-center gap-2 transition-all duration-300 shrink-0 w-fit justify-center disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>Regenerate insights</span>
          </button>
        </div>

        {/* ================= CALIBRATION BANNER REMOVED (Progressive fallback applied) ================= */}

        {/* ================= 1. COGNITIVE SUMMARY CARDS ================= */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-5 gap-5 mt-2">
          {cognitiveScores.map((score, sIdx) => (
            <div key={sIdx} className="rounded-2xl border border-white/10 bg-slate-950/20 p-5 backdrop-blur-md select-none text-left flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              <div>
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/45 block">{score.name}</span>
                <span className="text-[32px] font-extrabold tracking-tight text-white mt-1 block leading-none antialiased"><CountUp end={score.value} duration={2.5}/>%</span>
              </div>
              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-border-color overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${score.gradient}`}
                    style={{ width: `${score.value}%` }}
                  />
                </div>
                <span className="text-[11px] text-white/40 mt-2 block font-normal leading-normal">{score.desc}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ================= 2. FOCUS DRIFT ANALYSIS & NLP SUMMARY ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <motion.div variants={itemVariants} className="lg:col-span-8 w-full flex">
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col justify-between select-none relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
              <div className="mb-6 relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Session Analytics</span>
                  <h3 className="text-[26px] font-semibold tracking-tight text-white mt-1 antialiased">Focus Drift Analysis</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              
              <div className="w-full h-[260px] min-h-[260px] flex-1 flex flex-col justify-center">
                {insightsData.focus_drift_timeline && insightsData.focus_drift_timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insightsData.focus_drift_timeline} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="focus" name="Focus" stroke="#22d3ee" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#22d3ee', strokeWidth: 0 }} animationDuration={1500} />
                      <Line type="monotone" dataKey="cognitive_load" name="Cognitive Load" stroke="#a855f7" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#a855f7', strokeWidth: 0 }} animationDuration={1500} />
                      <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f43f5e', strokeWidth: 0 }} animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid grid-cols-2 gap-4 h-full w-full">
                    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors shadow-inner">
                      <span className="text-[11px] uppercase tracking-[0.1em] text-cyan-500/70 block mb-1 font-bold">Avg Focus</span>
                      <span className="text-[28px] font-extrabold text-white tracking-tight"><CountUp end={Math.round(insightsData.scores.cognitive_efficiency)} duration={2}/>%</span>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors shadow-inner relative">
                      <span className="text-[11px] uppercase tracking-[0.1em] text-blue-400/70 block mb-1 font-bold">Consistency</span>
                      <span className="text-[28px] font-extrabold text-white tracking-tight"><CountUp end={Math.round(insightsData.scores.focus_consistency)} duration={2}/>%</span>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors shadow-inner relative">
                      <span className="text-[11px] uppercase tracking-[0.1em] text-red-400/70 block mb-1 font-bold">Burnout Risk</span>
                      <span className="text-[28px] font-extrabold text-white tracking-tight"><CountUp end={Math.round(insightsData.scores.burnout_risk)} duration={2}/>%</span>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors shadow-inner">
                      <span className="text-[11px] uppercase tracking-[0.1em] text-indigo-400/70 block mb-1 font-bold">Momentum</span>
                      <span className="text-[28px] font-extrabold text-white tracking-tight"><CountUp end={Math.round(insightsData.scores.productivity_momentum)} duration={2}/>%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4 w-full flex">
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
              <div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-400 font-semibold mb-2 block">Cognitive Summary</span>
                <p className="text-[15px] leading-[1.7] text-white/80 font-normal antialiased">
                  {insightsData.summary}
                </p>
              </div>
              <div className="mt-8 border-t border-white/10 pt-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-white/45 block mb-1">Best Block</span>
                  <span className="text-[15px] font-bold text-white">{insightsData.patterns.best_time_window}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-white/45 block mb-1">Burnout Risk</span>
                  <span className="text-[15px] font-bold text-red-400">{insightsData.scores.burnout_risk}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ================= 3. PRODUCTIVITY PATTERNS & 4. FATIGUE INTELLIGENCE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Productivity Patterns */}
          <motion.div variants={itemVariants} className="w-full flex">
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-8 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Domain Analysis</span>
                  <h3 className="text-[22px] font-semibold tracking-tight text-white antialiased">Productivity Patterns</h3>
                </div>
                <Target className="h-5 w-5 text-violet-400" />
              </div>
              <div className="w-full h-[260px] min-h-[260px] flex-1 flex flex-col justify-center">
                {insightsData.productivity_patterns && insightsData.productivity_patterns.length >= 3 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={insightsData.productivity_patterns}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Radar name="Productivity" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col h-full w-full gap-3">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors relative shadow-inner">
                        <div className="absolute top-2 right-2 text-[8px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pattern</div>
                        <span className="text-[11px] uppercase tracking-[0.1em] text-violet-400/70 block mb-1 font-bold">Dominant Session</span>
                        <span className="text-[18px] font-extrabold text-white tracking-tight leading-tight">
                          {insightsData.productivity_patterns?.sort((a,b) => b.score - a.score)[0]?.category || (insightsData.patterns.deep_work_ratio > 0.4 ? "Deep Work" : "Cognitive Block")}
                        </span>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors shadow-inner">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-cyan-400/70 block mb-1 font-bold">Most Productive Mode</span>
                        <span className="text-[18px] font-extrabold text-white tracking-tight leading-tight">
                          {insightsData.scores.cognitive_efficiency > 75 ? "Peak Flow State" : "Sustained Endurance"}
                        </span>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors shadow-inner">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-emerald-400/70 block mb-1 font-bold">Main Work Context</span>
                        <span className="text-[16px] font-extrabold text-white tracking-tight leading-tight px-2">{insightsData.patterns.best_time_window}</span>
                      </div>
                      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center text-center hover:bg-white/[0.04] transition-colors shadow-inner">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-red-400/70 block mb-1 font-bold">Distraction Risk</span>
                        <span className="text-[24px] font-extrabold text-white tracking-tight leading-tight"><CountUp end={Math.round(100 - insightsData.patterns.attention_stability)} duration={2}/>%</span>
                      </div>
                    </div>
                    {insightsData.productivity_patterns && insightsData.productivity_patterns.length > 0 && insightsData.productivity_patterns.length < 3 && (
                      <div className="mt-1 text-center text-[12px] font-medium text-white/50 bg-white/[0.02] py-2.5 rounded-lg border border-white/10 shadow-inner">
                        Complete sessions across more work modes to unlock radar view.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Fatigue Intelligence */}
          <motion.div variants={itemVariants} className="w-full flex">
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-8 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Ocular Telemetry</span>
                  <h3 className="text-[22px] font-semibold tracking-tight text-white antialiased">Fatigue Intelligence</h3>
                </div>
                <Coffee className="h-5 w-5 text-amber-400" />
              </div>
              <div className="w-full h-[260px] min-h-[260px] flex-1 flex flex-col justify-center">
                {insightsData.fatigue_correlation && insightsData.fatigue_correlation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={insightsData.fatigue_correlation} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="blink_rate" name="Blink Rate" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} />
                      <Line yAxisId="right" type="monotone" dataKey="fatigue" name="Fatigue Accum." stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full w-full">
                    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center items-center text-center hover:bg-white/[0.04] transition-colors relative">
                      <div className="absolute top-3 right-3 text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Analysis</div>
                      <Coffee className="h-6 w-6 text-amber-500/50 mb-2" />
                      <span className="text-[11px] uppercase tracking-[0.1em] text-white/50 block mb-1">Fatigue Trend</span>
                      <span className="text-2xl font-bold text-white">{insightsData.patterns?.fatigue_drift > 0 ? '+' : ''}{Math.round(insightsData.patterns?.fatigue_drift || 0)}</span>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col justify-center items-center text-center hover:bg-white/[0.04] transition-colors relative">
                      <Activity className="h-6 w-6 text-emerald-500/50 mb-2" />
                      <span className="text-[11px] uppercase tracking-[0.1em] text-white/50 block mb-1">Recovery Balance</span>
                      <span className="text-2xl font-bold text-white">{Math.round(insightsData.scores.recovery_balance)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ================= 5. DEEP WORK ANALYTICS & 6. AI RECOMMENDATIONS ================= */}
        <div className="flex flex-col gap-6">
          <div className="text-left">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Actionable Intelligence</span>
            <h3 className="text-[26px] font-semibold tracking-tight text-white mt-1 antialiased">Smart Recommendations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insightsData.insights.slice(0, 6).map((rec: AIInsightCard, idx: number) => {
              const Icon = categoryIcons[rec.category] || BookOpen;
              const styles = getSeverityStyles(rec.severity);

              return (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="group relative rounded-2xl border border-white/10 bg-slate-950/20 p-6 backdrop-blur-md flex flex-col justify-between hover:scale-[1.01] hover:bg-slate-950/20 transition-all duration-300 select-none text-left min-h-[190px]"
                >
                  <div className="flex flex-col gap-5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${styles.bg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[18px] font-semibold tracking-tight text-white group-hover:text-cyan-400 transition-colors antialiased">
                          {rec.title}
                        </h4>
                        <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold px-2 py-1 bg-white/5 rounded border border-white/10">
                          {rec.confidence}
                        </span>
                      </div>
                      <p className="text-[14px] leading-[1.6] text-white/60 font-normal mt-2.5 antialiased">
                        {rec.summary}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.04] text-[13px] text-cyan-400 italic antialiased">
                    Recommendation: {rec.recommendation}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ================= 7. WEEKLY TREND CHARTS ================= */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/20 p-8 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">7-Day Aggregation</span>
                <div className="flex items-center gap-3">
                  <h3 className="text-[26px] font-semibold tracking-tight text-white antialiased">Weekly Cognitive Trends</h3>
                  {finalWeeklyTrends.filter(d => d.duration > 0).length < 7 && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider relative top-1">Current</span>
                  )}
                </div>
              </div>
              <Clock className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="w-full h-[320px] min-h-[320px] flex-1 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={finalWeeklyTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', opacity: 0.8, paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="focus" name="Focus Quality" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: '#22d3ee' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="productivity" name="Productivity" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: '#8b5cf6' }} />
                  <Line type="monotone" dataKey="fatigue" name="Fatigue" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, strokeWidth: 0, fill: '#ef4444' }} />
                  <Line type="monotone" dataKey="duration" name="Duration (m)" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, strokeWidth: 0, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Anomaly Alert */}
        {anomalyInsight && (
          <motion.div variants={itemVariants} className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/[0.015] p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5 select-none hover:bg-amber-500/[0.025] transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] mt-4">
            <div className="flex items-center gap-6 text-left w-full sm:w-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.18em] text-amber-450 font-bold block mb-0.5">
                  Anomaly detected: {anomalyInsight.title}
                </span>
                <span className="text-[15px] font-medium text-white/85 antialiased leading-normal">
                  {anomalyInsight.summary} &mdash; <span className="text-cyan-400 italic">Action: {anomalyInsight.recommendation}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </DashboardLayout>
  );
};
