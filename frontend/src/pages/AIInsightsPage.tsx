import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { 
  Sparkles, 
  Clock, 
  Activity, 
  TrendingUp, 
  BookOpen, 
  Coffee, 
  AlertTriangle,
  Plus
} from 'lucide-react';

// ==========================================
// CONFIGURATION & STRUCTURE
// ==========================================
interface Recommendation {
  title: string;
  recommendation: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

interface DistractionItem {
  domain: string;
  category: string;
  percentage: number;
  width: string;
  gradient: string;
}

interface CoachingRow {
  day: string;
  recommendation: string;
}

export const AIInsightsPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('AI Insights');

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

  // 1. Smart Recommendations List (6 items representing screenshots)
  const recommendations: Recommendation[] = [
    {
      title: 'Spaced repetition on attention mechanisms',
      recommendation: 'Schedule 3 short reviews over the next 5 days to consolidate today\'s material.',
      icon: BookOpen,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Anchor focus blocks 9–11am',
      recommendation: 'Your attention curve peaks early — protect this window from meetings.',
      icon: Clock,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20'
    },
    {
      title: 'Insert micro-breaks every 45m',
      recommendation: 'Posture drift increases after 48m. A 2 min stretch lifts focus by ~9%.',
      icon: Coffee,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Cap evening sessions at 60m',
      recommendation: 'Cognitive load rises sharply after 21:00. Shorter, lighter tasks recommended.',
      icon: Clock,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Switch reading to mornings',
      recommendation: 'Comprehension scores are 22% higher before noon based on session history.',
      icon: Activity,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      title: 'Progressive load training',
      recommendation: 'Gradually extend deep work blocks by 5m / week to grow capacity.',
      icon: TrendingUp,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    }
  ];

  // 2. Distraction Bar Telemetry Data
  const distractions: DistractionItem[] = [
    { domain: 'youtube.com', category: 'Entertainment', percentage: 38, width: 'w-[38%]', gradient: 'from-cyan-400 to-blue-500' },
    { domain: 'twitter.com', category: 'Social', percentage: 24, width: 'w-[24%]', gradient: 'from-cyan-400 to-indigo-500' },
    { domain: 'slack.com', category: 'Comms', percentage: 18, width: 'w-[18%]', gradient: 'from-cyan-400 to-indigo-500' },
    { domain: 'news.ycombinator.com', category: 'Reading', percentage: 12, width: 'w-[12%]', gradient: 'from-cyan-400 to-indigo-500' },
    { domain: 'mail.google.com', category: 'Email', percentage: 8, width: 'w-[8%]', gradient: 'from-cyan-400 to-indigo-500' },
  ];

  // 3. Weekly Coaching Steps
  const coachingPlan: CoachingRow[] = [
    { day: 'Mon', recommendation: 'Block social during 9–11am' },
    { day: 'Tue', recommendation: '30m morning paper-reading sprint' },
    { day: 'Wed', recommendation: 'Posture calibration midday' },
    { day: 'Thu', recommendation: 'Add 5m walking break after lunch' },
    { day: 'Fri', recommendation: 'Wind-down ritual at 21:30' }
  ];

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-10 sm:gap-12 text-left"
      >
        {/* ================= TOP HEADER BLOCK ================= */}
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
            AI Insights
          </h2>
          <p className="text-[15px] leading-[1.6] text-white/70 font-medium mt-2 antialiased">
            Generative summaries, patterns and personalised plans from your cognitive data.
          </p>
        </div>

        {/* ================= SECTION 1: SESSION SUMMARY & RECOVERY ================= */}
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
                    NLP session summary · generated 2m ago
                  </span>
                </div>

                {/* Main Session Title */}
                <h3 className="text-[32px] md:text-[36px] font-semibold tracking-tight leading-tight mb-4 text-white relative z-10 antialiased">
                  Today's deep-work session
                </h3>

                {/* Paragraph Content */}
                <p className="text-[15px] leading-[1.7] text-white/70 font-normal antialiased tracking-normal relative z-10">
                  You sustained <span className="text-white font-medium">42 minutes of high attention</span> while reviewing transformer architectures, with cognitive load remaining in the <span className="text-cyan-400 font-medium">optimal challenge zone</span>. A brief dip at 10:14 correlated with a context switch to email. Your posture stayed upright for 88% of the session and blink rate indicated <span className="text-emerald-450 font-medium">low fatigue</span>. Overall a strong, focused session — comparable to your top 10% historical days.
                </p>
              </div>

