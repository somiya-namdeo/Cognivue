import { motion } from 'framer-motion';
import { Eye, Brain, TrendingUp } from 'lucide-react';

export const HowItWorksSection = () => {
  const steps = [
    {
      number: '1',
      title: 'Capture',
      description: 'Webcam + browser activity stream analyzed via local inference.',
    },
    {
      number: '2',
      title: 'Reason',
      description: 'On-device transformers infer attention, fatigue and load in real time.',
    },
    {
      number: '3',
      title: 'Respond',
      description: 'Personalised nudges adapt your sessions, breaks and study plan.',
    },
  ];

  return (
    <section id="how-it-works" className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 z-10 border-t border-zinc-900/40">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-10 w-[450px] h-[450px] bg-cyan-900/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-violet-900/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:items-center">
        
        {/* Left Side Content & Steps */}
        <div className="lg:col-span-5 text-left flex flex-col items-start">
          <span className="text-[11px] font-extrabold tracking-wider text-cyan-400 uppercase">
            How It Works
          </span>
          <h2 className="mt-4 font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white select-none leading-tight">
            Three signals, one intelligence layer.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Cognivue continuously fuses vision, language and behaviour to model your cognitive state — second by second.
          </p>

          {/* Steps List */}
          <div className="mt-12 space-y-8 w-full">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
              >
                {/* Number Badge */}
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-xs font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.03)]">
                  {step.number}
                </div>
                
                {/* Text Content */}
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side Neural Fusion output panel */}
        <motion.div 
          className="lg:col-span-7 flex justify-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Main Fusion Panel Wrapper */}
          <div className="relative w-full max-w-[620px] rounded-2xl glass-panel p-6 shadow-2xl border border-white/5 bg-slate-950/20 select-none">
            
            {/* Top row - Input Cards (3 cards) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              
              {/* Vision Card */}
              <div className="rounded-xl border border-white/[0.02] bg-white/[0.01] p-4 flex flex-col items-start gap-3 hover:border-cyan-500/10 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Eye className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block">Vision</span>
                  <span className="mt-1 text-xs font-semibold text-zinc-300 block">Gaze · Blink · Posture</span>
                </div>
              </div>

              {/* Language Card */}
              <div className="rounded-xl border border-white/[0.02] bg-white/[0.01] p-4 flex flex-col items-start gap-3 hover:border-violet-500/10 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <Brain className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block">Language</span>
                  <span className="mt-1 text-xs font-semibold text-zinc-300 block">Topic · Context · Effort</span>
                </div>
              </div>

              {/* Behaviour Card */}
              <div className="rounded-xl border border-white/[0.02] bg-white/[0.01] p-4 flex flex-col items-start gap-3 hover:border-teal-500/10 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block">Behaviour</span>
                  <span className="mt-1 text-xs font-semibold text-zinc-300 block">Tabs · Inputs · Cadence</span>
                </div>
              </div>

            </div>

            {/* Glowing animated line separator */}
            <div className="relative my-8 h-[1px] w-full bg-zinc-900">
              <div className="absolute inset-y-0 left-1/4 right-1/4 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-[1px]" />
            </div>

            {/* Local Inference Output Card */}
            <div className="rounded-xl border border-white/[0.02] bg-white/[0.02] p-6 text-left relative overflow-hidden">
              {/* Internal glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/2 via-violet-500/2 to-transparent pointer-events-none" />

              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase block mb-6">Local Inference Output</span>
              
              <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
                
                {/* FOCUS */}
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-white tracking-tight">92</span>
                  <span className="mt-1 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Focus</span>
                </div>

                {/* LOAD */}
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-white tracking-tight">68%</span>
                  <span className="mt-1 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Load</span>
                </div>

                {/* FATIGUE */}
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">Low</span>
                  <span className="mt-1 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Fatigue</span>
                </div>

                {/* BURNOUT */}
                <div className="flex flex-col">
                  <span className="text-3xl font-extrabold text-white tracking-tight">14%</span>
                  <span className="mt-1 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Burnout</span>
                </div>

              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};
