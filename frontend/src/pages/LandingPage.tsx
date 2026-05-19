import { Navbar } from '../components/Navbar';
import { ParticleBackground } from '../components/ParticleBackground';
import { HeroSection } from '../sections/HeroSection';
import { CapabilitiesSection } from '../sections/CapabilitiesSection';
import { HowItWorksSection } from '../sections/HowItWorksSection';
import { ExtensionSection } from '../sections/ExtensionSection';
import { CtaSection } from '../sections/CtaSection';
import { Brain } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-darkBg text-zinc-300 flex flex-col justify-between overflow-x-hidden select-none selection:bg-cyan-500/20 selection:text-cyan-300 w-full">
      
      {/* Global background grid & floating particle field */}
      <ParticleBackground />

      {/* Sticky Glassmorphic Navbar */}
      <Navbar />

      {/* Main Sections */}
      <main className="relative flex-grow">
        <HeroSection />
        <CapabilitiesSection />
        <HowItWorksSection />
        <ExtensionSection />
        <CtaSection />
      </main>

      {/* Telemetry Footer */}
      <footer className="relative border-t border-zinc-900 bg-darkBg/80 backdrop-blur-md py-10 z-10 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
              <Brain className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <span className="font-sans text-sm font-semibold tracking-tight text-white">
              Cognivue
            </span>
          </div>
          <p className="text-xs text-zinc-650 font-medium">
            © {new Date().getFullYear()} Cognivue. All data processed locally on-device. Privacy-first telemetry.
          </p>
        </div>
      </footer>

    </div>
  );
};
