import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  Eye, 
  Brain, 
  Activity, 
  Gauge, 
  Clock
} from 'lucide-react';

interface MetricCardsProps {
  averageFocus?: number | null;
  averageCognitiveLoad?: number | null;
  averageProductivity?: number | null;
  totalFocusMinutes?: number | null;
  averageFatigueScore?: number | null;
}

interface Metric {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  glowColor: string;
  iconBg: string;
  iconColor: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  averageFocus,
  averageCognitiveLoad,
  averageProductivity,
  totalFocusMinutes,
  averageFatigueScore
}) => {
  const getFatigueLevel = (score: number | null | undefined): string => {
    if (score === null || score === undefined || score === 0) return 'Low';
    if (score >= 71) return 'High';
    if (score >= 36) return 'Medium';
    return 'Low';
  };

  const formatTotalDuration = (minutes: number | null | undefined): string => {
    if (minutes === null || minutes === undefined || minutes === 0) return '0s';
    const totalSeconds = Math.round(minutes * 60);
    
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  // Resolve values or fall back to standard defaults if props are not supplied
  const focusVal = averageFocus !== undefined && averageFocus !== null ? Math.round(averageFocus).toString() : '0';
  const loadVal = averageCognitiveLoad !== undefined && averageCognitiveLoad !== null ? `${Math.round(averageCognitiveLoad)}%` : '0%';
  const fatigueVal = averageFatigueScore !== undefined && averageFatigueScore !== null ? getFatigueLevel(averageFatigueScore) : 'Low';
  const prodVal = averageProductivity !== undefined && averageProductivity !== null ? Math.round(averageProductivity).toString() : '0';
  const durationVal = totalFocusMinutes !== undefined && totalFocusMinutes !== null ? formatTotalDuration(totalFocusMinutes) : '0s';

  const metrics: Metric[] = [
    {
      title: 'Focus Score',
      value: focusVal,
      icon: Eye,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      iconColor: 'text-cyan-400'
    },
    {
      title: 'Cognitive Load',
      value: loadVal,
      icon: Brain,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] group-hover:border-violet-500/30',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      iconColor: 'text-violet-400'
    },
    {
      title: 'Fatigue Level',
      value: fatigueVal,
      icon: Activity,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] group-hover:border-teal-500/30',
      iconBg: 'bg-teal-500/10 border-teal-550/20',
      iconColor: 'text-teal-400'
    },
    {
      title: 'Productivity Index',
      value: prodVal,
      icon: Gauge,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:border-amber-500/30',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      iconColor: 'text-amber-400'
    },
    {
      title: 'Session Duration',
      value: durationVal,
      icon: Clock,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] group-hover:border-pink-500/30',
      iconBg: 'bg-pink-500/10 border-pink-500/20',
      iconColor: 'text-pink-400'
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {metrics.map((metric, i) => {
        const Icon = metric.icon;

        return (
          <motion.div
            key={i}
            variants={itemVariants}
            className={`group relative rounded-2xl border border-white/5 bg-slate-950/20 px-6 py-7 backdrop-blur-md shadow-lg select-none text-left overflow-hidden min-h-[130px] transition-all duration-300 hover:scale-[1.01] hover:bg-slate-950/30 ${metric.glowColor}`}
          >
            {/* Embedded glowing background indicator */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-transparent to-transparent pointer-events-none" />

            {/* Top row: Icon absolutely positioned */}
            <div className={`absolute top-4 left-4 flex h-8.5 w-8.5 items-center justify-center rounded-xl border ${metric.iconBg}`}>
              <Icon className={`h-4.5 w-4.5 ${metric.iconColor}`} />
            </div>

            {/* Content block: shifted down */}
            <div className="pt-10 flex flex-col">
              {/* Middle: Title label */}
              <span className="text-xs font-bold text-zinc-550 uppercase tracking-wider block">
                {metric.title}
              </span>

              {/* Bottom: Big bold metric value */}
              <h4 className="mt-2 text-3xl font-bold text-white tracking-tight leading-none animate-fade-in">
                {metric.value}
              </h4>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
