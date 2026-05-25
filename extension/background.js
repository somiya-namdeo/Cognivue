/**
 * Cognivue Focus Coach - Background Service Worker (Manifest V3)
 * 
 * Privacy-first, domain-only cognitive tracking HUD foundation.
 * Strictly avoids page scraping, keystroke logging, screenshots, or camera streams.
 */

const API_BASE_URL = "https://cognivue-rmlz.onrender.com";

// Extensible Domain Categorization Function
function categorizeDomain(urlStr) {
  if (!urlStr) {
    return { category: "General Browsing", mode: "General", riskLevel: "low", label: "Universal Focus Mode Active" };
  }
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    const domain = host.replace(/^www\./, '');

    if (domain === 'meet.google.com' || domain.includes('zoom.us') || domain.includes('teams.microsoft.com') || domain.includes('teams.live.com')) {
      return { category: "Meeting / Collaboration", mode: "Meeting", riskLevel: "low", label: "Meeting Focus Mode Active" };
    }
    if (domain === 'github.com' || domain === 'stackoverflow.com' || domain === 'localhost' || domain === '127.0.0.1' || domain === 'codeforces.com' || domain === 'leetcode.com') {
      return { category: "Development", mode: "Coding", riskLevel: "low", label: "Coding Focus Mode Active" };
    }
    if (domain === 'docs.google.com' || domain === 'notion.so' || domain === 'medium.com' || domain === 'arxiv.org') {
      return { category: "Study / Writing", mode: "Study", riskLevel: "low", label: "Deep Study Mode Active" };
    }
    if (domain.includes('youtube.com') || domain === 'coursera.org' || domain === 'udemy.com') {
      return { category: "Learning / Tutorial", mode: "Learning", riskLevel: "low", label: "Learning Mode Active" };
    }
    if (domain === 'instagram.com' || domain === 'x.com' || domain === 'twitter.com' || domain === 'reddit.com') {
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
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    return "";
  }
}

// State
let activeDomain = "";
let activeTitle = "";
let category = "General Browsing";
let focusMode = "General";
let tabSwitches = 0;
let syncStatus = "Local only";

// Timer tracking
let activeDomainStartTime = Date.now();
let totalTimeByDomain = {};
let unsyncedTimeSeconds = 0;

// Cached tracking rules and user connection
let user_id = "";
let trackingEnabled = false; // Default to false for fresh install!
let extension_connected = false;
let active_session_id = "";

// Heartbeat deduplication tracking
let lastHeartbeatTime = 0;
let lastHeartbeatDomain = "";

function initializeState() {
  chrome.storage.local.get([
    "activeDomain", "activeTitle", "category", "focusMode", "tabSwitches", "syncStatus",
    "activeDomainStartTime", "totalTimeByDomain", "unsyncedTimeSeconds",
    "user_id", "userId", "trackingEnabled", "extension_connected", "active_session_id"
  ], (result) => {
    activeDomain = result.activeDomain || "";
    activeTitle = result.activeTitle || "";
    category = result.category || "General Browsing";
    focusMode = result.focusMode || "General";
    tabSwitches = result.tabSwitches || 0;
    syncStatus = result.syncStatus || "Local only";
    
    // Safely restore timers or restart them
    activeDomainStartTime = result.activeDomainStartTime || Date.now();
    totalTimeByDomain = result.totalTimeByDomain || {};
    unsyncedTimeSeconds = result.unsyncedTimeSeconds || 0;
    
    // Cache connection and tracking state
    user_id = result.user_id || result.userId || "";
    trackingEnabled = result.trackingEnabled === true; // default to false
    extension_connected = !!result.extension_connected;
    active_session_id = result.active_session_id || "";

    // Set default trackingEnabled if it wasn't in storage
    if (result.trackingEnabled === undefined) {
      chrome.storage.local.set({ trackingEnabled: false });
    }
    
    // Attempt to recover active tab if it's missing (e.g. extension restart)
    if (!activeDomain) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          handleTabTransition(tabs[0].url || tabs[0].pendingUrl, tabs[0].title);
        }
      });
    } else {
      saveState();
    }
  });
}

