/**
 * Cognivue Notification Service
 * Account-scoped, localStorage-backed, zero backend dependency.
 * 
 * Storage key: cognivue_notifications_${userId}
 * Notifications are isolated per user — switching accounts shows different sets.
 */

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;     // ISO string
  read: boolean;
  targetRoute?: string;   // optional navigation on click
  // Legacy alias kept for Topbar backward compat
  timestamp?: string;
  route?: string;
}

const EVENT_NAME = 'cognivue_notifications_updated';
const MAX_NOTIFICATIONS = 30;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ─── Storage key (account-scoped) ───────────────────────────────────────────

const getStorageKey = (): string => {
  const userId = localStorage.getItem('user_id') || 'anonymous';
  return `cognivue_notifications_${userId}`;
};

// ─── Read ────────────────────────────────────────────────────────────────────

export const getNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(getStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Normalize legacy shape and guard every field
    return parsed.map((n: any): AppNotification => ({
      id: n?.id ?? Math.random().toString(36).slice(2),
      type: (['info', 'warning', 'error', 'success'].includes(n?.type) ? n.type : 'info') as NotificationType,
      title: n?.title ?? 'Notification',
      message: n?.message ?? '',
      created_at: n?.created_at ?? n?.timestamp ?? new Date().toISOString(),
      read: Boolean(n?.read),
      targetRoute: n?.targetRoute ?? n?.route,
      timestamp: n?.created_at ?? n?.timestamp,
      route: n?.targetRoute ?? n?.route,
    }));
  } catch {
    return [];
  }
};

// ─── Write ───────────────────────────────────────────────────────────────────

const saveNotifications = (list: AppNotification[]): void => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // Ignore storage quota errors — never crash the app
  }
};

// ─── Push ────────────────────────────────────────────────────────────────────

/**
 * Push a new notification. Deduplicated within DEDUP_WINDOW_MS per title+type.
 */
export const pushNotification = (
  title: string,
  message: string,
  type: NotificationType = 'info',
  targetRoute?: string
): void => {
  try {
    const userId = localStorage.getItem('user_id') || 'anonymous';
    const notifKey = `cognivue_notifications_enabled_${userId}`;
    const coachNotificationsEnabled = localStorage.getItem(notifKey) !== 'false';
    if (!coachNotificationsEnabled) return;

    const current = getNotifications();
    const now = Date.now();

    // Dedup: ignore if same title+type fired within 5 minutes
    const isDuplicate = current.some((n) => {
      if (n.title !== title || n.type !== type) return false;
      const t = new Date(n.created_at).getTime();
      return !isNaN(t) && now - t < DEDUP_WINDOW_MS;
    });
    if (isDuplicate) return;

    const nowISO = new Date(now).toISOString();
    const newNotif: AppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      message,
      created_at: nowISO,
      read: false,
      targetRoute,
      // Legacy aliases
      timestamp: nowISO,
      route: targetRoute,
    };

    const updated = [newNotif, ...current].slice(0, MAX_NOTIFICATIONS);
    saveNotifications(updated);
  } catch {
    // Never crash the app on notification push
  }
};

// ─── Mark as read ────────────────────────────────────────────────────────────

export const markNotificationRead = (id: string): void => {
  try {
    const updated = getNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  } catch {}
};

export const markAllAsRead = (): void => {
  try {
    const updated = getNotifications().map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  } catch {}
};

// ─── Clear ───────────────────────────────────────────────────────────────────

export const clearAllNotifications = (): void => {
  try {
    saveNotifications([]);
  } catch {}
};

// ─── Subscribe ───────────────────────────────────────────────────────────────

export const subscribeToNotifications = (callback: () => void): (() => void) => {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
};
