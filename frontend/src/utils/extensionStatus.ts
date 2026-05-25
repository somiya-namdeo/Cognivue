export type ExtensionState = 'connected' | 'paused' | 'disconnected';

export interface ExtensionStatus {
  state: ExtensionState;
  detail: string;
}

/**
 * Shared status helper to evaluate Chrome extension connection state
 * purely based on the latest extension activity timestamp.
 * 
 * Rules:
 * 1. No telemetry => 'disconnected'
 * 2. Latest sync within 2 minutes => 'connected'
 * 3. Latest sync within 10 minutes => 'paused'
 * 4. Older sync => 'disconnected'
 */
export function determineExtensionStatus(activities: any[]): ExtensionStatus {
  if (!activities || activities.length === 0) {
    return { state: 'disconnected', detail: 'No recent telemetry found.' };
  }

  // Helper to extract timestamp safely
  const getTimestamp = (activity: any): number => {
    const rawVal = activity?.recorded_at || activity?.created_at || activity?.timestamp;
    if (!rawVal) return 0;
    return new Date(rawVal).getTime();
  };

  // 2. Always sort activities descending by timestamp before evaluating
  const sorted = [...activities].sort((a, b) => getTimestamp(b) - getTimestamp(a));
  const latest = sorted[0];
  const lastSync = getTimestamp(latest);

  // 3. Defensive handling: If timestamp parsing fails, return invalid status
  if (!lastSync || isNaN(lastSync)) {
    return { state: 'disconnected', detail: 'Invalid telemetry timestamp.' };
  }

  const now = Date.now();
  const diffMins = (now - lastSync) / 60000;

  if (diffMins < 2) {
    return { state: 'connected', detail: `Active on ${latest.domain || 'unknown'}` };
  } else if (diffMins < 10) {
    const roundedMins = Math.round(diffMins);
    return { state: 'paused', detail: `Telemetry cached. Last sync ${roundedMins}m ago` };
  } else {
    const roundedMins = Math.round(diffMins);
    return { state: 'disconnected', detail: `Last sync ${roundedMins}m ago` };
  }
}
