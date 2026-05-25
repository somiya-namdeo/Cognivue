/**
 * Cognivue Focus Coach - Background Service Worker (Manifest V3)
 *
 * Privacy-first, domain-only cognitive tracking HUD.
 * Strictly avoids page scraping, keystroke logging, screenshots, or camera streams.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG
//  Change this one constant to switch between local dev and production.
//  Local dev : "http://127.0.0.1:8000"
//  Production: "https://cognivue-rmlz.onrender.com"
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = "https://cognivue-rmlz.onrender.com";

// ─────────────────────────────────────────────────────────────────────────────
//  DOMAIN CATEGORISATION
// ─────────────────────────────────────────────────────────────────────────────
function categorizeDomain(urlStr) {
  if (!urlStr) {
    return { category: "General Browsing", mode: "General", riskLevel: "low", label: "Universal Focus Mode Active" };
  }
  try {
    const url = new URL(urlStr);
    const domain = url.hostname.toLowerCase().replace(/^www\./, "");

    if (domain === "meet.google.com" || domain.includes("zoom.us") || domain.includes("teams.microsoft.com") || domain.includes("teams.live.com")) {
      return { category: "Meeting / Collaboration", mode: "Meeting", riskLevel: "low", label: "Meeting Focus Mode Active" };
    }
    if (domain === "github.com" || domain === "stackoverflow.com" || domain === "localhost" || domain === "127.0.0.1" || domain === "codeforces.com" || domain === "leetcode.com") {
      return { category: "Development", mode: "Coding", riskLevel: "low", label: "Coding Focus Mode Active" };
    }
    if (domain === "docs.google.com" || domain === "notion.so" || domain === "medium.com" || domain === "arxiv.org") {
      return { category: "Study / Writing", mode: "Study", riskLevel: "low", label: "Deep Study Mode Active" };
    }
    if (domain.includes("youtube.com") || domain === "coursera.org" || domain === "udemy.com") {
      return { category: "Learning / Tutorial", mode: "Learning", riskLevel: "low", label: "Learning Mode Active" };
    }
    if (domain === "instagram.com" || domain === "x.com" || domain === "twitter.com" || domain === "reddit.com") {
      return { category: "Social / Entertainment", mode: "Distracting", riskLevel: "high", label: "Distraction Risk Detected" };
    }
    return { category: "General Browsing", mode: "General", riskLevel: "low", label: "Universal Focus Mode Active" };
  } catch (e) {
    return { category: "System / Navigation", mode: "General", riskLevel: "low", label: "Universal Focus Mode Active" };
  }
}

function getDomainFromUrl(urlStr) {
  if (!urlStr) return "";
  try {
    const url = new URL(urlStr);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  PAYLOAD VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if value is a non-empty string that looks like a UUID.
 */
function isValidUUID(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

/**
 * Sanitises a session_id candidate to a valid UUID string or null.
 * Rejects: undefined, "", "null", "none", non-UUID strings.
 */
function sanitizeSessionId(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "none" || s === "undefined") return null;
  return isValidUUID(s) ? s : null;
}

/**
 * Ensures a number is a finite non-negative integer.
 */
function safeNumber(value) {
  const n = Number(value);
  if (!isFinite(n) || isNaN(n) || n < 0) return 0;
  return Math.round(n);
}

// ─────────────────────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────────────────────
let activeDomain = "";
let activeTitle = "";
let category = "General Browsing";
let focusMode = "General";
let tabSwitches = 0;
let syncStatus = "Local only";

let activeDomainStartTime = Date.now();
let totalTimeByDomain = {};
let unsyncedTimeSeconds = 0;

let user_id = "";
let trackingEnabled = false;
let extension_connected = false;
let active_session_id = "";

// Heartbeat deduplication
let lastHeartbeatTime = 0;
let lastHeartbeatDomain = "";

// In-progress guard: prevents two simultaneous telemetry POSTs
let isSyncing = false;

