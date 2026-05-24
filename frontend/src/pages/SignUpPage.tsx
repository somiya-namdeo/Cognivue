import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { signupUser, initUser } from '../services/api';

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const signupData = await signupUser(fullName, email, password);
      // Initialize user profile (ignore failures)
      try {
        await initUser(signupData.user_id);
      } catch (e) {
        console.warn('User init failed', e);
      }
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign up.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    'Real-time focus & fatigue scoring',
    'AI-personalised study plans',
    'Burnout risk early-warning',
    'Chrome extension included',
    'On-device, privacy-first inference'
  ];

  return (
    <div className="relative min-h-screen lg:h-screen w-full flex items-center justify-center bg-transparent text-zinc-400 overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-300 px-4 py-8 sm:px-6 lg:px-8">
      
      {/* ================= BACKGROUND SYSTEM ================= */}
      {/* 1. Base Grid Layer */}
      <div className="grid-background opacity-[0.03] pointer-events-none z-0" />

      {/* 2. Soft Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,#03030b_95%)] pointer-events-none z-0 opacity-90" />

      {/* 3. Left Side: Deep Navy / Soft Cyan-Blue glow */}
      <div className="absolute left-[5%] top-[10%] w-[600px] h-[500px] rounded-full bg-cyan-500/[0.045] blur-[130px] pointer-events-none z-0" />
      <div className="absolute left-0 inset-y-0 w-1/2 bg-gradient-to-tr from-[#06b6d4]/8 via-transparent to-transparent pointer-events-none z-0" />

      {/* 4. Right Side: Black-Purple / Violet glow */}
      <div className="absolute right-[5%] bottom-[10%] w-[600px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[140px] pointer-events-none z-0" />
      <div className="absolute right-0 inset-y-0 w-1/2 bg-gradient-to-bl from-[#8b5cf6]/6 via-transparent to-transparent pointer-events-none z-0" />

      {/* 5. Ambient Micro Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-violet-400/10"
            style={{
              left: `${20 + i * 13}%`,
              top: `${15 + (i % 3) * 28}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 11 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {/* ===================================================== */}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10 h-full lg:max-h-[600px]">
        
        {/* ================= LEFT SIDE: FORM ================= */}
        <motion.div 
          className="lg:col-span-7 flex flex-col justify-center text-left w-full max-w-[480px] mx-auto lg:max-w-none"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Logo & Back Link Row */}
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center group hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Cognivue Logo" className="h-14 w-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]" />
            </Link>
            <Link to="/" className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-cyan-400 transition-colors select-none">
              ← Back to home
            </Link>
          </div>

          {/* Heading */}
          <h2 className="mt-6 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Create your account
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
            Start your cognitive intelligence journey in under a minute.
          </p>

          {/* Form */}
          <form className="mt-6 space-y-3.5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-wider text-zinc-450 uppercase select-none">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Reddy"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-zinc-550 focus:outline-none focus:ring-1.5 focus:ring-cyan-500/25 focus:border-cyan-400/45 transition-all font-medium disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-wider text-zinc-450 uppercase select-none">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@cognivue.ai"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-zinc-550 focus:outline-none focus:ring-1.5 focus:ring-cyan-500/25 focus:border-cyan-400/45 transition-all font-medium disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-wider text-zinc-450 uppercase select-none">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-zinc-555 focus:outline-none focus:ring-1.5 focus:ring-cyan-500/25 focus:border-cyan-400/45 transition-all font-medium disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-cyan-400 focus:outline-none transition-colors select-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-red-500/20 bg-red-950/20 text-xs font-semibold text-red-400 select-none text-left"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs font-semibold text-emerald-400 select-none text-left"
              >
                {success}
              </motion.div>
            )}

            {/* Terms checkbox */}
            <div className="flex items-start text-xs pt-0.5 select-none">
              <label className="flex items-start gap-2 cursor-pointer font-medium leading-relaxed text-zinc-400 hover:text-zinc-355">
                <input
                  type="checkbox"
                  required
                  disabled={isLoading}
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/10 bg-white/[0.02] text-cyan-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer shrink-0"
                />
                <span>
                  I agree to the <a href="#terms" className="font-semibold text-cyan-400 hover:underline">Terms of Service</a> and the <a href="#privacy" className="font-semibold text-cyan-400 hover:underline">privacy policy</a>.
                </span>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading || !agreeTerms}
              className="glow-btn w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-[0_0_12px_rgba(6,182,212,0.08)] hover:shadow-[0_0_16px_rgba(6,182,212,0.15)] hover:scale-[1.005] active:scale-[0.995] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Redirect */}
          <p className="mt-6 text-center lg:text-left text-xs sm:text-sm font-medium text-zinc-400 select-none">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-305 transition-colors">
              Sign in
            </Link>
          </p>

        </motion.div>

        {/* ================= RIGHT SIDE: BENEFITS CARD ================= */}
        <motion.div 
          className="lg:col-span-5 flex justify-center lg:justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        >
          {/* Glass Card */}
          <div className="relative w-full max-w-[380px] rounded-2xl border border-white/10 bg-slate-950/20 p-6 sm:p-7 backdrop-blur-md shadow-2xl select-none text-left overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/2 via-cyan-500/2 to-transparent pointer-events-none" />

            {/* Label */}
            <span className="text-[9px] font-extrabold tracking-widest text-violet-400 uppercase block">
              What you'll unlock
            </span>

            {/* Title */}
            <h3 className="mt-1.5 text-xl font-extrabold text-white tracking-tight leading-tight">
              A second brain for your focus.
            </h3>

            {/* Bullet list */}
            <ul className="mt-5 flex flex-col gap-3.5">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-xs sm:text-sm font-medium text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)] shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

          </div>
        </motion.div>

      </div>
    </div>
  );
};
