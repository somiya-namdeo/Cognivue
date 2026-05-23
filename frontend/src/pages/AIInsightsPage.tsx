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
  getLocalSession, 
  type AdvancedAIInsightsResponse, 
  type AIInsightCard 
} from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
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
      const data = await getAIInsights(userId);
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
              <div key={idx} className="rounded-2xl border border-white/5 bg-slate-950/20 p-5">
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

  const isCalibrationPending = insightsData && 
    insightsData.scores.focus_consistency === 0 && 
    insightsData.scores.burnout_risk === 0;

  if (isCalibrationPending || !insightsData) {
    return (
      <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center select-none p-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.015] backdrop-blur-md max-w-2xl mx-auto my-12">
          <Sparkles className="h-16 w-16 text-cyan-400 animate-bounce mb-6" />
          <h3 className="text-[26px] font-semibold text-white tracking-tight leading-tight mb-3">AI Calibration Pending</h3>
          <p className="text-[15px] leading-[1.6] text-white/70 font-normal antialiased max-w-md mb-6">
            Complete more focus sessions to unlock advanced cognitive intelligence insights.
          </p>
          <button 
            onClick={fetchInsights}
            className="mt-8 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-6 py-3 text-[13px] font-semibold text-cyan-400 transition-all duration-300"
          >
            Check Again
          </button>
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

  const fallbackWeekly = [
   { day:"Mon", focus:60, fatigue:20, productivity:55, duration:45 },
   { day:"Tue", focus:62, fatigue:22, productivity:58, duration:50 },
   { day:"Wed", focus:80, fatigue:15, productivity:76, duration:120 },
   { day:"Thu", focus:84, fatigue:14, productivity:79, duration:140 },
   { day:"Fri", focus:61, fatigue:20, productivity:56, duration:60 },
   { day:"Sat", focus:60, fatigue:20, productivity:55, duration:45 },
   { day:"Sun", focus:60, fatigue:20, productivity:55, duration:45 }
  ];

  const finalWeeklyTrends = (insightsData.weekly_trends && insightsData.weekly_trends.length >= 7)
    ? insightsData.weekly_trends
    : fallbackWeekly;

  // Debug fallback as requested
  console.log("weekly_trends from API:", insightsData.weekly_trends);
  console.log("weekly_trends being rendered:", finalWeeklyTrends);

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

        {/* ================= 1. COGNITIVE SUMMARY CARDS ================= */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-5 gap-5 mt-2">
          {cognitiveScores.map((score, sIdx) => (
            <div key={sIdx} className="rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md select-none text-left flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              <div>
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/45 block">{score.name}</span>
                <span className="text-[32px] font-extrabold tracking-tight text-white mt-1 block leading-none antialiased">{score.value}%</span>
              </div>
              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-white/[0.03] overflow-hidden relative">
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
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col justify-between select-none relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
              <div className="mb-6 relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Session Analytics</span>
                  <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Focus Drift Analysis</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              
              <div className="w-full h-[260px] min-h-[260px] flex-1 flex flex-col justify-center">
                {insightsData.focus_drift_timeline && insightsData.focus_drift_timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insightsData.focus_drift_timeline} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDistraction" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="focus" name="Focus Level" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorFocus)" />
                      <Area type="monotone" dataKey="distraction" name="Distraction Spikes" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDistraction)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full bg-white/[0.02] rounded-xl border border-white/5 p-6 text-center">
                    <Activity className="h-8 w-8 text-cyan-500/50 mb-3" />
                    <span className="text-[13px] font-semibold text-white/70">Insufficient timeline data available to map focus drift.</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4 w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col justify-between shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
              <div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-400 font-semibold mb-2 block">Cognitive Summary</span>
                <p className="text-[15px] leading-[1.7] text-white/80 font-normal antialiased">
                  {insightsData.summary}
                </p>
              </div>
              <div className="mt-8 border-t border-white/5 pt-6 grid grid-cols-2 gap-4">
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
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col">
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
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="domain" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Radar name="Productivity" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full bg-white/[0.02] rounded-xl border border-white/5 p-6 text-center">
                    <Target className="h-8 w-8 text-violet-500/50 mb-3" />
                    <span className="text-[13px] font-semibold text-white/70 mb-4">Insufficient data for Radar Analysis. Tracking mode active:</span>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Strongest Mode</span>
                        <span className="text-sm font-bold text-violet-400">{insightsData.patterns.best_time_window}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Context Switching</span>
                        <span className="text-sm font-bold text-amber-400">{Math.round((100 - insightsData.patterns.attention_stability) * 10) / 10}% Risk</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Deep Work Quality</span>
                        <span className="text-sm font-bold text-cyan-400">{Math.round(insightsData.patterns.deep_work_ratio * 100)}% Ratio</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Best Domain</span>
                        <span className="text-sm font-bold text-white">General Focus</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Fatigue Intelligence */}
          <motion.div variants={itemVariants} className="w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col">
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
                  <div className="flex flex-col items-center justify-center h-full w-full bg-white/[0.02] rounded-xl border border-white/5 p-6 text-center">
                    <Coffee className="h-8 w-8 text-amber-500/50 mb-3" />
                    <span className="text-[13px] font-semibold text-white/70 mb-4">Insufficient data for correlation graph. Current tracking status:</span>
                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Fatigue Score</span>
                        <span className="text-sm font-bold text-rose-400">{insightsData.scores.burnout_risk > 50 ? 'Elevated' : 'Nominal'}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Fatigue Risk Label</span>
                        <span className="text-sm font-bold text-amber-400">{insightsData.scores.burnout_risk}% Burnout Risk</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Blink Rate Trend</span>
                        <span className="text-sm font-bold text-cyan-400">Stable</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-left">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Recovery Suggestion</span>
                        <span className="text-sm font-bold text-emerald-400">Maintain 20-20-20 rule</span>
                      </div>
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
            <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Smart Recommendations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insightsData.insights.slice(0, 6).map((rec: AIInsightCard, idx: number) => {
              const Icon = categoryIcons[rec.category] || BookOpen;
              const styles = getSeverityStyles(rec.severity);

              return (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="group relative rounded-2xl border border-white/5 bg-slate-950/20 p-6 backdrop-blur-md flex flex-col justify-between hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300 select-none text-left min-h-[190px]"
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
                        <span className="text-[11px] text-white/40 font-mono">
                          {Math.round(rec.confidence * 100)}% conf
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
          <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">7-Day Aggregation</span>
                <h3 className="text-[26px] font-semibold tracking-tight text-white antialiased">Weekly Cognitive Trends</h3>
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
