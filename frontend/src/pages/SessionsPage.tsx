import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  Search, 
  Sliders, 
  Download, 
  Clock, 
  Activity, 
  Brain, 
  Target, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  X,
  ArrowUpDown
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { getLocalSession, getSessionHistory } from '../services/api';
import type { SessionResponse } from '../services/api';
import { formatLocalDate, formatDuration } from '../utils/date';

export const SessionsPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Sessions');
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [minFocus, setMinFocus] = useState(0);
  const [focusFilter, setFocusFilter] = useState('All');
  const [fatigueFilter, setFatigueFilter] = useState('All');
  const [showNotification, setShowNotification] = useState(false);

  // Sorting state: default is date descending (newest first)
  const [sortBy, setSortBy] = useState<'date' | 'focus' | 'productivity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const containerVariants: Variants = {
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

  // Fetch session history from API
  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = getLocalSession();
      const userId = session.userId;
      if (!userId) {
        setError('No user ID found in storage. Please log in first.');
        setIsLoading(false);
        return;
      }
      const data = await getSessionHistory(userId);
      setSessions(data);
    } catch (err: any) {
      console.error('Error fetching sessions:', err);
      setError(err.message || 'Failed to fetch session history. Please check if the backend is online.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Format total cumulative time helper
  const formatTotalTime = (totalMinutes: number) => {
    if (totalMinutes <= 0) return '0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Separate active/completed sessions for metrics calculations
  const endedSessions = sessions.filter(s => s.end_time !== null);

  // Top metrics calculations (safe against division by zero)
  const totalMinutes = endedSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const totalTimeStr = formatTotalTime(totalMinutes);

  const avgFocus = endedSessions.length > 0
    ? Math.round(endedSessions.reduce((sum, s) => sum + s.focus_score, 0) / endedSessions.length)
    : null;

  const avgLoad = endedSessions.length > 0
    ? Math.round(endedSessions.reduce((sum, s) => sum + s.cognitive_load, 0) / endedSessions.length)
    : null;

  const avgProductivity = endedSessions.length > 0
    ? Math.round(endedSessions.reduce((sum, s) => sum + s.productivity_score, 0) / endedSessions.length)
    : null;

  // Sorting toggler
  const handleSort = (field: 'date' | 'focus' | 'productivity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending on new sort column selection
    }
  };

  // Filter sessions based on state
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.session_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMinFocus = session.focus_score >= minFocus;
    
    let matchesFocusFilter = true;
    if (focusFilter === 'Low') matchesFocusFilter = session.focus_score < 70;
    else if (focusFilter === 'Med') matchesFocusFilter = session.focus_score >= 70 && session.focus_score < 85;
    else if (focusFilter === 'High') matchesFocusFilter = session.focus_score >= 85;

    let matchesFatigueFilter = true;
    if (fatigueFilter !== 'All') {
      if (fatigueFilter === 'Active') {
        matchesFatigueFilter = session.end_time === null;
      } else {
        matchesFatigueFilter = session.end_time !== null && session.fatigue_level === fatigueFilter;
      }
    }

    return matchesSearch && matchesMinFocus && matchesFocusFilter && matchesFatigueFilter;
  });

  // Apply stable sorting to filtered sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'focus') {
      comparison = a.focus_score - b.focus_score;
    } else if (sortBy === 'productivity') {
      comparison = a.productivity_score - b.productivity_score;
    } else if (sortBy === 'date') {
      comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    }

    if (comparison === 0) {
      // Stable sorting fallback: created_at descending
      const dateA = new Date(a.created_at || a.start_time).getTime();
      const dateB = new Date(b.created_at || b.start_time).getTime();
      return dateB - dateA;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Export actual real session history to CSV
  const handleExport = () => {
    if (sessions.length === 0) return;
    
    const headers = ['Session Title', 'Session Type', 'Start Time (UTC)', 'End Time (UTC)', 'Duration', 'Focus Score', 'Cognitive Load', 'Fatigue Level', 'Productivity Score'];
    const rows = sessions.map(session => [
      `"${session.title.replace(/"/g, '""')}"`,
      `"${session.session_type.replace(/"/g, '""')}"`,
      `"${session.start_time}"`,
      `"${session.end_time || ''}"`,
      `"${formatDuration(session.duration_minutes, session.end_time !== null)}"`,
      session.focus_score,
      session.cognitive_load,
      session.end_time === null ? 'Active' : session.fatigue_level,
      session.productivity_score
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cognivue_sessions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Fatigue status badge class helper
  const getFatigueBadgeClass = (fatigue: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400';
    }
    switch (fatigue) {
      case 'Low':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      case 'Medium':
      case 'Med':
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
      case 'High':
        return 'bg-rose-500/10 border border-rose-500/20 text-rose-400';
      default:
        return 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400';
    }
  };

  // Pulse skeleton row loaders
  const renderSkeletons = () => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <tr key={`skeleton-${idx}`} className="animate-pulse border-b border-white/[0.02]">
        <td className="py-[22px] pr-4">
          <div className="h-5 w-44 bg-white/10 rounded" />
        </td>
        <td className="py-[22px] pr-4">
          <div className="h-4 w-36 bg-white/10 rounded" />
        </td>
        <td className="py-[22px] pr-4">
          <div className="h-4 w-16 bg-white/10 rounded" />
        </td>
        <td className="py-[22px] pr-4">
          <div className="flex items-center gap-5">
            <div className="h-2.5 w-24 bg-white/10 rounded-full" />
            <div className="h-4 w-6 bg-white/10 rounded" />
          </div>
        </td>
        <td className="py-[22px] pr-4">
          <div className="h-5 w-16 bg-white/10 rounded-full" />
        </td>
        <td className="py-[22px] pr-4">
          <div className="h-4 w-8 bg-white/10 rounded" />
        </td>
        <td className="py-[22px] pr-4">
          <div className="h-4.5 w-20 bg-white/10 rounded" />
        </td>
        <td className="py-[22px] text-right">
          <div className="h-7 w-7 bg-white/10 rounded-lg ml-auto" />
        </td>
      </tr>
    ));
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/20 bg-emerald-950/80 px-4 py-3 text-sm font-semibold text-emerald-450 backdrop-blur-md shadow-lg flex items-center gap-2">
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
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-3.5">
              <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
                Sessions
              </h2>
              <button 
                onClick={fetchHistory}
                disabled={isLoading}
                className="p-2 rounded-xl border border-white/5 bg-slate-950/20 text-zinc-400 hover:text-white hover:bg-white/[0.04] backdrop-blur-md transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                title="Refresh Sessions"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
            <p className="text-[15px] leading-[1.6] text-white/70 font-medium mt-2 antialiased">
              Review every cognitive session — searchable, filterable, exportable.
            </p>
          </div>
        </div>

        {/* Elegant Dismissible Alert Box for Offline Backend Exception */}
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/40 p-4 text-sm font-semibold text-rose-300 backdrop-blur-md shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-rose-450 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================= FILTERS CONTROLS row ================= */}
        <div className="flex flex-col xl:flex-row gap-5 items-stretch xl:items-center justify-between select-none relative z-20">
          
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* 1. Search Box */}
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search sessions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/20 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/20 backdrop-blur-md transition-colors"
              />
            </div>

            {/* 2. Fatigue Filter Selector Dropdown */}
            <div className="relative min-w-[160px]">
              <select
                value={fatigueFilter}
                onChange={(e) => setFatigueFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-white/5 bg-slate-950/20 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/20 backdrop-blur-md transition-all cursor-pointer"
              >
                <option value="All" className="bg-slate-950 text-white font-medium">All Fatigue</option>
                <option value="Low" className="bg-slate-950 text-white font-medium">Low Fatigue</option>
                <option value="Medium" className="bg-slate-950 text-white font-medium">Medium Fatigue</option>
                <option value="High" className="bg-slate-950 text-white font-medium">High Fatigue</option>
                <option value="Active" className="bg-slate-950 text-white font-medium">Active Sessions</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-550 pointer-events-none" />
            </div>

            {/* 3. Min focus slider */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl border border-white/5 bg-slate-950/20 backdrop-blur-md">
              <Sliders className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-450 whitespace-nowrap">Min focus</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={minFocus}
                onChange={(e) => setMinFocus(Number(e.target.value))}
                className="w-24 sm:w-28 accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none opacity-80 hover:opacity-100 transition-all"
              />
              <span className="text-xs font-extrabold text-white min-w-[20px] text-right">{minFocus}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 4. Focus filter tabs toggle */}
            <div className="flex items-center rounded-xl border border-white/5 bg-slate-950/20 p-1 backdrop-blur-md">
              {['All', 'Low', 'Med', 'High'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFocusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
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
              disabled={sessions.length === 0}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 text-xs font-bold text-white hover:border-cyan-500/35 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)] transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

        </div>

        {/* ================= METRICS METERS SECTION ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Total time */}
          <div className="glass-card p-6 flex items-center gap-6 select-none relative overflow-hidden">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1 font-bold">Total time</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">
                {totalTimeStr}
              </span>
            </div>
          </div>

          {/* Card 2: Avg focus */}
          <div className="glass-card p-6 flex items-center gap-6 select-none relative overflow-hidden">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1 font-bold">Avg focus</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">
                {avgFocus !== null ? avgFocus : '--'}
              </span>
            </div>
          </div>

          {/* Card 3: Avg load */}
          <div className="glass-card p-6 flex items-center gap-6 select-none relative overflow-hidden">
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1 font-bold">Avg load</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">
                {avgLoad !== null ? `${avgLoad}%` : '--'}
              </span>
            </div>
          </div>

          {/* Card 4: Avg productivity */}
          <div className="glass-card p-6 flex items-center gap-6 select-none relative overflow-hidden">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 block mb-1 font-bold">Avg productivity</span>
              <span className="text-[26px] font-bold text-white tracking-tight leading-none antialiased">
                {avgProductivity !== null ? avgProductivity : '--'}
              </span>
            </div>
          </div>

        </div>

        {/* ================= SESSIONS HISTORICAL TABLE ================= */}
        <div className="glass-panel p-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 grid-background opacity-[0.01] pointer-events-none" />
          
          <div className="overflow-x-auto w-full relative z-10">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.03]">
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Session</th>
                  <th 
                    className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1 select-none">
                      <span>Date</span>
                      {sortBy === 'date' ? (
                        sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30 text-zinc-400" />
                      )}
                    </div>
                  </th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Duration</th>
                  <th 
                    className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('focus')}
                  >
                    <div className="flex items-center gap-1 select-none">
                      <span>Focus</span>
                      {sortBy === 'focus' ? (
                        sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30 text-zinc-400" />
                      )}
                    </div>
                  </th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Fatigue</th>
                  <th 
                    className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('productivity')}
                  >
                    <div className="flex items-center gap-1 select-none">
                      <span>Productivity</span>
                      {sortBy === 'productivity' ? (
                        sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-cyan-400" /> : <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-30 text-zinc-400" />
                      )}
                    </div>
                  </th>
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Tags</th>
                  <th className="pb-5 text-right text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {isLoading ? (
                  renderSkeletons()
                ) : sortedSessions.map((session) => {
                  const isActive = session.end_time === null;
                  return (
                    <tr 
                      key={session.id}
                      className="group even:bg-white/[0.005] hover:bg-cyan-500/[0.015] hover:shadow-[inset_0_0_12px_rgba(6,182,212,0.02)] transition-all duration-300"
                    >
                      <td className="py-[22px] pr-4 text-[15px] font-bold text-white group-hover:text-cyan-400 transition-colors antialiased">
                        {session.title}
                      </td>
                      <td className="py-[22px] pr-4 text-[13px] text-zinc-300 font-semibold">
                        {formatLocalDate(session.start_time)}
                      </td>
                      <td className={`py-[22px] pr-4 text-[13px] font-bold ${isActive ? 'text-cyan-455 animate-pulse' : 'text-zinc-200'}`}>
                        {formatDuration(session.duration_minutes, !isActive)}
                      </td>
                      <td className="py-[22px] pr-4 min-w-[140px]">
                        <div className="flex items-center gap-5">
                          {/* Faint track */}
                          <div className="h-2.5 w-24 rounded-full bg-white/[0.04] overflow-hidden relative">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 relative shadow-[0_0_8px_rgba(34,211,238,0.25)]"
                              style={{ width: `${session.focus_score}%` }}
                            />
                          </div>
                          <span className="text-[13px] font-extrabold text-white">{session.focus_score}</span>
                        </div>
                      </td>
                      <td className="py-[22px] pr-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${getFatigueBadgeClass(session.fatigue_level, isActive)}`}>
                          {isActive ? 'Active' : session.fatigue_level}
                        </span>
                      </td>
                      <td className="py-[22px] pr-4 text-[13px] font-extrabold text-white">
                        {session.productivity_score}
                      </td>
                      <td className="py-[22px] pr-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.05] text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider">
                            {session.session_type}
                          </span>
                        </div>
                      </td>
                      <td className="py-[22px] text-right pr-2">
                        <button className="h-7 w-7 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04] flex items-center justify-center text-zinc-500 hover:text-white transition-all ml-auto">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {!isLoading && sortedSessions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400 font-bold text-sm">
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
