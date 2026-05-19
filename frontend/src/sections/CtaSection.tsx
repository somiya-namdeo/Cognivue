import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const CtaSection = () => {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 z-10 border-t border-zinc-900/40 text-center overflow-hidden">
      
      {/* Premium, softer, larger ambient glow positioned behind the text and button */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-r from-cyan-500/[0.04] via-indigo-500/[0.04] to-violet-500/[0.04] blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        className="relative z-10 flex flex-col items-center max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        
        {/* Main Heading */}
        <h2 className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white select-none leading-tight">
          Train your focus. Protect your brain.
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-base leading-relaxed text-zinc-400 max-w-xl">
          Join thousands of students, engineers and researchers using Cognivue to do their deepest work without burning out.
        </p>

        {/* Single Button CTA */}
        <div className="mt-10 flex justify-center w-full">
          <Link
            to="/signup"
            className="glow-btn inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-4 text-sm font-semibold text-white transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:scale-[1.01] active:scale-[0.99] select-none"
          >
            Create free account
          </Link>
        </div>

      </motion.div>

    </section>
  );
};