// ─────────────────────────────────────────────────────────────────────────────
//  STATE INIT & PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────
function initializeState() {
  chrome.storage.local.get(
    [
      "activeDomain", "activeTitle", "category", "focusMode", "tabSwitches", "syncStatus",
      "activeDomainStartTime", "totalTimeByDomain", "unsyncedTimeSeconds",
      "user_id", "userId", "trackingEnabled", "extension_connected", "active_session_id"
    ],
    (result) => {
      activeDomain = result.activeDomain || "";
      activeTitle = result.activeTitle || "";
      category = result.category || "General Browsing";
      focusMode = result.focusMode || "General";
      tabSwitches = result.tabSwitches || 0;
      syncStatus = result.syncStatus || "Local only";

      activeDomainStartTime = result.activeDomainStartTime || Date.now();
      totalTimeByDomain = result.totalTimeByDomain || {};
      unsyncedTimeSeconds = result.unsyncedTimeSeconds || 0;

      user_id = result.user_id || result.userId || "";
      trackingEnabled = result.trackingEnabled === true;
      extension_connected = !!result.extension_connected;
      active_session_id = sanitizeSessionId(result.active_session_id) || "";

      if (result.trackingEnabled === undefined) {
        chrome.storage.local.set({ trackingEnabled: false });
      }

      if (!activeDomain) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            handleTabTransition(tabs[0].url || tabs[0].pendingUrl, tabs[0].title);
          }
        });
      } else {
        saveState();
      }
    }
  );
}

