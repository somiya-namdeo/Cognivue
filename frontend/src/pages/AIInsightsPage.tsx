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
  Plus
} from 'lucide-react';
import { 
  getAIInsights, 
  getLocalSession, 
  type AdvancedAIInsightsResponse, 
  type AIInsightCard 
} from '../services/api';

// Category mapping to Lucide Icons
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  focus: Sparkles,
  fatigue: Coffee,
  productivity: TrendingUp,
  behavior: Activity,
  recovery: Coffee,
  anomaly: AlertTriangle,
};

// Severity mapping to visual CSS styles (as requested: positive=cyan/green, neutral=blue/violet, warning=amber, critical=red)
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

  // Stagger animate parent setup
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

  // 1. Loading Skeleton Screen (renders exact card coordinates with fluid pulse bars)
  if (loading) {
    return (
      <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
        <div className="flex flex-col gap-10 sm:gap-12 animate-pulse text-left">
          
          {/* Header block pulse */}
          <div className="flex flex-col text-left">
            <div className="h-10 bg-white/10 rounded w-1/4 mb-3"></div>
            <div className="h-4 bg-white/5 rounded w-1/2"></div>
          </div>

          {/* 5 Scores Grid Pulse */}
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

          {/* NLP block and Circular Gauge Pulse */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
            <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-slate-950/20 p-8 h-80">
              <div className="h-3 bg-white/10 rounded w-1/4 mb-6"></div>
              <div className="h-8 bg-white/15 rounded w-1/2 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-white/5 rounded w-full"></div>
                <div className="h-4 bg-white/5 rounded w-11/12"></div>
                <div className="h-4 bg-white/5 rounded w-4/5"></div>
              </div>
            </div>
            <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-slate-950/20 p-8 h-80 flex flex-col items-center justify-between">
              <div className="h-3 bg-white/10 rounded w-2/3 self-start mb-4"></div>
              <div className="h-28 w-28 rounded-full border-8 border-white/5 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-white/10"></div>
              </div>
              <div className="h-3 bg-white/5 rounded w-full mt-4"></div>
            </div>
          </div>

        </div>
      </DashboardLayout>
    );
  }

  // 2. Offline Error Screen
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

  // 3. Calibration / Empty State Screen (if focus consistency and burnout scores are both 0)
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left mt-6">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Step 1</span>
              <span className="text-[14px] font-semibold text-white block mt-1">Start Session</span>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Step 2</span>
              <span className="text-[14px] font-semibold text-white block mt-1">Focus & Calibrate</span>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Step 3</span>
              <span className="text-[14px] font-semibold text-white block mt-1">Unlock AI Insights</span>
            </div>
          </div>
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

  // Bind dynamic scores for Cognitive Cards
  const cognitiveScores = [
    { name: 'Focus Consistency', value: Math.round(insightsData.scores.focus_consistency), gradient: 'from-cyan-400 to-blue-500', desc: 'Focus stability across sessions' },
    { name: 'Burnout Risk', value: Math.round(insightsData.scores.burnout_risk), gradient: 'from-orange-400 to-red-500', desc: 'Stress and fatigue strain index' },
    { name: 'Cognitive Efficiency', value: Math.round(insightsData.scores.cognitive_efficiency), gradient: 'from-violet-400 to-indigo-500', desc: 'Focus output achieved relative to load' },
    { name: 'Recovery Balance', value: Math.round(insightsData.scores.recovery_balance), gradient: 'from-emerald-400 to-teal-500', desc: 'Energy replenishment level' },
    { name: 'Productivity Momentum', value: Math.round(insightsData.scores.productivity_momentum), gradient: 'from-pink-400 to-rose-500', desc: 'Cumulative session performance trend' }
  ];

  // Map dynamic coaching recommendations list with fallback logic
  const displayRecommendations = (insightsData.recommendations && insightsData.recommendations.length > 0)
    ? insightsData.recommendations
    : insightsData.insights.map((ins: AIInsightCard) => ins.recommendation);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Resolve anomaly to render alert banner
  const anomalyInsight = insightsData.insights.find(
    (ins: AIInsightCard) => ins.category === 'anomaly' || ins.severity === 'critical' || ins.severity === 'warning'
  );

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-10 sm:gap-12 text-left"
      >
        {/* ================= TOP HEADER BLOCK ================= */}
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

        {/* ================= DYNAMIC COGNITIVE SCORES CARD GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-5 mt-2">
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
        </div>

        {/* ================= SECTION 1: SESSION SUMMARY & RECOVERY CIRCULAR PROGRESS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-stretch">
          
          {/* Left Large Card: NLP Session Summary */}
          <div className="lg:col-span-8 w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col justify-between select-none relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              <div className="absolute inset-0 grid-background opacity-[0.015] pointer-events-none" />
              
              <div>
                {/* Header labels */}
                <div className="flex items-center gap-2.5 mb-4 relative z-10">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block leading-none">
                    NLP session summary · generated at {new Date(insightsData.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Main Session Title */}
                <h3 className="text-[32px] md:text-[36px] font-semibold tracking-tight leading-tight mb-4 text-white relative z-10 antialiased">
                  Cognitive Baseline Overview
                </h3>

                {/* Paragraph Content */}
                <p className="text-[15px] leading-[1.7] text-white/70 font-normal antialiased tracking-normal relative z-10">
                  {insightsData.summary}
                </p>
              </div>

              {/* Bottom Mini Indicators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8 pt-6 border-t border-white/[0.04] relative z-10">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-left">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Focus Peak window</span>
                  <span className="text-[15px] font-bold tracking-tight text-white mt-1 block leading-tight antialiased truncate">{insightsData.patterns.best_time_window}</span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-left">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Attention Stability</span>
                  <span className="text-[22px] font-bold tracking-tight text-white mt-1 block leading-none antialiased">{Math.round(insightsData.patterns.attention_stability)}%</span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-left">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Burnout risk</span>
                  <span className="text-[22px] font-bold tracking-tight text-white mt-1 block leading-none antialiased">{Math.round(insightsData.scores.burnout_risk)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Recovery balance circular progress */}
          <div className="lg:col-span-4 w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col justify-between select-none relative overflow-hidden text-center shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              
              <div>
                <div className="flex flex-col text-left mb-6">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block leading-none">Burnout risk · 7-day model</span>
                  <h3 className="text-[22px] font-semibold tracking-tight text-white mt-2 antialiased">Recovery balance</h3>
                </div>

                {/* Customized SVG circular gauge */}
                <div className="relative flex items-center justify-center my-6">
                  <svg className="w-38 h-38 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="rgba(255,255,255,0.02)" 
                      strokeWidth="8" 
                      fill="transparent" 
                    />
                    {/* Active Progress Path */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="#22d3ee" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 * (1 - (insightsData.scores.recovery_balance / 100))}
                      strokeLinecap="round"
                      className="shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                    />
                  </svg>
                  {/* Inside metrics labels */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[28px] font-bold text-white tracking-tight leading-none antialiased">{Math.round(insightsData.scores.recovery_balance)}%</span>
                    <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-[0.12em] leading-none mt-1.5">
                      {insightsData.scores.recovery_balance > 70 ? 'Optimal' : insightsData.scores.recovery_balance > 40 ? 'Moderate' : 'Low recovery'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[14px] leading-[1.6] text-white/60 font-normal mt-4 antialiased">
                {insightsData.scores.recovery_balance > 70 
                  ? 'Sleep, breaks and load are well balanced. Keep current cadence.' 
                  : 'Recovery index is low. We recommend scheduling dynamic neck stretches and shorter sessions.'}
              </p>
            </div>
          </div>

        </div>

        {/* ================= SECTION 2: DYNAMIC SMART RECOMMENDATIONS / INSIGHT CARDS ================= */}
        <div className="w-full flex flex-col gap-6 mt-4">
          <div className="text-left">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Core patterns</span>
            <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Smart recommendations</h3>
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
                    {/* Dynamic severity based icon container */}
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

        {/* ================= SECTION 3: PATTERN TELEMETRY AND DYNAMIC ADAPTIVE COACHING TIMELINES ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-stretch">
          
          {/* Left Column: Pattern analytics telemetry */}
          <div className="lg:col-span-6 w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col select-none relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              
              <div className="mb-6">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Behavior patterns</span>
                <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Cognitive Telemetry</h3>
              </div>

              {/* Progress list rows */}
              <div className="flex-1 flex flex-col justify-between gap-6">
                {/* 1. Best Focus Window */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <div className="flex items-center justify-between text-[14px] font-semibold">
                    <span className="text-[15px] text-white/85 font-medium antialiased">Best Focus Block</span>
                    <span className="text-[13px] text-cyan-400 font-semibold antialiased">
                      {insightsData.patterns.best_time_window}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden relative">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 w-full" />
                  </div>
                </div>

                {/* 2. Weakest Focus Window */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <div className="flex items-center justify-between text-[14px] font-semibold">
                    <span className="text-[15px] text-white/85 font-medium antialiased">Weakest Focus Block</span>
                    <span className="text-[13px] text-amber-400 font-semibold antialiased">
                      {insightsData.patterns.weakest_time_window}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden relative">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-450 to-orange-500 w-[65%]" />
                  </div>
                </div>

                {/* 3. Deep Work Ratio */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <div className="flex items-center justify-between text-[14px] font-semibold">
                    <span className="text-[15px] text-white/85 font-medium antialiased">Deep Work Ratio</span>
                    <span className="text-[13px] text-white/80 font-semibold antialiased">
                      {Math.round(insightsData.patterns.deep_work_ratio * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden relative">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-500" 
                      style={{ width: `${Math.round(insightsData.patterns.deep_work_ratio * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4. Attention Stability */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <div className="flex items-center justify-between text-[14px] font-semibold">
                    <span className="text-[15px] text-white/85 font-medium antialiased">Attention Stability</span>
                    <span className="text-[13px] text-white/80 font-semibold antialiased">
                      {Math.round(insightsData.patterns.attention_stability)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden relative">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-450 to-teal-500" 
                      style={{ width: `${Math.round(insightsData.patterns.attention_stability)}%` }}
                    />
                  </div>
                </div>

                {/* 5. Fatigue Drift */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <div className="flex items-center justify-between text-[14px] font-semibold">
                    <span className="text-[15px] text-white/85 font-medium antialiased">Fatigue Drift Rate</span>
                    <span className="text-[13px] text-white/80 font-semibold antialiased">
                      {(insightsData.patterns.fatigue_drift >= 0 ? '+' : '') + insightsData.patterns.fatigue_drift.toFixed(3)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${insightsData.patterns.fatigue_drift >= 0 ? 'from-red-400 to-orange-500' : 'from-emerald-400 to-cyan-400'}`} 
                      style={{ width: `${Math.min(100, Math.max(15, Math.abs(insightsData.patterns.fatigue_drift) * 800))}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Weekly coaching blocks (renders recommendations dynamically) */}
          <div className="lg:col-span-6 w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col select-none relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              
              <div className="mb-6">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Improvement plan · this week</span>
                <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Adaptive coaching</h3>
              </div>

              {/* Weekly checklist rows */}
              <div className="flex-1 flex flex-col gap-4">
                {displayRecommendations.slice(0, 5).map((rec: string, idx: number) => {
                  const day = weekDays[idx % weekDays.length];
                  return (
                    <div 
                      key={idx}
                      className="group flex items-center gap-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-[18px] py-[14px] hover:bg-white/[0.03] transition-all duration-300 text-left"
                    >
                      {/* Circular numbered indicator */}
                      <div className="h-9 w-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[12px] font-bold text-cyan-300 shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex flex-col justify-center">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-0.5">{day}</span>
                        <span className="text-[15px] font-medium text-white/85 antialiased group-hover:text-cyan-400 transition-colors mt-0.5">
                          {rec}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>

        {/* ================= SECTION 5: DYNAMIC ANOMALY ALERT BANNER ================= */}
        {anomalyInsight ? (
          <div className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/[0.015] p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5 select-none hover:bg-amber-500/[0.025] transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)] mt-4">
            <div className="flex items-center gap-6 text-left w-full sm:w-auto">
              {/* Alert icon */}
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
            
            <button 
              onClick={() => alert(`Enforcing: ${anomalyInsight.recommendation}`)}
              className="rounded-xl border border-white/10 hover:border-white/20 px-5 py-3 text-[13px] font-semibold text-white hover:bg-white/[0.04] flex items-center gap-2 transition-all duration-300 shrink-0 w-full sm:w-auto justify-center"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add to plan</span>
            </button>
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.015] p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5 select-none hover:bg-emerald-500/[0.025] transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] mt-4">
            <div className="flex items-center gap-6 text-left w-full sm:w-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 font-bold block mb-0.5">
                  System Calibration Stable
                </span>
                <span className="text-[15px] font-medium text-white/85 antialiased leading-normal">
                  Visual gaze attention and desk ergonomics are fully within nominal parameters. No active anomalies detected.
                </span>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </DashboardLayout>
  );
};