function saveState() {
  chrome.storage.local.set({
    activeDomain, activeTitle, category, focusMode, tabSwitches, syncStatus,
    activeDomainStartTime, totalTimeByDomain, unsyncedTimeSeconds
  });
}

// Reactively keep memory variables in sync with chrome.storage.local
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    if (changes.user_id) {
      user_id = changes.user_id.newValue || "";
    }
    if (changes.userId) {
      user_id = changes.userId.newValue || "";
    }
    if (changes.trackingEnabled) {
      const newTracking = changes.trackingEnabled.newValue === true;
      if (!newTracking) {
        // Turning tracking OFF: accumulate any pending time before we stop tracking
        accumulateTime();
      }
      trackingEnabled = newTracking;
      if (newTracking) {
        // Turning tracking ON: reset start time to now so we start fresh
        activeDomainStartTime = Date.now();
        saveState();
      }
    }
    if (changes.extension_connected) {
      const newConnected = !!changes.extension_connected.newValue;
      if (!newConnected) {
        accumulateTime();
      }
      extension_connected = newConnected;
    }
    if (changes.active_session_id) {
      const newSession = changes.active_session_id.newValue || "";
      if (!newSession) {
        accumulateTime();
      }
      active_session_id = newSession;
      if (newSession) {
        activeDomainStartTime = Date.now();
        saveState();
      }
    }
  }
});

function accumulateTime() {
  // 6. Background.js must check before every timer update: if (!user_id || !trackingEnabled) return;
  // Plus we require extension to be connected and have an active session!
  if (!user_id || !trackingEnabled || !extension_connected || !active_session_id) {
    activeDomainStartTime = Date.now();
    saveState();
    return;
  }

  const now = Date.now();
  const elapsedSeconds = Math.round((now - activeDomainStartTime) / 1000);
  
  if (elapsedSeconds > 0 && activeDomain && activeDomain !== "newtab" && activeDomain !== "") {
    totalTimeByDomain[activeDomain] = (totalTimeByDomain[activeDomain] || 0) + elapsedSeconds;
    unsyncedTimeSeconds += elapsedSeconds;
  }
  
  activeDomainStartTime = now;
  saveState();
}

function handleTabTransition(url, title = "") {
  accumulateTime();
  
  const newDomain = getDomainFromUrl(url);
  const info = categorizeDomain(url);

  if (newDomain !== activeDomain) {
    // Only count tab switches when tracking is fully active
    const canTrack = !!user_id && !!trackingEnabled && !!extension_connected && !!active_session_id;
    if (canTrack) {
      tabSwitches += 1;
    }
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

// 1. Tab activated listener
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    handleTabTransition(tab.url || tab.pendingUrl, tab.title);
  });
});

// 2. Tab updated listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title) {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const activeTab = activeTabs[0];
      if (activeTab && activeTab.id === tabId) {
        handleTabTransition(activeTab.url || activeTab.pendingUrl, activeTab.title);
      }
    });
  }
});

// 3. Window focus listener
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    accumulateTime();
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, (activeTabs) => {
      const activeTab = activeTabs[0];
      if (activeTab) {
        handleTabTransition(activeTab.url || activeTab.pendingUrl, activeTab.title);
      }
    });
  }
});

