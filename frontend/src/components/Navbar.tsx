import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-zinc-900 bg-darkBg/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <Brain className="h-4.5 w-4.5 text-cyan-400" />
              <div className="absolute inset-0 rounded-lg bg-cyan-400/10 blur-[4px] pointer-events-none" />
            </div>
            <span className="font-sans text-xl font-bold tracking-tight text-white select-none">
              Cognivue
            </span>
          </Link>

          {/* Center Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">
              How it works
            </a>
            <a href="#extension" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">
              Extension
            </a>
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">
              Sign in
            </Link>
            <Link 
              to="/signup" 
              className="relative inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] shadow-sm select-none"
            >
              Get started
            </Link>
          </div>

          {/* Hamburger Menu - Mobile */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-zinc-900 bg-darkBg/95 backdrop-blur-2xl">
          <div className="space-y-1 px-4 py-4 pb-6">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
            >
              How it works
            </a>
            <a
              href="#extension"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
            >
              Extension
            </a>
            <div className="my-4 h-[1px] bg-zinc-900" />
            <div className="flex flex-col gap-3 px-3">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center rounded-lg py-2.5 text-base font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="text-center rounded-lg bg-white py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-150 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
