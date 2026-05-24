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
import { getLocalSession, getSessionHistory, deleteSession, updateSession } from '../services/api';
import type { SessionResponse } from '../services/api';
import { formatLocalDate, formatDuration } from '../utils/date';

export const SessionsPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Sessions');
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [minFocus, setMinFocus] = useState(0);
  const [loadFilter, setLoadFilter] = useState('All');
  const [fatigueFilter, setFatigueFilter] = useState('All');
  const [showNotification, setShowNotification] = useState(false);

  // Action Menu States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Modals
  const [sessionToRename, setSessionToRename] = useState<SessionResponse | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameType, setRenameType] = useState('');

  const [sessionToDelete, setSessionToDelete] = useState<SessionResponse | null>(null);

  const SESSION_TYPES = [
    'Deep Work', 'Coding', 'Research', 'Studying', 'Reading', 'Creative Work', 'Meeting', 'Planning', 'Custom'
  ];

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
    const searchLower = searchTerm.toLowerCase();
    const domainStr = session.top_domains ? session.top_domains.join(' ').toLowerCase() : '';
    const matchesSearch = session.title.toLowerCase().includes(searchLower) ||
                          session.session_type.toLowerCase().includes(searchLower) ||
                          domainStr.includes(searchLower);
    
    const matchesMinFocus = session.focus_score >= minFocus;
    
    let matchesLoadFilter = true;
    if (loadFilter === 'Low Load') matchesLoadFilter = session.cognitive_load < 40;
    else if (loadFilter === 'Medium Load') matchesLoadFilter = session.cognitive_load >= 40 && session.cognitive_load < 75;
    else if (loadFilter === 'High Load') matchesLoadFilter = session.cognitive_load >= 75;

    let matchesFatigueFilter = true;
    if (fatigueFilter !== 'All') {
      if (fatigueFilter === 'Active') {
        matchesFatigueFilter = session.end_time === null;
      } else {
        matchesFatigueFilter = session.end_time !== null && session.fatigue_level === fatigueFilter;
      }
    }

    return matchesSearch && matchesMinFocus && matchesLoadFilter && matchesFatigueFilter;
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
    if (filteredSessions.length === 0) return;
    
    const headers = ['Session Title', 'Session Type', 'Start Time (UTC)', 'End Time (UTC)', 'Duration', 'Avg Focus', 'Cognitive Load', 'Fatigue Level', 'Productivity Score', 'Top Domains'];
    const rows = filteredSessions.map(session => [
      `"${session.title.replace(/"/g, '""')}"`,
      `"${session.session_type.replace(/"/g, '""')}"`,
      `"${session.start_time}"`,
      `"${session.end_time || ''}"`,
      `"${formatDuration(session.duration_minutes, session.end_time !== null)}"`,
      session.focus_score,
      session.cognitive_load,
      session.end_time === null ? 'Active' : session.fatigue_level,
      session.productivity_score,
      `"${session.top_domains ? session.top_domains.join(' | ') : ''}"`
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

  // Action Handlers
  const handleRenameSubmit = async () => {
    if (!sessionToRename) return;
    setIsLoading(true);
    try {
      const updated = await updateSession(sessionToRename.id, renameTitle, renameType);
      setSessions(sessions.map(s => s.id === updated.id ? updated : s));
      setSessionToRename(null);
    } catch {
      setError('Failed to rename session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    setIsLoading(true);
    try {
      await deleteSession(sessionToDelete.id);
      setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
      setSessionToDelete(null);
    } catch {
      setError('Failed to delete session.');
    } finally {
      setIsLoading(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-3.5">
              <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
                Sessions
              </h2>
              <button 
                onClick={fetchHistory}
                disabled={isLoading}
                className="p-2 rounded-xl border border-white/10 bg-slate-950/20 text-zinc-400 hover:text-white hover:bg-white/[0.04] backdrop-blur-md transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
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

        {/* ================= GLOBAL EMPTY STATE ================= */}
        {!isLoading && sessions.length === 0 && !error && (
          <div className="rounded-xl border border-white/10 bg-slate-950/20 p-6 text-center text-zinc-400 font-semibold text-sm">
            No sessions recorded yet. Start a monitoring session to populate your history.
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/20 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/20 backdrop-blur-md transition-colors"
              />
            </div>

            {/* 2. Fatigue Filter Selector Dropdown */}
            <div className="relative min-w-[160px]">
              <select
                value={fatigueFilter}
                onChange={(e) => setFatigueFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-white/10 bg-slate-950/20 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/20 backdrop-blur-md transition-all cursor-pointer"
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
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/20 backdrop-blur-md">
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
            {/* 4. Load filter tabs toggle */}
            <div className="flex flex-wrap items-center rounded-xl border border-white/10 bg-slate-950/20 p-1 backdrop-blur-md">
              {['All', 'Low Load', 'Medium Load', 'High Load'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLoadFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap ${
                    loadFilter === tab 
                      ? 'bg-white/[0.04] text-white shadow-inner border border-white/[0.02]' 
                      : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 5. Export CSV Action */}
            <button 
              onClick={handleExport}
              disabled={filteredSessions.length === 0}
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
          <div className="bg-slate-950/20 p-6 flex items-center gap-6 select-none relative overflow-hidden">
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
          <div className="bg-slate-950/20 p-6 flex items-center gap-6 select-none relative overflow-hidden">
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
          <div className="bg-slate-950/20 p-6 flex items-center gap-6 select-none relative overflow-hidden">
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
          <div className="bg-slate-950/20 p-6 flex items-center gap-6 select-none relative overflow-hidden">
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
                  <th className="pb-5 text-[11px] uppercase tracking-[0.1em] text-white/45 font-bold">Type</th>
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
                      <td className="py-[22px] pr-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[15px] font-bold text-white group-hover:text-cyan-400 transition-colors antialiased">
                            {session.title}
                          </span>
                          {session.top_domains && session.top_domains.length > 0 && (
                            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-violet-500/80"></span>
                              {session.top_domains.join(' + ')} dominant
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-[22px] pr-4 text-[13px] text-zinc-400 font-semibold">
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
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
                            {session.session_type}
                          </span>
                        </div>
                      </td>
                      <td className="py-[22px] text-right pr-2 relative">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === session.id ? null : session.id)}
                          className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ml-auto ${activeMenuId === session.id ? 'bg-white/[0.08] border-white/[0.08] text-white' : 'hover:bg-white/[0.04] border-transparent hover:border-white/[0.04] text-zinc-500 hover:text-white'}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeMenuId === session.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)}></div>
                            <div className="absolute right-8 top-16 z-40 w-40 rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl py-1 overflow-hidden flex flex-col text-left text-xs font-semibold animate-in fade-in zoom-in-95 duration-100">
                              <button 
                                onClick={() => {
                                  setRenameTitle(session.title);
                                  setRenameType(session.session_type);
                                  setSessionToRename(session);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                Rename Session
                              </button>
                              <div className="w-full h-px bg-white/5 my-0.5"></div>
                              <button 
                                onClick={() => {
                                  setSessionToDelete(session);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                              >
                                Delete Session
                              </button>
                            </div>
                          </>
                        )}
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

      {/* RENAME MODAL */}
      {sessionToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-5 text-left"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white tracking-tight">Rename Session</h3>
              <button onClick={() => setSessionToRename(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider text-white/50 font-bold">Session Title</label>
                <input 
                  type="text" 
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider text-white/50 font-bold">Session Type</label>
                <select 
                  value={renameType}
                  onChange={(e) => setRenameType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-cyan-500/50 focus:outline-none transition-all cursor-pointer appearance-none"
                >
                  {SESSION_TYPES.map(type => (
                    <option key={type} value={type} className="bg-slate-900">{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setSessionToRename(null)} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors">
                Cancel
              </button>
              <button onClick={handleRenameSubmit} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:from-cyan-400 hover:to-violet-500 transition-all shadow-lg shadow-cyan-500/20">
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DELETE MODAL */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-5 text-left"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-rose-400 tracking-tight flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Delete Session
              </h3>
              <button onClick={() => setSessionToDelete(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-[13px] text-white/70 leading-relaxed font-medium">
              Are you sure you want to permanently delete <strong className="text-white">"{sessionToDelete.title}"</strong>? This action cannot be undone and will remove associated telemetry.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setSessionToDelete(null)} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="flex-1 rounded-xl bg-rose-500/20 border border-rose-500/30 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/50 transition-all">
                Yes, Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </DashboardLayout>
  );
};