// Sync handler (5 seconds)
function syncTelemetry() {
  // Disconnected: no heartbeat, no telemetry.
  if (!user_id || !extension_connected) {
    return;
  }
  
  const canTrack = trackingEnabled && !!active_session_id;

  if (canTrack) {
    // Normal Telemetry Sync
    accumulateTime(); // Ensure latest time is tracked
    
    // Re-check conditions in case accumulateTime changed them
    if (!user_id || !trackingEnabled || !extension_connected || !active_session_id) {
      return;
    }

    if (unsyncedTimeSeconds === 0) {
      syncStatus = "Synced";
      saveState();
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const title = tabs && tabs[0] ? tabs[0].title : "";

      const payload = {
        user_id: user_id,
        session_id: active_session_id,
        domain: activeDomain || "unknown",
        title: title,
        detected_mode: focusMode,
        activity_category: category,
        time_spent: unsyncedTimeSeconds,
        tab_switches: tabSwitches,
        heartbeat: false,
        timestamp: new Date().toISOString()
      };

      fetch(`${API_BASE_URL}/extension/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          console.error(`Telemetry sync POST failed: ${response.status} - ${text}`);
          throw new Error(`HTTP error ${response.status}: ${text}`);
        }
        unsyncedTimeSeconds = 0;
        syncStatus = "Synced";
        saveState();
      })
      .catch((err) => {
        console.error("Cognivue Telemetry sync failed:", err);
        syncStatus = "Cloud sync paused";
        saveState();
      });
    });
  } else {
    // Lightweight Heartbeat Sync
    const currentDomain = activeDomain || "connected";
    const now = Date.now();

    // Prevent heartbeat spam: If activeDomain has not changed and last heartbeat < 5s ago, skip duplicate POST.
    if (currentDomain === lastHeartbeatDomain && (now - lastHeartbeatTime) < 5000) {
      return;
    }

    const payload = {
      user_id: user_id,
      session_id: null,
      domain: activeDomain || "connected",
      title: "Extension heartbeat",
      detected_mode: "General",
      activity_category: "Extension Heartbeat",
      time_spent: 0,
      tab_switches: 0,
      heartbeat: true,
      timestamp: new Date().toISOString()
    };

    fetch(`${API_BASE_URL}/extension/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error(`Telemetry heartbeat POST failed: ${response.status} - ${text}`);
        throw new Error(`HTTP error ${response.status}: ${text}`);
      }
      lastHeartbeatTime = Date.now();
      lastHeartbeatDomain = currentDomain;
      syncStatus = "Synced";
      saveState();
    })
    .catch((err) => {
      console.error("Cognivue Telemetry heartbeat failed:", err);
      syncStatus = "Cloud sync paused";
      saveState();
    });
  }
}

// Active session & metrics polling (5 seconds)
function pollActiveSession() {
  if (!user_id) return;

  // 1. Poll for active session
  fetch(`${API_BASE_URL}/sessions/active/${user_id}`)
    .then(res => {
      if (!res.ok) throw new Error("No active session");
      return res.json();
    })
    .then(session => {
      const sessionId = session?.id || session?.session_id || session?.active_session_id;
      if (sessionId) {
        chrome.storage.local.set({ active_session_id: sessionId });
        return sessionId;
      }
      throw new Error("No valid session ID in response");
    })
    .then(sessionId => {
      // 2. Fetch metrics
      fetch(`${API_BASE_URL}/metrics/latest/${sessionId}`)
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              return fetch(`${API_BASE_URL}/metrics/session/${sessionId}`)
                .then(fbRes => {
                  if (!fbRes.ok) throw new Error("Fallback failed");
                  return fbRes.json();
                })
                .then(arr => {
                  if (Array.isArray(arr) && arr.length > 0) return arr[arr.length - 1];
                  throw new Error("No metrics in fallback");
                });
            }
            throw new Error("Metrics not available");
          }
          return res.json();
        })
        .then(metric => {
          if (metric) {
            chrome.storage.local.set({ latestMetrics: metric });
          }
        })
        .catch(() => {
          // metrics unavailable, retain last known values
        });
    })
    .catch(err => {
      chrome.storage.local.remove(["active_session_id", "latestMetrics"]);
    });
}

// Alarms setup
chrome.alarms.create("telemetry-sync", { periodInMinutes: 5 / 60 });
chrome.alarms.create("poll-session", { periodInMinutes: 5 / 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "telemetry-sync") {
    syncTelemetry();
  } else if (alarm.name === "poll-session") {
    pollActiveSession();
  }
});

// Listen for reset command from popup
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

initializeState();

