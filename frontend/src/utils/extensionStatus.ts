// ─────────────────────────────────────────────────────────────────────────────
//  Extension connection status helper
//
//  Thresholds:
//    CONNECTED     → latest heartbeat/activity within 5 minutes
//    PAUSED        → within 15 minutes
//    RECONNECTING  → temporary – used by callers when a request just failed but
//                    the cached heartbeat is still within the CONNECTED window
//    DISCONNECTED  → older than 15 minutes OR 3 consecutive fetch failures AND
//                    no successful heartbeat for >5 minutes
//
//  Disconnect rules (Requirements 6 & 7):
//    A single failed request NEVER marks the extension disconnected.
//    We require EITHER:
//      (a) 3 consecutive failures  AND  no successful heartbeat for >5 min, OR
//      (b) No successful heartbeat for >5 min (regardless of failure count)
//
//  Persistence:
//    The timestamp of the latest successfully resolved heartbeat is written to
//    localStorage so that a page refresh or momentary fetch failure can fall
//    back to the last known-good value before declaring NOT CONNECTED.
//
//  Session independence (Requirement 7):
//    Connected state depends ONLY on extension/activity timestamps.
//    sessions/active NEVER influences this module.
// ─────────────────────────────────────────────────────────────────────────────

export type ExtensionState = 'connected' | 'paused' | 'reconnecting' | 'disconnected';

export interface ExtensionStatus {
  state: ExtensionState;
  detail: string;
}

const LS_HEARTBEAT_KEY  = 'cognivue_last_success_ext_heartbeat';
const CONNECTED_WINDOW_MS  = 5  * 60 * 1000; //  5 minutes
const PAUSED_WINDOW_MS     = 15 * 60 * 1000; // 15 minutes

// Number of consecutive poll failures required before we can show disconnected
const FAILURE_THRESHOLD = 3;

// ─────────────────────────────────────────────────────────────────────────────
//  FAILURE COUNTER
//  Callers call recordSuccess() on each successful fetch and recordFailure()
//  on each failed fetch.  shouldDisconnect() returns true only when the
//  threshold is met AND the sticky heartbeat is also too old.
// ─────────────────────────────────────────────────────────────────────────────

let _consecutiveFailures = 0;

/** Call after every successful GET /extension/activity response. */
export function recordSuccess(): void {
  _consecutiveFailures = 0;
}

/** Call after every failed GET /extension/activity request. */
export function recordFailure(): void {
  _consecutiveFailures = Math.min(_consecutiveFailures + 1, FAILURE_THRESHOLD + 1);
}

/**
 * Returns true only when we have enough evidence to actually show disconnected:
 *   - at least FAILURE_THRESHOLD consecutive failures, AND
 *   - no successful heartbeat within CONNECTED_WINDOW_MS
 *
 * This prevents a single bad request from flipping the UI.
 */
export function shouldDisconnect(): boolean {
  if (_consecutiveFailures < FAILURE_THRESHOLD) return false;
  const persisted = readPersistedHeartbeat();
  if (!persisted) return true;
  return (Date.now() - persisted) >= CONNECTED_WINDOW_MS;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HEARTBEAT CACHE
// ─────────────────────────────────────────────────────────────────────────────

/** Persist the latest heartbeat timestamp so page reloads keep the sticky state. */
function persistHeartbeat(isoTimestamp: string): void {
  try {
    localStorage.setItem(LS_HEARTBEAT_KEY, isoTimestamp);
  } catch {
    // localStorage unavailable (private-browsing edge case) – ignore
  }
}

/** Read the previously persisted heartbeat timestamp (ms epoch). Returns 0 if absent. */
function readPersistedHeartbeat(): number {
  try {
    const raw = localStorage.getItem(LS_HEARTBEAT_KEY);
    if (!raw) return 0;
    const ms = new Date(raw).getTime();
    return isNaN(ms) ? 0 : ms;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN STATUS EVALUATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates the Chrome extension connection state from the latest activity
 * records returned by GET /extension/activity/{user_id}.
 *
 * Sticky fall-back: if no activities are passed but a persisted heartbeat
 * within the CONNECTED window exists, returns 'connected' so that a single
 * failed poll does not immediately flip the UI.
 */
export function determineExtensionStatus(activities: any[]): ExtensionStatus {
  const now = Date.now();

  // Helper: extract the best available timestamp from an activity row
  const getTimestamp = (activity: any): number => {
    const rawVal = activity?.recorded_at || activity?.created_at || activity?.timestamp;
    if (!rawVal) return 0;
    const ms = new Date(rawVal).getTime();
    return isNaN(ms) ? 0 : ms;
  };

  if (!activities || activities.length === 0) {
    // Fall back to persisted heartbeat before declaring disconnected
    const persisted = readPersistedHeartbeat();
    if (persisted && (now - persisted) < CONNECTED_WINDOW_MS) {
      return { state: 'connected', detail: 'Connected (cached heartbeat)' };
    }
    if (persisted && (now - persisted) < PAUSED_WINDOW_MS) {
      const mins = Math.round((now - persisted) / 60000);
      return { state: 'paused', detail: `Last heartbeat ${mins}m ago (cached)` };
    }
    // Empty data AND no recent cache → disconnected
    return { state: 'disconnected', detail: 'No recent telemetry found.' };
  }

  // Sort descending so index-0 is always the most recent record
  const sorted = [...activities].sort((a, b) => getTimestamp(b) - getTimestamp(a));
  const latest = sorted[0];
  const lastSync = getTimestamp(latest);

  if (!lastSync) {
    return { state: 'disconnected', detail: 'Invalid telemetry timestamp.' };
  }

  const diffMs = now - lastSync;

  if (diffMs < CONNECTED_WINDOW_MS) {
    // Persist so the sticky cache is always up-to-date
    const rawVal = latest?.recorded_at || latest?.created_at || latest?.timestamp || '';
    if (rawVal) persistHeartbeat(rawVal);

    return {
      state: 'connected',
      detail: `Active on ${latest.domain || 'unknown'}`
    };
  }

  if (diffMs < PAUSED_WINDOW_MS) {
    const roundedMins = Math.round(diffMs / 60000);
    return {
      state: 'paused',
      detail: `Telemetry cached. Last sync ${roundedMins}m ago`
    };
  }

  const roundedMins = Math.round(diffMs / 60000);
  return {
    state: 'disconnected',
    detail: `Last sync ${roundedMins}m ago`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  RECONNECTING STATUS HELPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a status using the sticky cache when a fetch request just failed.
 * Uses the persisted heartbeat to avoid immediately showing "disconnected".
 *
 * Decision rules:
 *   - Heartbeat <5 min old → 'reconnecting' (not yet disconnected)
 *   - Heartbeat 5–15 min old → 'paused'
 *   - Otherwise → preserve previousState (do not upgrade severity)
 */
export function getReconnectingStatus(previousState: ExtensionState): ExtensionStatus {
  const now = Date.now();
  const persisted = readPersistedHeartbeat();

  if (persisted && (now - persisted) < CONNECTED_WINDOW_MS) {
    // Still within the connected window → show reconnecting (not disconnected)
    return { state: 'reconnecting', detail: 'Reconnecting to cloud...' };
  }

  if (persisted && (now - persisted) < PAUSED_WINDOW_MS) {
    return { state: 'paused', detail: 'Cloud sync paused. Retrying...' };
  }

  // Persisted cache is too old or absent — preserve whatever we had before
  return { state: previousState, detail: 'Sync checking...' };
}
