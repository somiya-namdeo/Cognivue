import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrivacyManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyManifestoModal: React.FC<PrivacyManifestoModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }}
          exit={{ opacity: 0, y: 15, scale: 0.98, transition: { duration: 0.3 } }}
          className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#03030b] p-8 shadow-2xl flex flex-col gap-6 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Cognivue Privacy Manifesto</h2>
            </div>
            <button 
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-8 text-left text-zinc-300 text-sm overflow-y-auto max-h-[60vh] pr-4 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scrollbar-track-transparent">
            
            <section className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-white">Local-first intelligence</h3>
              <p className="leading-relaxed">
                We believe cognitive data is deeply personal. Cognivue is architected to process all sensitive inputs—such as webcam frames—entirely within your browser using local machine learning models. Your raw video streams never leave your device.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-white">What Cognivue collects</h3>
              <ul className="flex flex-col gap-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Domain-level activity:</strong> The browser extension logs the root domains you visit (e.g., github.com) to categorize your focus context.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span><strong>Numerical telemetry:</strong> Derived cognitive metrics like focus scores, blink rates, and fatigue indices are processed and synced to provide your dashboard analytics.</span>
                </li>
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-white">What Cognivue never collects</h3>
              <ul className="flex flex-col gap-2 text-rose-200/80">
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                  <span><strong>Raw video:</strong> Webcam frames are processed instantly and discarded. They are never uploaded or stored.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                  <span><strong>Screenshots:</strong> We do not capture or record your screen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                  <span><strong>Keystrokes:</strong> We never track what you type.</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                  <span><strong>Page content:</strong> The extension does not read the text or content of the websites you visit.</span>
                </li>
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-white">Browser extension privacy</h3>
              <p className="leading-relaxed">
                The Cognivue Chrome extension operates with minimal permissions. It only observes active tab URLs to infer context. You can pause or disconnect the extension at any time directly from the extension popup.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-white">User control</h3>
              <p className="leading-relaxed">
                You own your data. You can disconnect the extension, pause monitoring, or permanently delete your account and all associated session data at any time from your settings.
              </p>
            </section>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end border-t border-white/10 pt-5 mt-2">
            <button 
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <SettingsIcon className="h-4 w-4" />
              Go to Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