function saveState() {
  chrome.storage.local.set({
    activeDomain, activeTitle, category, focusMode, tabSwitches, syncStatus,
    activeDomainStartTime, totalTimeByDomain, unsyncedTimeSeconds
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  REACTIVE STORAGE LISTENER
// ─────────────────────────────────────────────────────────────────────────────
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes.user_id) {
    user_id = changes.user_id.newValue || "";
  }
  if (changes.userId) {
    user_id = changes.userId.newValue || "";
  }
  if (changes.trackingEnabled) {
    const newTracking = changes.trackingEnabled.newValue === true;
    if (!newTracking) accumulateTime();
    trackingEnabled = newTracking;
    if (newTracking) {
      activeDomainStartTime = Date.now();
      saveState();
    }
  }
  if (changes.extension_connected) {
    const newConnected = !!changes.extension_connected.newValue;
    if (!newConnected) accumulateTime();
    extension_connected = newConnected;
  }
  if (changes.active_session_id) {
    const raw = changes.active_session_id.newValue;
    const clean = sanitizeSessionId(raw) || "";
    if (!clean) accumulateTime();
    active_session_id = clean;
    if (clean) {
      activeDomainStartTime = Date.now();
      saveState();
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  TIME ACCUMULATION
// ─────────────────────────────────────────────────────────────────────────────
function accumulateTime() {
  // Only accumulate when the extension is fully armed for tracking
  if (!user_id || !trackingEnabled || !extension_connected || !active_session_id) {
    activeDomainStartTime = Date.now();
    saveState();
    return;
  }

  const now = Date.now();
  const elapsedSeconds = Math.round((now - activeDomainStartTime) / 1000);

  if (elapsedSeconds > 0 && activeDomain && activeDomain !== "newtab") {
    totalTimeByDomain[activeDomain] = (totalTimeByDomain[activeDomain] || 0) + elapsedSeconds;
    unsyncedTimeSeconds += elapsedSeconds;
  }

  activeDomainStartTime = now;
  saveState();
}

// ─────────────────────────────────────────────────────────────────────────────
//  TAB TRANSITION HANDLING
// ─────────────────────────────────────────────────────────────────────────────
function handleTabTransition(url, title = "") {
  accumulateTime();

  const newDomain = getDomainFromUrl(url);
  const info = categorizeDomain(url);

  if (newDomain !== activeDomain) {
    const canTrack = !!user_id && trackingEnabled && extension_connected && !!active_session_id;
    if (canTrack) tabSwitches += 1;
    activeDomain = newDomain;
    activeTitle = title;
    category = info.category;
    focusMode = info.mode;
    activeDomainStartTime = Date.now();
  } else if (title) {
    activeTitle = title;
  }

  saveState();
}

// ─────────────────────────────────────────────────────────────────────────────
//  TAB / WINDOW LISTENERS
// ─────────────────────────────────────────────────────────────────────────────
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    handleTabTransition(tab.url || tab.pendingUrl, tab.title);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title) {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const activeTab = activeTabs && activeTabs[0];
      if (activeTab && activeTab.id === tabId) {
        handleTabTransition(activeTab.url || activeTab.pendingUrl, activeTab.title);
      }
    });
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    accumulateTime();
  } else {
    chrome.tabs.query({ active: true, windowId }, (activeTabs) => {
      const activeTab = activeTabs && activeTabs[0];
      if (activeTab) handleTabTransition(activeTab.url || activeTab.pendingUrl, activeTab.title);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  FETCH WITH ONE RETRY HELPER
//  Tries the request once. On network failure waits 1 s then retries once.
//  HTTP errors (4xx / 5xx) are NOT retried – they are returned immediately so
//  callers can read the response body for debugging.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchWithRetry(url, options) {
  try {
    return await fetch(url, options);
  } catch (networkErr) {
    // Network-level failure (no connectivity, DNS, CORS preflight). Wait 1 s then retry once.
    console.warn("Cognivue: fetch failed (will retry in 1 s):", networkErr.message);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      return await fetch(url, options);
    } catch (retryErr) {
      // Both attempts failed – rethrow so caller handles gracefully
      throw retryErr;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TELEMETRY SYNC  (runs every 5 s via alarm)
// ─────────────────────────────────────────────────────────────────────────────
function syncTelemetry() {
  // Nothing to do without a linked user
  if (!user_id || !extension_connected) return;

  // Prevent duplicate concurrent syncs
  if (isSyncing) return;

  // Validate user_id is a proper UUID before sending anything
  if (!isValidUUID(user_id)) {
    console.warn("Cognivue: user_id is not a valid UUID, skipping sync.", user_id);
    return;
  }

  const cleanSession = sanitizeSessionId(active_session_id);
  const canTrack = trackingEnabled && !!cleanSession;

  if (canTrack) {
    // ── Full telemetry sync ──────────────────────────────────────────────────
    accumulateTime();

    // Re-check after accumulation (state may have changed)
    if (!user_id || !trackingEnabled || !extension_connected) return;
    const sessionAfterAccumulate = sanitizeSessionId(active_session_id);
    if (!sessionAfterAccumulate) return;

    // Skip if nothing new to send
    if (unsyncedTimeSeconds === 0) {
      syncStatus = "Synced";
      saveState();
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const title = (tabs && tabs[0] && tabs[0].title) ? tabs[0].title : "";

      // Build a fully-validated payload
      const payload = {
        user_id: user_id.trim(),
        session_id: sessionAfterAccumulate,
        domain: activeDomain || "unknown",
        title: title || "",
        detected_mode: focusMode || "General",
        activity_category: category || "General Browsing",
        time_spent: safeNumber(unsyncedTimeSeconds),
        tab_switches: safeNumber(tabSwitches),
        heartbeat: false,
        timestamp: new Date().toISOString()
      };

      // Guard: skip if time_spent is somehow still 0
      if (payload.time_spent === 0) {
        syncStatus = "Synced";
        saveState();
        return;
      }

      console.log("Cognivue: sending telemetry payload:", JSON.stringify(payload));
      isSyncing = true;

      try {
        const response = await fetchWithRetry(`${API_BASE_URL}/extension/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "Cognivue: telemetry sync failed",
            response.status,
            errorText,
            JSON.stringify(payload)
          );
          // Do NOT mark extension disconnected on HTTP errors
          syncStatus = "Cloud sync paused";
          saveState();
          isSyncing = false;
          return;
        }

        // Success: clear the unsynced buffer
        unsyncedTimeSeconds = 0;
        tabSwitches = 0;
        syncStatus = "Synced";
        saveState();
        isSyncing = false;
        console.log("Cognivue: telemetry synced successfully.");
      } catch (err) {
        // Network failure even after retry
        console.error("Cognivue: telemetry fetch failed after retry:", err.message);
        syncStatus = "Cloud sync paused";
        saveState();
        isSyncing = false;
      }
    });

  } else {
    // ── Lightweight heartbeat (no active session or tracking paused) ─────────
    // Skip heartbeat if a full telemetry sync is already in progress
    if (isSyncing) return;

    const currentDomain = activeDomain || "connected";
    const now = Date.now();

    // Deduplicate: skip if same domain and last heartbeat was <5 s ago
    if (currentDomain === lastHeartbeatDomain && (now - lastHeartbeatTime) < 5000) {
      return;
    }

    // Build heartbeat payload
    const payload = {
      user_id: user_id.trim(),
      session_id: null,
      domain: currentDomain,
      title: "Extension heartbeat",
      detected_mode: "General",
      activity_category: "Extension Heartbeat",
      time_spent: 0,
      tab_switches: 0,
      heartbeat: true,
      timestamp: new Date().toISOString()
    };

    console.log("Cognivue: sending heartbeat payload:", JSON.stringify(payload));

    fetchWithRetry(`${API_BASE_URL}/extension/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(async (response) => {
      // 200 = buffered (Supabase temporarily slow) — still counts as connected
      // 201 = inserted immediately
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Cognivue: heartbeat sync failed",
          response.status,
          errorText,
          JSON.stringify(payload)
        );
        // Do NOT disconnect – heartbeat failure is a transient cloud issue
        syncStatus = "Cloud sync paused";
        saveState();
        return;
      }
      lastHeartbeatTime = Date.now();
      lastHeartbeatDomain = currentDomain;
      syncStatus = "Synced";
      saveState();
      console.log("Cognivue: heartbeat synced successfully.");
    })
    .catch((err) => {
      // Network failure after retry
      console.error("Cognivue: heartbeat fetch failed after retry:", err.message);
      syncStatus = "Cloud sync paused";
      saveState();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ACTIVE SESSION POLLING  (runs every 10 s via alarm)
// ─────────────────────────────────────────────────────────────────────────────
function pollActiveSession() {
  if (!user_id) return;

  fetch(`${API_BASE_URL}/sessions/active/${user_id}`)
    .then((res) => {
      if (res.status === 404) {
        // No active session – clear it silently, extension remains connected
        chrome.storage.local.remove(["active_session_id", "latestMetrics"]);
        return null;
      }
      if (!res.ok) throw new Error(`sessions/active returned ${res.status}`);
      return res.json();
    })
    .then((session) => {
      if (!session) return;

      const sessionId = session?.id || session?.session_id || session?.active_session_id;
      if (!isValidUUID(sessionId)) {
        chrome.storage.local.remove(["active_session_id"]);
        return;
      }

      chrome.storage.local.set({ active_session_id: sessionId });
    })
    .catch((err) => {
      // Network failure polling session – do NOT disconnect
      console.warn("Cognivue: pollActiveSession network error (session state preserved):", err.message);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  METRICS POLLING  (runs every 5 s, but only when a session is active)
// ─────────────────────────────────────────────────────────────────────────────
function pollLatestMetrics() {
  if (!active_session_id || !isValidUUID(active_session_id)) return;

  fetch(`${API_BASE_URL}/metrics/latest/${active_session_id}`)
    .then((res) => {
      if (!res.ok) return null;
      return res.json();
    })
    .then((metric) => {
      if (metric) chrome.storage.local.set({ latestMetrics: metric });
    })
    .catch(() => {
      // Metrics unavailable – retain last known values
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  ALARMS
//  telemetry-sync : every 5 s
//  poll-session   : every 10 s (separate to avoid collisions)
//  poll-metrics   : every 5 s (only fires when session is active)
// ─────────────────────────────────────────────────────────────────────────────
chrome.alarms.create("telemetry-sync", { periodInMinutes: 5 / 60 });
chrome.alarms.create("poll-session",   { periodInMinutes: 10 / 60 });
chrome.alarms.create("poll-metrics",   { periodInMinutes: 5 / 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "telemetry-sync") {
    syncTelemetry();
  } else if (alarm.name === "poll-session") {
    pollActiveSession();
  } else if (alarm.name === "poll-metrics") {
    pollLatestMetrics();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POPUP MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reset_extension_data") {
    totalTimeByDomain = {};
    unsyncedTimeSeconds = 0;
    tabSwitches = 0;
    activeDomainStartTime = Date.now();
    activeDomain = "";
    activeTitle = "";
    category = "General Browsing";
    focusMode = "General";
    saveState();
    chrome.storage.local.remove(["latestMetrics", "active_session_id"], () => {
      sendResponse({ status: "cleared" });
    });
    return true; // Keep channel open for async response
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────────────────────
initializeState();
