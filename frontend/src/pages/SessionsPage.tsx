import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Calendar, 
  Sliders, 
  Download, 
  Clock, 
  Activity, 
  Brain, 
  Target, 
  MoreHorizontal,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

const mockSessions = [
  { id: 1, name: 'Transformers paper review', date: 'May 19, 2026 - 09:12', duration: '1h 42m', focus: 92, fatigue: 'Low', productivity: 88, tags: ['research', 'reading'] },
  { id: 2, name: 'Calculus problem set', date: 'May 19, 2026 - 07:30', duration: '55m', focus: 84, fatigue: 'Low', productivity: 80, tags: ['study'] },
  { id: 3, name: 'Cognivue API coding', date: 'May 18, 2026 - 14:05', duration: '2h 15m', focus: 88, fatigue: 'Med', productivity: 91, tags: ['coding'] },
  { id: 4, name: 'DDIA - Chapter 5', date: 'May 18, 2026 - 10:20', duration: '1h 08m', focus: 78, fatigue: 'Low', productivity: 76, tags: ['reading'] },
  { id: 5, name: 'Sketching architecture', date: 'May 17, 2026 - 18:00', duration: '45m', focus: 71, fatigue: 'Med', productivity: 68, tags: ['design'] },
  { id: 6, name: 'Lecture - Neural ODEs', date: 'May 17, 2026 - 11:00', duration: '1h 30m', focus: 82, fatigue: 'Low', productivity: 79, tags: ['lecture'] },
  { id: 7, name: 'Debugging vision pipeline', date: 'May 16, 2026 - 22:10', duration: '1h 55m', focus: 64, fatigue: 'High', productivity: 58, tags: ['coding', 'late'] },
  { id: 8, name: 'Reading group - RLHF', date: 'May 16, 2026 - 16:00', duration: '1h 12m', focus: 86, fatigue: 'Low', productivity: 84, tags: ['research'] }
];

