import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { getNotifications, subscribeToNotifications, markAllAsRead } from '../services/notifications';
import type { AppNotification } from '../services/notifications';

interface TopbarProps {
  onMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const profile = useProfile();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n?.read).length;

  useEffect(() => {
    setNotifications(getNotifications());
    const unsubscribe = subscribeToNotifications(() => {
      setNotifications(getNotifications());
    });
    return unsubscribe;
  }, []);

  const handleNotificationClick = (route: string) => {
    navigate(route);
    setShowNotifications(false);
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
    if (!showNotifications && unreadCount > 0) {
      markAllAsRead();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      
      {/* Search Input on the Left */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        {/* Mobile menu trigger */}
        <button 
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] lg:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>


      </div>

      {/* Profile controls on the Right */}
      <div className="flex items-center gap-4">
        
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={handleOpenNotifications}
            className="relative p-2 rounded-xl border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/10 hover:bg-white/[0.04] transition-all"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] animate-pulse" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#0a0a16] shadow-xl backdrop-blur-md z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                <h4 className="text-xs font-bold text-white">Notifications</h4>
                {unreadCount > 0 && <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">{unreadCount} new</span>}
              </div>
              
              {safeNotifications.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-[11px] text-zinc-500">No new notifications</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {safeNotifications.slice(0, 5).map(notif => (
                    <div 
                      key={notif?.id || Math.random().toString()}
                      onClick={() => notif?.route && handleNotificationClick(notif.route)}
                      className={`p-2.5 rounded-lg border border-transparent cursor-pointer transition-colors ${
                        notif.read ? 'hover:bg-white/5' : 'bg-cyan-500/5 border-cyan-500/10 hover:bg-cyan-500/10'
                      }`}
                    >
                      <h5 className={`text-[11px] font-bold mb-0.5 ${notif?.type === 'error' ? 'text-rose-400' : notif?.type === 'warning' ? 'text-amber-400' : notif?.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                        {notif?.title || 'Notification'}
                      </h5>
                      <p className="text-[10px] text-zinc-400 leading-tight">{notif?.message}</p>
                      <span className="text-[9px] text-zinc-500 mt-1 block">
                        {notif?.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 pl-3 border-l border-white/[0.04] cursor-pointer hover:opacity-80 transition-opacity"
          >
            {/* Avatar Container */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400">
              {profile.initials}
            </div>
            
            {/* Text Labels */}
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
              <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
              <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors mt-1">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
