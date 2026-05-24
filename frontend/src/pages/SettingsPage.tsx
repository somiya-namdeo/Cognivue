import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  User,
  Camera, 
  ShieldAlert, 
  Bell, 
  Globe, 
  Trash2,
  Sparkles,
  X,
  Check
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { getExtensionActivity, clearActiveSession, deleteUserAccount } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';

export const SettingsPage: React.FC = () => {
  const profile = useProfile();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Settings');
  
  // States
  const [displayName, setDisplayName] = useState(() => profile.displayName);
  const [webcamPermStatus, setWebcamPermStatus] = useState<string>('Unknown');
  const [shareData, setShareData] = useState(() => localStorage.getItem('share_research_data') === 'true');
  const [notifications, setNotifications] = useState(() => localStorage.getItem('coach_notifications') !== 'false');
  

  
  const [extensionStatus, setExtensionStatus] = useState({ state: 'Checking...', detail: '' });

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Toast
  const [showNotification, setShowNotification] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  useEffect(() => {
    // Check Webcam
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as any }).then((status) => {
        setWebcamPermStatus(status.state);
        status.onchange = () => setWebcamPermStatus(status.state);
      }).catch(() => setWebcamPermStatus('Unsupported'));
    }

    // Check Extension Sync
    const checkExt = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return setExtensionStatus({ state: 'Not connected', detail: 'No user ID' });
        
        const data = await getExtensionActivity(userId);
        if (data && data.length > 0) {
          const latest = data[0];
          const lastSync = new Date(latest.recorded_at).getTime();
          const now = Date.now();
          const diffMins = (now - lastSync) / 60000;
          
          if (diffMins < 2) {
            setExtensionStatus({ state: 'Connected', detail: `Active on ${latest.domain}` });
          } else {
            setExtensionStatus({ state: 'Paused', detail: `Last sync ${Math.round(diffMins)}m ago` });
          }
        } else {
          setExtensionStatus({ state: 'Not connected', detail: 'No recent telemetry found.' });
        }
      } catch {
        setExtensionStatus({ state: 'Not connected', detail: 'Could not fetch extension data.' });
      }
    };
    checkExt();
  }, []);

  const handleSaveProfile = () => {
    const userId = localStorage.getItem('user_id') || 'default';
    const profileKey = `cognivue_profile_${userId}`;
    localStorage.setItem(profileKey, JSON.stringify({ displayName }));
    
    triggerToast('Profile changes saved successfully!');
    setShowEditModal(false);
    window.dispatchEvent(new Event('profile_updated'));
  };

  useEffect(() => {
    localStorage.setItem('share_research_data', shareData.toString());
  }, [shareData]);

  useEffect(() => {
    localStorage.setItem('coach_notifications', notifications.toString());
  }, [notifications]);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText === 'DELETE' && !isDeleting) {
      try {
        setIsDeleting(true);
        const userId = localStorage.getItem('user_id');
        if (userId) {
          await deleteUserAccount(userId);
          localStorage.removeItem(`cognivue_profile_${userId}`);
        }
        clearActiveSession();
        navigate('/login');
      } catch (e) {
        setIsDeleting(false);
        triggerToast('Failed to delete account. Please try again.');
        console.error(e);
      }
    }
  };

  return (
    <DashboardLayout activeItem={activeItem} setActiveItem={setActiveItem}>
      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl border border-cyan-500/20 bg-[#03030b]/90 px-4 py-3 text-sm font-semibold text-cyan-400 backdrop-blur-md shadow-lg flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8 text-left text-white">
        {/* ================= TOP TITLE SECTION ================= */}
        <div className="flex flex-col text-left">
          <h2 className="font-sans text-[40px] font-bold tracking-tight leading-none select-none antialiased text-white">
            Profile & Settings
          </h2>
          <p className="text-[15px] leading-[1.6] text-zinc-500 font-medium mt-2 antialiased">
            Manage your account, privacy and device integrations.
          </p>
        </div>

        {/* ================= MAIN CONFIGURATION GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
          
          {/* ================= LEFT COLUMN: Profile & Theme ================= */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Card 1: User Profile details card */}
            <div className="bg-slate-950/20 rounded-2xl p-6">
              <div className="flex items-center gap-4.5 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-[22px] font-bold tracking-tight shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  {profile.initials}
                </div>
                <div className="flex flex-col text-left">
                  <h4 className="text-[20px] font-semibold text-white tracking-tight leading-none">{profile.displayName}</h4>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-slate-950/20">
                  <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="text-[14.5px] font-medium text-zinc-400 truncate">{profile.email}</span>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-slate-950/20">
                  <User className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="text-[14.5px] font-medium text-zinc-400 truncate">{profile.displayName}</span>
                </div>

                <button 
                  onClick={() => setShowEditModal(true)}
                  className="w-full py-2.5 rounded-xl bg-text-primary/5 hover:bg-text-primary/10 border border-white/10 text-xs font-bold text-white transition-all mt-2"
                >
                  Edit profile
                </button>
              </div>
            </div>

            {/* Card 2: Danger Zone */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 text-left">
              <div className="mb-5">
                <span className="text-[11px] uppercase tracking-[0.18em] text-rose-500 font-bold block mb-1">Danger Zone</span>
                <h4 className="text-[18px] font-semibold text-rose-500 tracking-tight">Delete account.</h4>
                <p className="text-xs text-rose-500/70 mt-1">Permanently remove your data from Cognivue.</p>
              </div>

              <div 
                onClick={() => setShowDeleteModal(true)}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 backdrop-blur-md flex items-center gap-4 hover:bg-rose-500/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 group-hover:text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-rose-500 group-hover:text-rose-400 transition-colors">Delete my account</span>
                </div>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: Privacy Configs & Telemetries ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Privacy Card options panel */}
            <div className="bg-slate-950/20 rounded-2xl p-6">
              <div className="mb-6 text-left border-b border-white/10 pb-4">
                <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 block mb-1">Privacy & devices</span>
                <h4 className="text-[20px] font-semibold text-white tracking-tight">All vision inference runs locally.</h4>
              </div>

              <div className="flex flex-col">
                {/* webcam permission */}
                <div className="py-5 border-b border-white/10 flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Camera className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Webcam Status</span>
                      <span className="text-xs font-medium text-zinc-500 mt-1 leading-normal">
                        Permission: <strong className="text-zinc-400">{webcamPermStatus}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* share telemetry */}
                <div className="py-5 border-b border-white/10 flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <ShieldAlert className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Share anonymous research data</span>
                      <span className="text-xs font-medium text-zinc-500 mt-1 leading-normal">
                        Optional. Helps improve future cognitive models using anonymised numerical telemetry only.
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShareData(!shareData)}
                    className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${shareData ? 'bg-cyan-500' : 'bg-slate-950 border border-white/10'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${shareData ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* coach notifications */}
                <div className="py-5 border-b border-white/10 flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Coach notifications</span>
                      <span className="text-xs font-medium text-zinc-500 mt-1 leading-normal">
                        Controls in-app nudges such as fatigue breaks, posture reminders, and focus drift alerts.
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${notifications ? 'bg-cyan-500' : 'bg-slate-950 border border-white/10'}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${notifications ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* chrome extension connected status row */}
                <div className="py-5 flex items-center justify-between gap-5 text-left">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-950 border border-white/10 flex items-center justify-center text-zinc-500">
                      <Globe className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14.5px] font-semibold text-white">Chrome extension</span>
                      <span className="text-xs font-medium text-zinc-500 mt-1 leading-normal">
                        {extensionStatus.detail}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                    extensionStatus.state === 'Connected' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                    : extensionStatus.state === 'Paused' 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  }`}>
                    {extensionStatus.state}
                  </span>
                </div>

              </div>
            </div>

              </div>
            </div>

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950/20 rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-[14.5px] font-medium text-white focus:outline-none focus:border-cyan-500/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Email</label>
                <input 
                  type="text" 
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-[14.5px] font-medium text-zinc-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <button 
                onClick={handleSaveProfile}
                className="mt-4 w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex justify-center items-center gap-2"
              >
                <Check className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950/20 rounded-2xl w-full max-w-md p-6 border-rose-500/20 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-rose-500 mb-2">Delete Account</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              This action cannot be undone. This will permanently delete your account, settings, and all recorded cognitive metrics.
            </p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Type DELETE to confirm</label>
                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-[14.5px] font-medium text-white focus:outline-none focus:border-rose-500/40"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#030712] hover:bg-slate-950 border border-white/10 text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 text-white font-bold transition-all"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};
