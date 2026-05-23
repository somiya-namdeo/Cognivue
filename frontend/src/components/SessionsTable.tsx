import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SessionResponse } from '../services/api';
import { formatDuration } from '../utils/date';

interface SessionsTableProps {
  sessions?: SessionResponse[];
}

export const SessionsTable: React.FC<SessionsTableProps> = ({ sessions }) => {
  const navigate = useNavigate();
  const displaySessions = sessions !== undefined ? sessions : [];

  const formatWhen = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      if (date.toDateString() === today.toDateString()) {
        return `Today · ${timeStr}`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday · ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
        return `${dateStr} · ${timeStr}`;
      }
    } catch {
      return 'Unknown';
    }
  };

  const getLoadLevel = (load: number): 'High' | 'Med' | 'Low' => {
    if (load >= 70) return 'High';
    if (load >= 35) return 'Med';
    return 'Low';
  };

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
        <button 
          onClick={() => navigate('/sessions')}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-zinc-500 hover:text-cyan-400 transition-colors select-none bg-transparent border-none cursor-pointer"
        >
          <span>View all</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto px-6 pb-5">
        {displaySessions.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-sm font-semibold select-none">
            No focus sessions logged yet.
          </div>
        ) : (
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
              {displaySessions.map((row, idx) => {
                const sessionTitle = `${row.title} · ${row.session_type}`;
                const durationStr = formatDuration(row.duration_minutes, row.end_time !== null);
                const loadLevel = getLoadLevel(row.cognitive_load);
                
                // Cleanup fake 100 focus scores from old dev tests
                let displayFocus: string | number = row.focus_score;
                if (row.focus_score === 100) {
                   if ((row.duration_minutes || 0) < 0.2) {
                     displayFocus = '--';
                   } else {
                     displayFocus = 98; // Cap legacy false 100s
                   }
                } else if (row.focus_score === 0 && (row.duration_minutes || 0) === 0) {
                   displayFocus = '--';
                }

                return (
                  <tr 
                    key={row.id || idx}
                    className="group hover:bg-white/[0.012] transition-colors duration-200"
                  >
                    {/* Session Title - Crisp, Premium Typography */}
                    <td className="py-4 font-semibold text-zinc-100 antialiased leading-relaxed tracking-normal transition-colors duration-300 group-hover:text-cyan-400">
                      {sessionTitle}
                    </td>
                    
                    {/* Duration */}
                    <td className="py-4 font-medium text-zinc-400">
                      {durationStr}
                    </td>
                    
                    {/* Focus score progress bar */}
                    <td className="py-4">
                      <div className="flex items-center gap-3 w-40">
                        <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden relative">
                          <div 
                            className="h-full rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.3)] relative transition-transform duration-300 group-hover:scale-x-[1.01] origin-left"
                            style={{ width: displayFocus === '--' ? '0%' : `${displayFocus}%` }}
                          />
                        </div>
                        <span className="font-bold text-zinc-200 text-[10px] sm:text-xs">
                          {displayFocus}
                        </span>
                      </div>
                    </td>
                    
                    {/* Load level pill - Desaturated Frosted Glass styling */}
                    <td className="py-4">
                      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border select-none uppercase tracking-wide ${
                        loadLevel === 'High'
                          ? 'text-rose-350/90 bg-rose-500/[0.02] border-rose-500/10'
                          : loadLevel === 'Med'
                          ? 'text-amber-350/90 bg-amber-500/[0.02] border-amber-555/10'
                          : 'text-emerald-350/90 bg-emerald-500/[0.02] border-emerald-500/10'
                      }`}>
                        {loadLevel}
                      </span>
                    </td>
                    
                    {/* When */}
                    <td className="py-4 font-semibold text-zinc-500">
                      {formatWhen(row.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
