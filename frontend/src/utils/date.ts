/**
 * Reusable premium date, time, and duration formatting utilities for Cognivue.
 */

/**
 * Automatically converts a UTC timestamp from Supabase into the user's local timezone (en-IN / IST).
 * 
 * @param dateInput UTC timestamp ISO string, Date object, or null
 * @returns Formatted local date string (e.g., "20-May-2026, 2:40 PM")
 */
export const formatLocalDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '--';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    

    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return String(dateInput);
  }
};

/**
 * Formats a decimal/integer minutes duration into a readable string.
 * Handles active sessions, sub-minute sessions (shown in seconds), and hour+ sessions.
 * 
 * @param minutes Duration in minutes (float or integer)
 * @param isEnded Whether the session has concluded
 * @returns Human-readable duration string (e.g., "In progress", "30s", "12m", "1h 24m")
 */
export const formatDuration = (minutes: number | null | undefined, isEnded: boolean): string => {
  if (!isEnded) return 'In progress';
  if (minutes === null || minutes === undefined) return '< 1s';

  try {
    // Sub-minute sessions: convert to whole seconds (e.g. 0.5 -> 30s, 0.4 -> 24s)
    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      // Guard against 0s edge case
      return seconds > 0 ? `${seconds}s` : '< 1s';
    }

    // Hour+ sessions: e.g. "1h 24m", "2h"
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    // Standard minutes: whole integer, no decimals (e.g. "2m", "15m")
    return `${Math.round(minutes)}m`;
  } catch {
    return '< 1s';
  }
};

/**
 * Returns a highly precise relative time string (e.g., "Just now", "45s ago", "12m ago", "2h ago").
 * 
 * @param dateInput Target ISO string or Date
 * @returns Relative timestamp string
 */
export const formatRelativeTime = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  try {
    const targetDate = new Date(dateInput);
    if (isNaN(targetDate.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    
    // Support "Just now" (under 10 seconds)
    if (diffSecs < 10) {
      return 'Just now';
    }
    
    // Support "45s ago" (10s to 59s)
    if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    }
    
    // Support "12m ago" (1m to 59m)
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    
    // Support "2h ago" (1h to 23h)
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    
    // 1 day or more: fallback to local date format
    return formatLocalDate(dateInput);
  } catch {
    return '';
  }
};
