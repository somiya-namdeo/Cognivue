import { Navbar } from '../components/Navbar';
import { ParticleBackground } from '../components/ParticleBackground';
import { HeroSection } from '../sections/HeroSection';
import { CapabilitiesSection } from '../sections/CapabilitiesSection';
import { HowItWorksSection } from '../sections/HowItWorksSection';
import { ExtensionSection } from '../sections/ExtensionSection';
import { CtaSection } from '../sections/CtaSection';

export const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-slate-950 text-zinc-400 flex flex-col justify-between overflow-x-hidden select-none selection:bg-cyan-500/20 selection:text-cyan-300 w-full">
      
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
      <footer className="relative border-t border-white/10 bg-slate-900/60 backdrop-blur-md py-10 z-10 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <img src="/logo.png" alt="Cognivue Logo" className="h-6 w-auto drop-shadow-[0_0_10px_rgba(6,182,212,0.15)] opacity-80 hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-zinc-650 font-medium">
            © {new Date().getFullYear()} Cognivue. All data processed locally on-device. Privacy-first telemetry.
          </p>
        </div>
      </footer>

    </div>
  );
};
