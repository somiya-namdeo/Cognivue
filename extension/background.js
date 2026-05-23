/**
 * Cognivue Focus Coach - Background Service Worker (Manifest V3)
 * 
 * Privacy-first, domain-only cognitive tracking HUD foundation.
 * Strictly avoids page scraping, keystroke logging, screenshots, or camera streams.
 */

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

function initializeState() {
  chrome.storage.local.get([
    "activeDomain", "activeTitle", "category", "focusMode", "tabSwitches", "syncStatus",
    "activeDomainStartTime", "totalTimeByDomain", "unsyncedTimeSeconds"
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

function accumulateTime() {
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
    console.log("Active tab changed to:", newDomain);
    tabSwitches += 1;
    activeDomain = newDomain;
    activeTitle = title;
    category = info.category;
    focusMode = info.mode;
    activeDomainStartTime = Date.now();
    console.log("Domain timer updated for:", activeDomain);
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
  accumulateTime(); // Ensure latest time is tracked
  
  chrome.storage.local.get(["user_id", "userId", "active_session_id"], (result) => {
    const userId = result.user_id || result.userId;
    const sessionId = result.active_session_id || null;
    
    if (!userId) {
      syncStatus = "Waiting for Account";
      saveState();
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
        user_id: userId,
        session_id: sessionId,
        domain: activeDomain || "unknown",
        title: title,
        detected_mode: focusMode,
        activity_category: category,
        time_spent: unsyncedTimeSeconds,
        tab_switches: tabSwitches,
        timestamp: new Date().toISOString()
      };

      fetch("http://127.0.0.1:8000/extension/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(async (response) => {
        if (!response.ok) throw new Error("HTTP error " + response.status);
        
        console.log("Activity sync result: Success", unsyncedTimeSeconds, "seconds synced.");
        unsyncedTimeSeconds = 0;
        syncStatus = "Synced";
        saveState();
      })
      .catch((err) => {
        console.error("Cognivue Telemetry sync failed (backend offline):", err);
        syncStatus = "Cloud sync paused";
        saveState();
      });
    });
  });
}

// Active session & metrics polling (5 seconds)
function pollActiveSession() {
  chrome.storage.local.get(["user_id", "userId", "active_session_id"], (result) => {
    const userId = result.user_id || result.userId;
    if (!userId) return;

    // 1. Poll for active session
    fetch(`http://127.0.0.1:8000/sessions/active/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error("No active session");
        return res.json();
      })
      .then(session => {
        console.log("Active session response:", session);
        const sessionId = session?.id || session?.session_id || session?.active_session_id;
        if (sessionId) {
          chrome.storage.local.set({ active_session_id: sessionId });
          return sessionId;
        }
        throw new Error("No valid session ID in response");
      })
      .then(sessionId => {
        // 2. Fetch metrics
        fetch(`http://127.0.0.1:8000/metrics/latest/${sessionId}`)
          .then(res => {
            if (!res.ok) {
              if (res.status === 404) {
                return fetch(`http://127.0.0.1:8000/metrics/session/${sessionId}`)
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
            console.log("Metrics response:", metric);
            if (metric) {
              chrome.storage.local.set({ latestMetrics: metric });
            }
          })
          .catch(err => {
            console.warn("Could not fetch metrics:", err);
            // Don't clear latestMetrics aggressively, just log
          });
      })
      .catch(err => {
        chrome.storage.local.remove(["active_session_id", "latestMetrics"]);
      });
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
    saveState();
    chrome.storage.local.remove(["latestMetrics", "active_session_id"], () => {
      sendResponse({ status: "cleared" });
    });
    return true; // Keep channel open for async response
  }
});

initializeState();
