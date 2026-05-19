import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeItem: string;
  setActiveItem: (item: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children,
  activeItem,
  setActiveItem
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-transparent text-zinc-300 overflow-x-hidden flex select-none">
      
      {/* ================= BACKGROUND SYSTEM ================= */}
      {/* 1. Base Grid Overlay */}
      <div className="grid-background opacity-[0.03] pointer-events-none z-0" />

      {/* 2. Soft Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,#03030b_95%)] pointer-events-none z-0 opacity-80" />

      {/* 3. Cyan Blur Glow Blob (Left Side) */}
      <div className="absolute left-[-10%] top-[15%] w-[800px] h-[600px] rounded-full bg-cyan-500/[0.045] blur-[130px] pointer-events-none z-0" />
      <div className="absolute left-0 inset-y-0 w-1/3 bg-gradient-to-tr from-[#06b6d4]/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* 4. Violet Blur Glow Blob (Right Side) */}
      <div className="absolute right-[-10%] bottom-[20%] w-[800px] h-[600px] rounded-full bg-violet-500/[0.04] blur-[140px] pointer-events-none z-0" />
      <div className="absolute right-0 inset-y-0 w-1/3 bg-gradient-to-bl from-[#8b5cf6]/8 via-transparent to-transparent pointer-events-none z-0" />

      {/* 5. Sparsely Placed Ambient Floating Particles (Framer Motion) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute h-1 rounded-full ${i % 2 === 0 ? 'bg-cyan-400/10' : 'bg-violet-400/8'}`}
            style={{
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 3) * 26}%`,
              width: i % 2 === 0 ? '3px' : '4px',
              height: i % 2 === 0 ? '3px' : '4px',
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.08, 0.25, 0.08],
            }}
            transition={{
              duration: 12 + i * 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {/* ===================================================== */}

      {/* FIXED SIDEBAR (lg screen sizes and above) */}
      <Sidebar 
        activeItem={activeItem} 
        setActiveItem={setActiveItem} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* MAIN CONTAINER PANEL */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 relative z-10">
        
        {/* TOP HEADER navigation bar */}
        <Topbar onMenuToggle={() => setIsSidebarOpen(true)} />

        {/* WORKSPACE AREA */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-6 sm:gap-8">
          {children}
        </main>

      </div>

    </div>
  );
};
