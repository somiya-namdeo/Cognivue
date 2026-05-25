import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  Download, 
  Code, 
  Eye, 
  Zap, 
  Coffee, 
  ShieldAlert, 
  Pause, 
  Play,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { getLocalSession, getExtensionActivity } from '../services/api';
import type { ExtensionActivityResponse } from '../services/api';
import { PrivacyManifestoModal } from '../components/PrivacyManifestoModal';
import { pushNotification } from '../services/notifications';
import { determineExtensionStatus, getReconnectingStatus, recordSuccess, recordFailure, shouldDisconnect } from '../utils/extensionStatus';
import type { ExtensionState } from '../utils/extensionStatus';

export const ExtensionPage: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Extension');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const session = getLocalSession();
  const userId = session.userId;
  
  const [latestActivity, setLatestActivity] = React.useState<ExtensionActivityResponse | null>(null);
  const [extStatus, setExtStatus] = useState<string>('waiting');
  const [mismatchWarning, setMismatchWarning] = useState(false);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'COGNIVUE_EXTENSION_LINKED_USER') {
        const extUserId = event.data.userId;
        if (userId && extUserId && extUserId !== userId) {
          setMismatchWarning(true);
        } else {
          setMismatchWarning(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userId]);

  const lastDataRef = React.useRef<ExtensionActivityResponse[] | null>(null);
  // Overlap guard: skip next interval if a request is already running
  const isFetchingRef = useRef(false);
  // Track last resolved state for sticky fallback on errors
  const lastExtStateRef = useRef<ExtensionState>('disconnected');

  React.useEffect(() => {
    if (!userId) return;

    const checkStatus = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const data = await getExtensionActivity(userId);
        lastDataRef.current = data;
        if (data && data.length > 0) {
          setLatestActivity(data[0]);
          const resolved = determineExtensionStatus(data);
          lastExtStateRef.current = resolved.state;
          recordSuccess();
          setExtStatus(resolved.state);
          setFetchError(null);
          
          // Notify if telemetry has gone stale
          if (resolved.state === 'disconnected') {
            const rawTime = data[0].recorded_at || data[0].created_at || data[0].timestamp || "";
            const lastSync = new Date(rawTime).getTime();
            const diffMins = (Date.now() - lastSync) / 60000;
            pushNotification(
              'Extension Offline',
              `No telemetry received for ${Math.round(diffMins)} minutes. Ensure the browser extension is active.`,
              'warning',
              '/extension'
            );
          }
        } else {
          setExtStatus('disconnected');
        }
      } catch {
        // Transient failure — use sticky cache, show reconnecting not disconnected
        recordFailure();
        if (lastDataRef.current && lastDataRef.current.length > 0) {
          const data = lastDataRef.current;
          setLatestActivity(data[0]);
          const resolved = determineExtensionStatus(data);
          lastExtStateRef.current = resolved.state;
          setExtStatus(resolved.state);
        } else {
          const fallback = shouldDisconnect()
            ? { state: 'disconnected' as ExtensionState, detail: 'Extension not reachable.' }
            : getReconnectingStatus(lastExtStateRef.current);
          setExtStatus(fallback.state);
          if (fallback.state === 'disconnected') {
            setFetchError('Could not connect to backend to check extension status.');
          }
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const demoConnectKey = userId ? btoa(userId) : '';

  const copyConnectKey = () => {
    if (!demoConnectKey) return;
    navigator.clipboard.writeText(demoConnectKey);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        ease: 'easeOut',
        duration: 0.5
      }
    }
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-cyan-500/20 bg-cyan-950/80 px-4 py-3 text-sm font-semibold text-cyan-400 backdrop-blur-md shadow-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Action completed!</span>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-10 sm:gap-12 text-left"
      >
        {/* ================= TOP TITLE HEADER ================= */}
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none text-white select-none antialiased">
            Chrome Extension
          </h2>
          <p className="text-[15px] leading-[1.6] text-white/70 font-medium mt-2 antialiased">
            Your cognitive coach, embedded in the browser.
          </p>
        </div>

        {/* ================= TWO COLUMNS HERO GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-center">
          
          {/* Left Column: SaaS copy and specs */}
          <div className="lg:col-span-5 flex flex-col items-start text-left select-none">
            <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-400 font-bold block mb-3">
              COGNIVUE · CHROME
            </span>
            <h3 className="text-[32px] md:text-[36px] font-semibold tracking-tight leading-tight text-white mb-4 antialiased">
              A focus HUD, one click away.
            </h3>
            <p className="text-[15px] leading-[1.7] text-white/70 font-normal mb-8 antialiased">
              The Cognivue extension lives in your toolbar and keeps your cognitive state in sight while you work — without ever sending raw vision data to the cloud.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <a 
                href="/downloads/cognivue-extension.zip"
                download="cognivue-extension.zip"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-xs font-bold text-slate-950 hover:bg-white/90 hover:shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download Extension ZIP</span>
              </a>
              <a href="#installation-guide" className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/[0.02] hover:border-white/20 transition-all">
                <Code className="h-4 w-4 text-zinc-400" />
                <span>Installation Guide</span>
              </a>
            </div>

            {/* Features Bullet List */}
            <div className="flex flex-col gap-5 w-full">
              {[
                { label: 'Live focus score on the toolbar badge', icon: Eye, bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
                { label: 'Distraction alerts when high-risk tabs open', icon: Zap, bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
                { label: 'Quick-break reminders based on fatigue', icon: Coffee, bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                { label: '100% local inference — no raw data leaves your device', icon: ShieldAlert, bg: 'bg-rose-500/10 border-rose-500/20 text-rose-455' }
              ].map((feature, idx) => {
                const Icon = feature.icon;

                return (
                  <div key={idx} className="flex items-center gap-4.5 text-left">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${feature.bg}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[14.5px] leading-normal text-white/80 font-medium antialiased">
                      {feature.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: High Fidelity Browser Window Mockup */}
          <div className="lg:col-span-7 w-full flex justify-center">
            
            {/* Realistic Browser Window container */}
            <div className="w-full max-w-[620px] rounded-2xl border border-white/10 bg-white/[0.02] p-4.5 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden select-none">
              <div className="absolute inset-0 grid-background opacity-[0.015] pointer-events-none" />
              
              {/* Browser bar top */}
              <div className="flex items-center justify-between pb-4.5 border-b border-white/10 relative z-10">
                {/* 3 Mac traffic light window buttons */}
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>
                
                {/* URL box Address bar */}
                <div className="flex-1 max-w-[340px] mx-4 rounded-lg bg-white/[0.03] border border-white/10 px-3 py-1 flex items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-zinc-400 tracking-wide font-mono">docs.cognivue.ai/research</span>
                </div>


                <div className="h-6 w-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Clock className="h-3 w-3" />
                </div>
              </div>

              {/* Browser viewport workspace */}
              <div className="pt-6 pb-2 min-h-[360px] flex items-center justify-center relative z-10">
                
                {/* Visual grid in web view */}
                <div className="absolute inset-0 grid-background opacity-[0.02] pointer-events-none" />

                {/* Ambient glow behind floating extension */}
                <div className="absolute top-[40%] right-[30%] w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* THE POPUP ELEMENT: Highly premium layout styling */}
                <div className="w-full max-w-[320px] rounded-xl border border-white/10 bg-[#05050f]/90 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-left flex flex-col gap-4 relative">
                  
                  {/* Logo + Version */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img src="/logo.png" alt="Cognivue Logo" className="h-6 w-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500 font-mono">v2.4.1</span>
                  </div>

                  {/* Main Focus Score meter card */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.01] p-3.5 flex items-center justify-between">
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-white/45 block mb-0.5">Current focus score</span>
                      <span className="text-[28px] font-bold text-white leading-none antialiased">92</span>
                      <span className="text-[10px] font-bold text-zinc-500 block mt-1.5 leading-none">Deep focus · 42m sustained</span>
                    </div>

                    {/* Glowing circular active scan eye icon */}
                    <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 relative">
                      <span className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping opacity-60" />
                      <Eye className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  {/* Play/Pause Button */}
                  <button 
                    onClick={() => {
                      const next = !isPaused;
                      setIsPaused(next);
                      if (next) {
                        pushNotification(
                          'Telemetry Paused',
                          'Browser activity monitoring has been paused. Resume anytime from the Extension page.',
                          'info',
                          '/extension'
                        );
                      } else {
                        pushNotification(
                          'Telemetry Resumed',
                          'Browser activity monitoring is active again. Focus tracking is now recording.',
                          'success',
                          '/extension'
                        );
                      }
                    }}
                    className={`w-full py-2.5 rounded-lg border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      isPaused 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                        : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume focus session</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause focus session</span>
                      </>
                    )}
                  </button>

                  {/* Active tab */}
                  <div className="rounded-lg bg-white/[0.01] border border-white/[0.03] p-3 flex flex-col text-left">
                    <span className="text-[8px] uppercase tracking-[0.15em] text-white/40 block mb-1">Active tab</span>
                    <span className="text-xs font-semibold text-white truncate">docs.cognivue.ai - Research</span>
                    <span className="text-[10px] font-bold text-emerald-400 block mt-1 leading-none">
                      Productivity - matched today's goal
                    </span>
                  </div>

                  {/* Warning Notification banner */}
                  <div className="rounded-lg bg-amber-500/[0.02] border border-amber-500/20 p-3 flex flex-col text-left">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Zap className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Distraction alert</span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 mt-1 leading-snug">
                      youtube.com opened in background tab.
                    </span>

                    {/* Quick-action buttons */}
                    <div className="flex items-center gap-2 mt-2.5 select-none">
                      <button className="px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-[9px] font-bold text-zinc-400 hover:text-white transition-all">
                        Snooze
                      </button>
                      <button className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-455 hover:bg-rose-500/15 transition-all">
                        Close tab
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ================= EXTENSION SETUP SECTION ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-4">
          
          {/* Installation Steps */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-6 backdrop-blur-md flex flex-col gap-4 text-left">
            <h4 className="text-lg font-bold text-white mb-2">Manual Installation</h4>
            <ol className="list-decimal list-inside text-sm text-zinc-400 space-y-3 font-medium">
              <li>Open Chrome and navigate to <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">chrome://extensions</code></li>
              <li>Toggle <strong>Developer mode</strong> ON in the top right corner.</li>
              <li>Click <strong>Load unpacked</strong> and select the <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">extension</code> folder from the project source.</li>
              <li>Pin the Cognivue extension to your toolbar.</li>
            </ol>
          </div>

          {/* Connection Status & Key */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-6 backdrop-blur-md flex flex-col gap-4 text-left">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
              <span>Extension Connection</span>
              {extStatus === 'connected' ? (
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">Connected</span>
              ) : extStatus === 'paused' ? (
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">Paused</span>
              ) : extStatus === 'disconnected' ? (
                <span className="text-[10px] uppercase font-bold tracking-widest text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md">Disconnected</span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 bg-white/5 border border-white/10 px-2 py-1 rounded-md">Waiting for connection</span>
              )}
            </h4>
            
            {fetchError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 mb-2">
                <p className="text-sm font-semibold text-rose-400">
                  {fetchError}
                </p>
              </div>
            )}
            
            {mismatchWarning && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 mb-2">
                <p className="text-sm font-semibold text-amber-400">
                  Extension is linked to a different account. Reconnect using the new key.
                </p>
              </div>
            )}

            {userId ? (
              <>
                <p className="text-sm text-zinc-400 leading-relaxed mb-1">
                  To link the extension to your account, click the extension icon and paste your <strong>local demo connection key</strong>:
                </p>

                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={demoConnectKey} 
                    className="flex-1 bg-black/40 border border-white/10 text-cyan-300 font-mono text-xs p-2.5 rounded-lg focus:outline-none"
                  />
                  <button onClick={copyConnectKey} className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all">
                    Copy
                  </button>
                </div>
                
                <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                  Linked User ID: <span className="text-cyan-400">{userId.substring(0, 8)}...</span>
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 mt-2">
                <p className="text-sm font-semibold text-rose-400">
                  Login required to generate extension connect key.
                </p>
              </div>
            )}

            {latestActivity && (
              <div className="mt-2 text-xs text-zinc-400">
                Latest active domain: <strong className="text-white">{latestActivity.domain}</strong> <br/>
                Last synced: <span className="text-white opacity-80">{new Date(latestActivity.recorded_at).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= INSTALLATION GUIDE SECTION ================= */}
        <div id="installation-guide" className="rounded-2xl border border-white/10 bg-slate-950/20 p-6 sm:p-8 backdrop-blur-md flex flex-col gap-6 text-left mt-4 select-text">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Code className="h-5 w-5 text-cyan-400" />
              Installation Guide
            </h3>
            <p className="text-sm text-white/70 font-medium">
              Chrome Web Store publishing planned for production release. For now, install it locally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">1</div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">Download & Extract</span>
                  <p className="text-xs text-white/60 leading-relaxed">Click the download button above to get the ZIP. Extract it to a folder on your computer.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">2</div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">Open Chrome Extensions</span>
                  <p className="text-xs text-white/60 leading-relaxed">In your browser, navigate to <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono">chrome://extensions</code></p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">3</div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">Enable Developer Mode</span>
                  <p className="text-xs text-white/60 leading-relaxed">Toggle the "Developer mode" switch in the top right corner.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">4</div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">Load Unpacked</span>
                  <p className="text-xs text-white/60 leading-relaxed">Click "Load unpacked" and select your extracted <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono">cognivue-extension</code> folder. Then pin it to your toolbar!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM PRIVACY ASSURANCE SECTION ================= */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5 select-none hover:border-white/10 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.3)] mt-4">
          
          <div className="flex items-center gap-5 text-left w-full sm:w-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-bold block mb-0.5">
                Privacy guaranteed
              </span>
              <span className="text-[14.5px] font-medium text-white/80 antialiased leading-normal">
                All telemetry data is processed locally on your machine. We never track keys, keystrokes, or display screens.
              </span>
            </div>
          </div>

          <button 
            onClick={() => setShowPrivacyModal(true)}
            className="rounded-xl border border-white/10 hover:border-white/20 px-5 py-3 text-[13px] font-semibold text-white hover:bg-white/[0.04] transition-all duration-300 shrink-0 w-full sm:w-auto justify-center"
          >
            Read privacy manifesto
          </button>

        </div>

      </motion.div>

      {/* Privacy Manifesto Modal */}
      <PrivacyManifestoModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />

    </DashboardLayout>
  );
};
