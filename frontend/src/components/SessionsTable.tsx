import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SessionRow {
  session: string;
  duration: string;
  focusScore: number;
  loadLevel: 'High' | 'Med' | 'Low';
  when: string;
}

export const SessionsTable: React.FC = () => {
  const sessions: SessionRow[] = [
    {
      session: 'Deep Research · Transformers',
      duration: '1h 42m',
      focusScore: 92,
      loadLevel: 'High',
      when: 'Today · 09:12'
    },
    {
      session: 'Calculus Problem Set',
      duration: '55m',
      focusScore: 84,
      loadLevel: 'Med',
      when: 'Today · 07:30'
    },
    {
      session: 'Reading: Designing Data-Intensive Apps',
      duration: '1h 08m',
      focusScore: 78,
      loadLevel: 'Med',
      when: 'Yesterday'
    },
    {
      session: 'Coding · Cognivue API',
      duration: '2h 15m',
      focusScore: 88,
      loadLevel: 'High',
      when: 'Yesterday'
    }
  ];

  return (
    <div className="w-full rounded-2xl border border-white/[0.03] bg-slate-950/15 backdrop-blur-md shadow-sm select-none text-left relative overflow-hidden flex flex-col gap-5">
      
      {/* Header title */}
      <div className="flex items-center justify-between px-6 pt-5">
        <div>
          <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">
            Recent sessions
          </span>
          <h3 className="text-sm font-bold text-zinc-100 tracking-tight leading-tight mt-1">
            History
          </h3>
        </div>
        <a 
          href="#history" 
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-zinc-500 hover:text-cyan-400 transition-colors select-none"
        >
          <span>View all</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto px-6 pb-5">
        <table className="w-full min-w-[650px] border-collapse text-left text-xs text-zinc-300">
          <thead>
            <tr className="border-b border-white/[0.02]">
              <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
                Session
              </th>
              <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
                Duration
              </th>
              <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
                Focus
              </th>
              <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
                Load
              </th>
              <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
                When
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.015]">
            {sessions.map((row, idx) => (
              <tr 
                key={idx}
                className="group hover:bg-white/[0.012] transition-colors duration-200"
              >
                {/* Session Title - Crisp, Premium Typography */}
                <td className="py-4 font-semibold text-zinc-100 antialiased leading-relaxed tracking-normal transition-colors duration-300 group-hover:text-cyan-400">
                  {row.session}
                </td>
                
                {/* Duration */}
                <td className="py-4 font-medium text-zinc-400">
                  {row.duration}
                </td>
                
                {/* Focus score progress bar */}
                <td className="py-4">
                  <div className="flex items-center gap-3 w-40">
                    <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden relative">
                      <div 
                        className="h-full rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.3)] relative transition-transform duration-300 group-hover:scale-x-[1.01] origin-left"
                        style={{ width: `${row.focusScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-zinc-200 text-[10px] sm:text-xs">
                      {row.focusScore}
                    </span>
                  </div>
                </td>
                
                {/* Load level pill - Desaturated Frosted Glass styling */}
                <td className="py-4">
                  <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border select-none uppercase tracking-wide ${
                    row.loadLevel === 'High'
                      ? 'text-rose-350/90 bg-rose-500/[0.02] border-rose-500/10'
                      : row.loadLevel === 'Med'
                      ? 'text-amber-350/90 bg-amber-500/[0.02] border-amber-555/10'
                      : 'text-emerald-350/90 bg-emerald-500/[0.02] border-emerald-500/10'
                  }`}>
                    {row.loadLevel}
                  </span>
                </td>
                
                {/* When */}
                <td className="py-4 font-semibold text-zinc-500">
                  {row.when}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
