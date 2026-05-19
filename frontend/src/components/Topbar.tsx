import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
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

        <div className="relative w-full group hidden sm:block">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Search sessions, insights..."
            className="w-full pl-10 pr-12 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white placeholder:text-zinc-550 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 focus:border-cyan-400/30 transition-all font-medium"
          />
          <div className="absolute right-3 top-2.5 flex items-center gap-0.5 select-none pointer-events-none px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-[9px] font-bold text-zinc-500 tracking-wider">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Profile controls on the Right */}
      <div className="flex items-center gap-4">
        
        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl border border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/10 hover:bg-white/[0.04] transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-white/[0.04]">
          {/* Avatar Container */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300">
            AR
          </div>
          
          {/* Text Labels */}
          <div className="hidden md:flex flex-col text-left select-none">
            <span className="text-xs font-semibold text-zinc-100">Aarav Reddy</span>
          </div>
        </div>

      </div>

    </header>
  );
};
