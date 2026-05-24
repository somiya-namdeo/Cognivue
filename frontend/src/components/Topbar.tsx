import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Menu, Settings, LogOut, CheckCheck, Trash2, Info, AlertTriangle, XCircle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import {
  getNotifications,
  markNotificationRead,
  markAllAsRead,
  clearAllNotifications,
  subscribeToNotifications,
} from '../services/notifications';
import type { AppNotification } from '../services/notifications';

interface TopbarProps {
  onMenuToggle: () => void;
}

// ─── Icon per notification type ──────────────────────────────────────────────
const NotifIcon: React.FC<{ type: AppNotification['type'] }> = ({ type }) => {
  const base = 'h-3.5 w-3.5 shrink-0 mt-0.5';
  switch (type) {
    case 'success': return <CheckCircle className={`${base} text-emerald-400`} />;
    case 'warning': return <AlertTriangle className={`${base} text-amber-400`} />;
    case 'error':   return <XCircle className={`${base} text-rose-400`} />;
    default:        return <Info className={`${base} text-cyan-400`} />;
  }
};

// ─── Colour per type ─────────────────────────────────────────────────────────
const titleColor = (type: AppNotification['type']) => {
  switch (type) {
    case 'success': return 'text-emerald-400';
    case 'warning': return 'text-amber-400';
    case 'error':   return 'text-rose-400';
    default:        return 'text-cyan-400';
  }
};

const unreadBg = (type: AppNotification['type']) => {
  switch (type) {
    case 'success': return 'bg-emerald-500/5 border-emerald-500/15';
    case 'warning': return 'bg-amber-500/5 border-amber-500/15';
    case 'error':   return 'bg-rose-500/5 border-rose-500/15';
    default:        return 'bg-cyan-500/5 border-cyan-500/15';
  }
};

// ─── Relative time ────────────────────────────────────────────────────────────
const relativeTime = (iso: string): string => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return '';
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return '';
  }
};

// ─── Topbar ──────────────────────────────────────────────────────────────────
export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const profile   = useProfile();
  const navigate  = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu,   setShowProfileMenu]   = useState(false);
  const [notifications,     setNotifications]     = useState<AppNotification[]>([]);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Always a safe array — defensive
  const safe       = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safe.filter((n) => !n?.read).length;

  // ── Sync from storage ──
  const sync = useCallback(() => {
    setNotifications(getNotifications());
  }, []);

  useEffect(() => {
    sync();
    return subscribeToNotifications(sync);
  }, [sync]);

  // Re-sync whenever user_id changes (account switch)
  useEffect(() => {
    const handle = () => sync();
    window.addEventListener('storage', handle);
    return () => window.removeEventListener('storage', handle);
  }, [sync]);

  // ── Click outside ──
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // ── Handlers ──
  const handleBell = () => {
    setShowNotifications((v) => !v);
    setShowProfileMenu(false);
  };

  const handleNotifClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    if (notif.targetRoute || notif.route) {
      navigate(notif.targetRoute ?? notif.route ?? '/dashboard');
    }
    setShowNotifications(false);
  };

  const handleMarkAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllNotifications();
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    navigate('/login');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-white/[0.04] bg-[#03030b]/40 backdrop-blur-md flex items-center justify-between px-6 sm:px-8">

      {/* Left: mobile menu */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] lg:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Right: notification bell + profile */}
      <div className="flex items-center gap-4">

        {/* ── Notification Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            id="notification-bell-btn"
            onClick={handleBell}
            className="relative p-2 rounded-xl border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-cyan-500 text-[9px] font-bold text-black flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.7)] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* ── Dropdown ── */}
          {showNotifications && (
            <div
              id="notification-dropdown"
              className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#07070f]/95 shadow-2xl backdrop-blur-xl z-50 overflow-hidden"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white tracking-wide">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[9px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAll}
                      title="Mark all as read"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {safe.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      title="Clear all"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              {safe.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-center px-6">
                  <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1">
                    <Bell className="h-5 w-5 text-zinc-600" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-400">No notifications yet</p>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    Events like session completions, fatigue alerts, and AI updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col max-h-[340px] overflow-y-auto">
                  {safe.slice(0, 10).map((notif, idx) => (
                    <div
                      key={notif.id ?? idx}
                      onClick={() => handleNotifClick(notif)}
                      className={`
                        group flex gap-3 px-4 py-3 cursor-pointer transition-all border-b border-white/[0.04] last:border-0
                        ${notif.read
                          ? 'hover:bg-white/[0.03]'
                          : `${unreadBg(notif.type)} hover:brightness-125 border-l-[2px]`
                        }
                      `}
                      style={{ borderLeftColor: notif.read ? 'transparent' : undefined }}
                    >
                      {/* Type icon */}
                      <div className="pt-0.5 shrink-0">
                        <NotifIcon type={notif.type} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h5 className={`text-[11px] font-bold leading-tight ${titleColor(notif.type)}`}>
                            {notif.title ?? 'Notification'}
                          </h5>
                          <span className="text-[9px] text-zinc-600 shrink-0 mt-0.5">
                            {relativeTime(notif.created_at ?? notif.timestamp ?? '')}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        {(notif.targetRoute || notif.route) && !notif.read && (
                          <span className="text-[9px] text-cyan-500/70 mt-1 block group-hover:text-cyan-400 transition-colors">
                            Tap to view →
                          </span>
                        )}
                      </div>

                      {/* Unread dot */}
                      {!notif.read && (
                        <div className="shrink-0 pt-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {safe.length > 10 && (
                <div className="px-4 py-2.5 border-t border-white/[0.06]">
                  <p className="text-[10px] text-zinc-600 text-center">
                    Showing 10 of {safe.length} — clear old ones to see more
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User Card ── */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 pl-3 border-l border-white/[0.04] cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400">
              {profile.initials}
            </div>
            <div className="hidden md:flex flex-col text-left select-none">
              <span className="text-xs font-semibold text-zinc-100">{profile.displayName}</span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#0a0a16] shadow-xl backdrop-blur-md z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <span className="text-xs font-semibold text-white block">{profile.displayName}</span>
                <span className="text-[10px] text-zinc-500">{profile.email}</span>
              </div>
              <button
                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors mt-1 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
