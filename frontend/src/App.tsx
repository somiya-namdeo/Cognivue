import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { SessionsPage } from './pages/SessionsPage';
import { ExtensionPage } from './pages/ExtensionPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
            className="fixed inset-0 z-50 bg-[#03030b] flex flex-col items-center justify-center select-none"
          >
            {/* Ambient Background Blur Blobs */}
            <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] bg-cyan-900/[0.04] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[40%] right-[30%] w-[350px] h-[350px] bg-violet-900/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col items-center gap-6 relative z-10">
              {/* Outer pulsing neon boundary */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    '0 0 20px rgba(6,182,212,0.1)',
                    '0 0 35px rgba(6,182,212,0.25)',
                    '0 0 20px rgba(6,182,212,0.1)'
                  ]
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400"
              >
                <Brain className="h-9 w-9 text-cyan-400 animate-pulse" />
              </motion.div>

              <div className="flex flex-col items-center gap-2">
                <motion.span 
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="font-sans text-xl font-bold tracking-[0.1em] text-white"
                >
                  Cognivue
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  className="font-mono text-[9px] font-bold tracking-[0.25em] text-cyan-400/80 uppercase"
                >
                  Local Inference Active
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/live-monitoring" element={<LiveMonitoringPage />} />
            <Route path="/ai-insights" element={<AIInsightsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/extension" element={<ExtensionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;
