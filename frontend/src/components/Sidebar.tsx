import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  LayoutDashboard, 
  Activity, 
  Sparkles, 
  Clock, 
  Globe, 
  Settings, 
  LogOut 
} from 'lucide-react';

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
        <Link to="/" className="inline-flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <Brain className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
          </div>
          <span className="font-sans text-lg font-bold tracking-tight text-white select-none">Cognivue</span>
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
        <div className="rounded-2xl border border-white/[0.04] bg-[#03030b]/40 p-4 flex flex-col gap-3 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />
          
          <div className="flex flex-col gap-0.5 select-none text-left">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">System Status</span>
            <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              Local inference active
            </span>
            <span className="text-[10.5px] font-medium text-zinc-400 mt-1 leading-tight">
              Privacy-first on-device analysis
            </span>
          </div>

          {/* Model status bar */}
          <div className="w-full">
            <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{ width: '82%' }}
              />
            </div>
            <span className="text-[10px] font-medium text-zinc-500 mt-1.5 block text-left">
              Model confidence 82%
            </span>
          </div>
        </div>

        {/* Sign Out Action */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-zinc-500 hover:text-red-400 transition-colors w-full text-left"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign out</span>
        </button>
      </div>

    </aside>
  );
};
