import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Sparkles, 
  Clock, 
  Globe, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { clearActiveSession, getLocalSession, getActiveSession, getSessionMetrics, getExtensionActivity } from '../services/api';
import { pushNotification } from '../services/notifications';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  setActiveItem,
  isOpen = false,
  onClose
}) => {
  const navigate = useNavigate();

  const [sysState, setSysState] = useState<'idle' | 'initializing' | 'live' | 'paused' | 'disconnected'>('idle');

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      const session = getLocalSession();
      if (!session.userId) {
         if (isMounted) setSysState('disconnected');
         return;
      }

      try {
        const activeSess = await getActiveSession(session.userId).catch(() => null);
        if (!activeSess || !activeSess.id || activeSess.end_time) {
           const extData = await getExtensionActivity(session.userId).catch(() => null);
           const hasExtension = extData && extData.length > 0;
           if (isMounted) {
             setSysState(hasExtension ? 'idle' : 'disconnected');
             if (!hasExtension) {
               pushNotification('Extension Disconnected', 'Cannot detect the browser extension.', 'error', '/extension');
             }
           }
           return;
        }

        const metrics = await getSessionMetrics(activeSess.id).catch(() => null);
        if (!metrics || metrics.length === 0) {
           if (isMounted) setSysState('initializing');
           return;
        }

        const latestMetric = metrics[metrics.length - 1];
        const lastTime = new Date(latestMetric.recorded_at).getTime();
        const now = Date.now();
        const diffSeconds = (now - lastTime) / 1000;

        if (diffSeconds > 15) {
           if (isMounted) {
             setSysState('paused');
             pushNotification('Telemetry Paused', 'No metrics received for over 15 seconds.', 'warning', '/live-monitoring');
           }
        } else {
           if (isMounted) setSysState('live');
        }
      } catch (err) {
        if (isMounted) {
          setSysState('disconnected');
          pushNotification('Extension Disconnected', 'Cannot reach local background script.', 'error', '/extension');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusConfig = () => {
    switch (sysState) {
      case 'live':
        return {
          text: 'Live cognitive telemetry streaming.',
          dotColor: 'bg-cyan-400',
          dotShadow: 'shadow-[0_0_8px_rgba(34,211,238,0.5)]',
          barColor: 'from-violet-500 to-cyan-400',
          barAnim: 'animate-pulse',
          barOpacity: 'opacity-50',
          title: 'Browser CV Active'
        };
      case 'initializing':
        return {
          text: 'Initializing cognitive telemetry...',
          dotColor: 'bg-amber-400',
          dotShadow: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]',
          barColor: 'from-amber-500/50 to-amber-400',
          barAnim: 'animate-pulse',
          barOpacity: 'opacity-70',
          title: 'Connecting Stream...'
        };
      case 'paused':
        return {
          text: 'Telemetry temporarily paused.',
          dotColor: 'bg-amber-500',
          dotShadow: 'shadow-none',
          barColor: 'from-amber-600/30 to-amber-500/30',
          barAnim: '',
          barOpacity: 'opacity-30',
          title: 'Stream Stalled'
        };
      case 'disconnected':
        return {
          text: 'Browser extension offline.',
          dotColor: 'bg-red-500',
          dotShadow: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]',
          barColor: 'from-red-600/20 to-red-500/20',
          barAnim: '',
          barOpacity: 'opacity-0 hidden',
          title: 'System Offline'
        };
      case 'idle':
      default:
        return {
          text: 'Idle — start a monitoring session to begin telemetry tracking.',
          dotColor: 'bg-zinc-500',
          dotShadow: 'shadow-none',
          barColor: 'from-zinc-600/10 to-zinc-500/10',
          barAnim: '',
          barOpacity: 'opacity-0 hidden',
          title: 'System Standby'
        };
    }
  };

  const statusConfig = getStatusConfig();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Live Monitoring', icon: Activity },
    { name: 'AI Insights', icon: Sparkles },
    { name: 'Sessions', icon: Clock },
    { name: 'Extension', icon: Globe },
    { name: 'Settings', icon: Settings },
  ];

  const handleNavClick = (itemName: string) => {
    if (itemName === 'Dashboard') {
      navigate('/dashboard');
    } else if (itemName === 'Live Monitoring') {
      navigate('/live-monitoring');
    } else if (itemName === 'AI Insights') {
      navigate('/ai-insights');
    } else if (itemName === 'Sessions') {
      navigate('/sessions');
    } else if (itemName === 'Extension') {
      navigate('/extension');
    } else if (itemName === 'Settings') {
      navigate('/settings');
    }
    setActiveItem(itemName);
    if (onClose) onClose();
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/[0.04] bg-[#03030b]/70 backdrop-blur-xl flex flex-col justify-between p-5 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      
      {/* Top Brand Logo */}
      <div className="flex flex-col gap-8">
        <Link to="/" className="inline-flex items-center px-2">
          <img src="/logo.png" alt="Cognivue Logo" className="h-10 w-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]" />
        </Link>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.name;

            return (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.name)}
                className={`relative group w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[15px] font-semibold transition-all duration-300 ${
                  isActive 
                    ? 'text-white bg-white/[0.03] border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon className={`h-5 w-5 transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
                  <span>{item.name}</span>
                </div>

                {/* Glowing cyan active dot */}
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom widgets and Sign out */}
      <div className="flex flex-col gap-6">
        
        {/* Local inference status card */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#03030b]/40 p-4 flex flex-col gap-3 backdrop-blur-md relative overflow-hidden transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />
          
          <div className="flex flex-col gap-0.5 select-none text-left">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">System Status</span>
            <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5 transition-colors duration-300">
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor} ${statusConfig.dotShadow} transition-all duration-300`} />
              {statusConfig.title}
            </span>
            <span className="text-[10.5px] font-medium text-zinc-400 mt-1 leading-tight">
              Privacy-first on-device analysis
            </span>
          </div>

          {/* Model status bar */}
          <div className="w-full">
            <div className={`h-1 w-full rounded-full bg-white/[0.04] overflow-hidden ${sysState === 'disconnected' || sysState === 'idle' ? 'hidden' : ''}`}>
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${statusConfig.barColor} w-full ${statusConfig.barOpacity} ${statusConfig.barAnim} transition-all duration-500`}
              />
            </div>
            <span className={`text-[10px] font-medium mt-1.5 block text-left transition-colors duration-300 ${sysState === 'disconnected' ? 'text-red-400/80' : sysState === 'paused' || sysState === 'initializing' ? 'text-amber-400/80' : 'text-zinc-500'}`}>
              {statusConfig.text}
            </span>
          </div>
        </div>

        {/* Sign Out Action */}
        <button
          onClick={() => {
            clearActiveSession();
            navigate('/login');
          }}
          className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-zinc-500 hover:text-red-400 transition-colors w-full text-left"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign out</span>
        </button>
      </div>

    </aside>
  );
};