              {/* Bottom Mini Indicators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8 pt-6 border-t border-white/[0.04] relative z-10">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-left">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Theme</span>
                  <span className="text-[22px] font-bold tracking-tight text-white mt-1 block leading-none antialiased">Transformers</span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-left">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Quality</span>
                  <span className="text-[22px] font-bold tracking-tight text-white mt-1 block leading-none antialiased">Top 10%</span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 text-left">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Energy Used</span>
                  <span className="text-[22px] font-bold tracking-tight text-white mt-1 block leading-none antialiased">Moderate</span>
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
                      strokeDashoffset={251.2 * (1 - 0.14)}
                      strokeLinecap="round"
                      className="shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                    />
                  </svg>
                  {/* Inside metrics labels */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[28px] font-bold text-white tracking-tight leading-none antialiased">14%</span>
                    <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-[0.12em] leading-none mt-1.5">Low risk</span>
                  </div>
                </div>
              </div>

              <p className="text-[14px] leading-[1.6] text-white/60 font-normal mt-4 antialiased">
                Sleep, breaks and load are well balanced. Keep current cadence.
              </p>
            </div>
          </div>

        </div>

        {/* ================= SECTION 2: SMART RECOMMENDATIONS ================= */}
        <div className="w-full flex flex-col gap-6 mt-4">
          <div className="text-left">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Core patterns</span>
            <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Smart recommendations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec, idx) => {
              const Icon = rec.icon;

              return (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="group relative rounded-2xl border border-white/5 bg-slate-950/20 p-6 backdrop-blur-md flex flex-col justify-between hover:scale-[1.01] hover:bg-slate-950/30 transition-all duration-300 select-none text-left min-h-[190px]"
                >
                  <div className="flex flex-col gap-5">
                    {/* Balanced Icon Container */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${rec.iconBg}`}>
                      <Icon className={`h-5 w-5 ${rec.iconColor}`} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[18px] font-semibold tracking-tight text-white group-hover:text-cyan-400 transition-colors antialiased">
                        {rec.title}
                      </h4>
                      <p className="text-[14px] leading-[1.6] text-white/60 font-normal mt-2.5 antialiased">
                        {rec.recommendation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ================= SECTION 3: LEAKS AND COACHING TIMELINES ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-stretch">
          
          {/* Left Column: Distraction Leak analytics */}
          <div className="lg:col-span-6 w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col select-none relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              
              <div className="mb-6">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Distraction patterns</span>
                <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Where attention leaks</h3>
              </div>

              {/* Progress list rows */}
              <div className="flex-1 flex flex-col justify-between gap-6">
                {distractions.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-2 w-full">
                    {/* Header metrics */}
                    <div className="flex items-center justify-between text-[14px] font-semibold">
                      <span className="text-[15px] text-white/85 font-medium antialiased">{item.domain}</span>
                      <span className="text-[13px] text-white/45 font-normal antialiased">
                        {item.category} · <span className="text-white/80 font-semibold">{item.percentage}%</span>
                      </span>
                    </div>

                    {/* Faint bar track */}
                    <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${item.gradient} relative transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right Column: Weekly coaching blocks */}
          <div className="lg:col-span-6 w-full flex">
            <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-8 backdrop-blur-md flex flex-col select-none relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
              
              <div className="mb-6">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Improvement plan · this week</span>
                <h3 className="text-[26px] font-semibold tracking-tight text-zinc-100 mt-1 antialiased">Adaptive coaching</h3>
              </div>

              {/* Weekly checklist rows */}
              <div className="flex-1 flex flex-col gap-4">
                {coachingPlan.map((plan, idx) => (
                  <div 
                    key={idx}
                    className="group flex items-center gap-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-[18px] py-[14px] hover:bg-white/[0.03] transition-all duration-300 text-left"
                  >
                    {/* Circular numbered indicator */}
                    <div className="h-9 w-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[12px] font-bold text-cyan-300 shrink-0">
                      {idx + 1}
                    </div>

                    <div className="flex flex-col justify-center">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-0.5">{plan.day}</span>
                      <span className="text-[15px] font-medium text-white/85 antialiased group-hover:text-cyan-400 transition-colors mt-0.5">
                        {plan.recommendation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* ================= SECTION 5: ANOMALY ALERT BANNER ================= */}
        <div className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/[0.015] p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5 select-none hover:bg-amber-500/[0.025] transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)] mt-4">
          
          <div className="flex items-center gap-6 text-left w-full sm:w-auto">
            {/* Alert icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.18em] text-amber-450 font-bold block mb-0.5">
                Anomaly detected
              </span>
              <span className="text-[15px] font-medium text-white/85 antialiased leading-normal">
                Sleep variance is up 18% — consider locking a bedtime for the next 5 days.
              </span>
            </div>
          </div>

          {/* Add to plan action button */}
          <button className="rounded-xl border border-white/10 hover:border-white/20 px-5 py-3 text-[13px] font-semibold text-white hover:bg-white/[0.04] flex items-center gap-2 transition-all duration-300 shrink-0 w-full sm:w-auto justify-center">
            <Plus className="h-4.5 w-4.5" />
            <span>Add to plan</span>
          </button>

        </div>

      </motion.div>
    </DashboardLayout>
  );
};
