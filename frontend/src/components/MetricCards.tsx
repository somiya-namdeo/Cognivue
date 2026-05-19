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

interface Metric {
  title: string;
  value: string;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  glowColor: string;
  iconBg: string;
  iconColor: string;
}

export const MetricCards: React.FC = () => {
  const metrics: Metric[] = [
    {
      title: 'Focus Score',
      value: '92',
      trend: '↗ +8',
      trendType: 'positive',
      icon: Eye,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      iconColor: 'text-cyan-400'
    },
    {
      title: 'Cognitive Load',
      value: '68%',
      trend: '↘ -4',
      trendType: 'positive', // wait, cognitive load going down is positive!
      icon: Brain,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] group-hover:border-violet-500/30',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      iconColor: 'text-violet-400'
    },
    {
      title: 'Fatigue Level',
      value: 'Low',
      trend: '↗ stable',
      trendType: 'neutral',
      icon: Activity,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] group-hover:border-teal-500/30',
      iconBg: 'bg-teal-500/10 border-teal-500/20',
      iconColor: 'text-teal-400'
    },
    {
      title: 'Productivity Index',
      value: '84',
      trend: '↗ +12',
      trendType: 'positive',
      icon: Gauge,
      glowColor: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group-hover:border-amber-500/30',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      iconColor: 'text-amber-400'
    },
    {
      title: 'Session Duration',
      value: '3h 12m',
      trend: '↗ +22m',
      trendType: 'positive',
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
            className={`group relative rounded-2xl border border-white/5 bg-slate-950/20 p-4.5 backdrop-blur-md shadow-lg select-none text-left overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-slate-950/30 ${metric.glowColor}`}
          >
            {/* Embedded glowing background indicator */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-transparent to-transparent pointer-events-none" />

            {/* Top row: Icon + trend status */}
            <div className="flex items-center justify-between">
              <div className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl border ${metric.iconBg}`}>
                <Icon className={`h-4.5 w-4.5 ${metric.iconColor}`} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                metric.trendType === 'positive' 
                  ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                  : metric.trendType === 'negative'
                  ? 'text-red-400 bg-red-500/5 border-red-500/10'
                  : 'text-zinc-400 bg-zinc-500/5 border-zinc-500/10'
              }`}>
                {metric.trend}
              </span>
            </div>

            {/* Middle: Title label */}
            <span className="mt-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              {metric.title}
            </span>

            {/* Bottom: Big bold metric value */}
            <h4 className="mt-1 text-2xl font-black text-white tracking-tight leading-none">
              {metric.value}
            </h4>

          </motion.div>
        );
      })}
    </motion.div>
  );
};