export const SessionsPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Sessions');
  const [searchTerm, setSearchTerm] = useState('');
  const [minFocus, setMinFocus] = useState(0);
  const [focusFilter, setFocusFilter] = useState('All');
  const [showNotification, setShowNotification] = useState(false);

  const containerVariants: any = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        ease: 'easeOut',
        duration: 0.5
      }
    }
  };

  // Filter sessions
  const filteredSessions = mockSessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMinFocus = session.focus >= minFocus;
    
    let matchesFocusFilter = true;
    if (focusFilter === 'Low') matchesFocusFilter = session.focus < 70;
    else if (focusFilter === 'Med') matchesFocusFilter = session.focus >= 70 && session.focus < 85;
    else if (focusFilter === 'High') matchesFocusFilter = session.focus >= 85;

    return matchesSearch && matchesMinFocus && matchesFocusFilter;
  });

  const handleExport = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/20 bg-emerald-950/80 px-4 py-3 text-sm font-semibold text-emerald-400 backdrop-blur-md shadow-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Sessions successfully exported to CSV!</span>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-8 text-left"
      >
        {/* ================= TOP TITLE SECTION ================= */}
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
            Sessions
          </h2>
          <p className="text-[15px] leading-[1.6] text-white/70 font-medium mt-2 antialiased">
            Review every cognitive session — searchable, filterable, exportable.
          </p>
        </div>

        {/* ================= FILTERS CONTROLS row ================= */}
        <div className="flex flex-col xl:flex-row gap-5 items-stretch xl:items-center justify-between select-none relative z-20">
          
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* 1. Search Box */}
            <div className="relative min-w-[280px] flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search sessions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/20 text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/20 backdrop-blur-md transition-colors"
              />
            </div>

            {/* 2. Date Range selector */}
            <div className="relative">
              <button className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/20 text-sm font-medium text-white hover:bg-white/[0.02] backdrop-blur-md transition-all">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Last 30 days</span>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            {/* 3. Min focus slider */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/20 backdrop-blur-md">
              <Sliders className="h-4 w-4 text-zinc-450" />
              <span className="text-xs font-semibold text-zinc-450 whitespace-nowrap">Min focus</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={minFocus}
                onChange={(e) => setMinFocus(Number(e.target.value))}
                className="w-24 sm:w-28 accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none opacity-80 hover:opacity-100 transition-all"
              />
              <span className="text-xs font-bold text-white min-w-[20px] text-right">{minFocus}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 4. Focus filter tabs toggle */}
            <div className="flex items-center rounded-xl border border-white/5 bg-slate-950/20 p-1 backdrop-blur-md">
              {['All', 'Low', 'Med', 'High'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFocusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    focusFilter === tab 
                      ? 'bg-white/[0.04] text-white shadow-inner border border-white/[0.02]' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 5. Export CSV Action */}
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 text-xs font-bold text-white hover:border-cyan-500/35 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)] transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

        </div>

        {/* ================= METRICS METERS SECTION ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Total time */}
          <div className="rounded-2xl border border-white/[0.04] bg-slate-950/25 p-6 backdrop-blur-md flex items-center gap-6 select-none relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Total time</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">24h 18m</span>
            </div>
          </div>

          {/* Card 2: Avg focus */}
          <div className="rounded-2xl border border-white/[0.04] bg-slate-950/25 p-6 backdrop-blur-md flex items-center gap-6 select-none relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Avg focus</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">82</span>
            </div>
          </div>

          {/* Card 3: Avg load */}
          <div className="rounded-2xl border border-white/[0.04] bg-slate-950/25 p-6 backdrop-blur-md flex items-center gap-6 select-none relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Avg load</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">64%</span>
            </div>
          </div>

          {/* Card 4: Avg productivity */}
          <div className="rounded-2xl border border-white/[0.04] bg-slate-950/25 p-6 backdrop-blur-md flex items-center gap-6 select-none relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-white/10 transition-all duration-300">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1">Avg productivity</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">79</span>
            </div>
          </div>

        </div>

        {/* ================= SESSIONS HISTORICAL TABLE ================= */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-6 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 grid-background opacity-[0.01] pointer-events-none" />
          
          <div className="overflow-x-auto w-full relative z-10">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.03]">
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Session</th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Date</th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Duration</th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Focus</th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Fatigue</th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Productivity</th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Tags</th>
                  <th className="pb-5 text-right text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredSessions.map((session) => (
                  <tr 
                    key={session.id}
                    className="group even:bg-white/[0.005] hover:bg-cyan-500/[0.015] hover:shadow-[inset_0_0_12px_rgba(6,182,212,0.02)] transition-all duration-300"
                  >
                    <td className="py-[22px] pr-4 text-[15px] font-semibold text-white group-hover:text-cyan-400 transition-colors antialiased">
                      {session.name}
                    </td>
                    <td className="py-[22px] pr-4 text-[13px] text-zinc-400 font-medium">
                      {session.date}
                    </td>
                    <td className="py-[22px] pr-4 text-[13px] text-zinc-300 font-semibold">
                      {session.duration}
                    </td>
                    <td className="py-[22px] pr-4 min-w-[140px]">
                      <div className="flex items-center gap-5">
                        {/* Faint track */}
                        <div className="h-2.5 w-24 rounded-full bg-white/[0.04] overflow-hidden relative">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 relative shadow-[0_0_8px_rgba(34,211,238,0.25)]"
                            style={{ width: `${session.focus}%` }}
                          />
                        </div>
                        <span className="text-[13px] font-bold text-white">{session.focus}</span>
                      </div>
                    </td>
                    <td className="py-[22px] pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                        session.fatigue === 'Low' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : session.fatigue === 'Med' 
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-455'
                      }`}>
                        {session.fatigue}
                      </span>
                    </td>
                    <td className="py-[22px] pr-4 text-[13px] font-bold text-white">
                      {session.productivity}
                    </td>
                    <td className="py-[22px] pr-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {session.tags.map((tag) => (
                          <span 
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.03] text-[9px] font-bold text-zinc-400 uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-[22px] text-right pr-2">
                      <button className="h-7 w-7 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04] flex items-center justify-center text-zinc-500 hover:text-white transition-all ml-auto">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500 font-medium">
                      No sessions matching filters found. Try clearing filters or search box.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </motion.div>
    </DashboardLayout>
  );
};
