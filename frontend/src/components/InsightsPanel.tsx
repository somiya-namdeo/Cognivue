import React from 'react';
import { 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  ChevronRight 
} from 'lucide-react';

interface Insight {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  iconBg: string;
  iconColor: string;
}

export const InsightsPanel: React.FC = () => {
  const insights: Insight[] = [
    {
      title: 'Schedule deep work 9–11am',
      description: 'Your focus peaks early. Block calendar for transformer paper review.',
      icon: Sparkles,
      iconBg: 'bg-violet-500/10 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
      iconColor: 'text-violet-400'
    },
    {
      title: 'Add 5-min posture breaks',
      description: 'Posture drift correlates with -14% focus after 50m.',
      icon: Activity,
      iconBg: 'bg-teal-500/10 border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.15)]',
      iconColor: 'text-teal-400'
    },
    {
      title: 'Watch evening load',
      description: 'Cognitive load spikes after 21:00 — reduce tab-switching.',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
      iconColor: 'text-amber-400'
    }
  ];

  return (
    <div className="w-full rounded-2xl border border-white/5 bg-slate-950/20 p-5 backdrop-blur-md shadow-lg select-none text-left relative overflow-hidden flex flex-col justify-between h-[380px]">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.005] via-transparent to-transparent pointer-events-none" />

      {/* Header labels */}
      <div>
        <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
          AI Recommendations
        </span>
        <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight mt-0.5">
          Coach insights
        </h3>
      </div>

      {/* Stacked insights */}
      <div className="flex flex-col gap-3 my-4">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;

          return (
            <div 
              key={idx}
              className="group relative flex items-start gap-3.5 p-3 rounded-xl border border-white/[0.02] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/5 transition-all duration-300 overflow-hidden"
            >
              {/* Soft card gradient backlighting */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.005] via-transparent to-transparent pointer-events-none" />

              {/* Action circle icon */}
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${insight.iconBg}`}>
                <Icon className={`h-4 w-4 ${insight.iconColor}`} />
              </div>

              {/* Title & Description text */}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                  {insight.title}
                </span>
                <span className="text-[10px] text-zinc-450 mt-0.5 leading-relaxed font-medium">
                  {insight.description}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer redirection link */}
      <a 
        href="#all-insights" 
        className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-cyan-400 transition-colors mt-1 select-none self-start"
      >
        <span>See all insights</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </a>

    </div>
  );
};
