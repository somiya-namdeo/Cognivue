export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  route: string;
  read: boolean;
}

const STORAGE_KEY = 'cognivue_notifications';
const EVENT_NAME = 'cognivue_new_notification';

// Helper to get notifications
export const getNotifications = (): AppNotification[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Add a new notification with deduplication (prevent spamming same type within 5 mins)
export const pushNotification = (
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' | 'success',
  route: string
) => {
  const current = getNotifications();
  
  // Deduplicate logic: if a notification with same title exists within last 5 minutes, ignore it
  const now = new Date();
  const recentDuplicate = current.find(n => {
    if (!n || n.title !== title) return false;
    if (!n.timestamp) return false;
    const time = new Date(n.timestamp).getTime();
    if (isNaN(time)) return false;
    return (now.getTime() - time < 5 * 60 * 1000);
  });

  if (recentDuplicate) return;

  const newNotif: AppNotification = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    message,
    type,
    timestamp: now.toISOString(),
    route,
    read: false
  };

  const updated = [newNotif, ...current].slice(0, 20); // Keep last 20
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  // Dispatch custom event to update UI immediately
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const markAllAsRead = () => {
  const current = getNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const subscribeToNotifications = (callback: () => void) => {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
};
