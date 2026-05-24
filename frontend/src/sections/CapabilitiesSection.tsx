import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Eye, Activity, Brain, Sparkles, Puzzle, ShieldCheck } from 'lucide-react';

interface CapabilityCardProps {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  delay: number;
}

const CapabilityCard = ({ 
  icon, 
  iconBg, 
  iconColor, 
  title, 
  description,
  delay 
}: CapabilityCardProps) => {
  return (
    <motion.div
      className="bg-slate-950/20 flex flex-col justify-between items-start rounded-2xl p-6 border border-white/[0.03] bg-slate-950/10 shadow-lg hover:-translate-y-1 hover:border-cyan-500/20 hover:bg-slate-900/15 hover:shadow-[0_12px_30px_rgba(6,182,212,0.03)] transition-all duration-300"
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-4">
        {/* Glow-container for Icon */}
        <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} border border-white/5`}>
          <div className={`absolute inset-0 rounded-xl ${iconColor}/15 blur-[4px] pointer-events-none`} />
          <div className={iconColor}>
            {icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white tracking-tight">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm leading-relaxed text-zinc-300 font-medium">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export const CapabilitiesSection = () => {
  const capabilities = [
    {
      icon: <Eye className="h-5 w-5" />,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      title: 'Real-time Focus Tracking',
      description: 'Computer-vision gaze and attention modeling at 30fps, with sub second drift detection.',
      delay: 0.05,
    },
    {
      icon: <Activity className="h-5 w-5" />,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      title: 'Fatigue Detection',
      description: 'Blink rate, microsleep events and posture cues fused into a single fatigue index.',
      delay: 0.1,
    },
    {
      icon: <Brain className="h-5 w-5" />,
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-400',
      title: 'Cognitive Load Analysis',
      description: 'NLP on your task context estimates mental effort and flags overload thresholds.',
      delay: 0.15,
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-400',
      title: 'AI Recommendations',
      description: 'Personalised break, study and recovery plans generated from your patterns.',
      delay: 0.2,
    },
    {
      icon: <Puzzle className="h-5 w-5" />,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      title: 'Chrome Extension',
      description: 'Lightweight popup that monitors tabs and surfaces distractions in real time.',
      delay: 0.25,
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      title: 'Privacy-first Monitoring',
      description: 'All vision inference runs locally. Nothing leaves your device by default.',
      delay: 0.3,
    },
  ];

  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 z-10 border-t border-zinc-900/40">
      
      {/* Background radial soft light overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[130px] rounded-full pointer-events-none" />

      {/* Header Info */}
      <div className="max-w-3xl text-left mb-16">
        <span className="text-[11px] font-extrabold tracking-wider text-cyan-400 uppercase">
          Capabilities
        </span>
        <h2 className="mt-4 font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white select-none">
          An AI command center for your mind.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Cognivue fuses computer vision, NLP and behavioural analytics into a single intelligence layer that adapts to how you think and work.
        </p>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((cap, index) => (
          <CapabilityCard
            key={index}
            icon={cap.icon}
            iconBg={cap.iconBg}
            iconColor={cap.iconColor}
            title={cap.title}
            description={cap.description}
            delay={cap.delay}
          />
        ))}
      </div>

    </section>
  );
};
