/**
 * Cognivue Focus Coach - Background Service Worker (Manifest V3)
 * 
 * Privacy-first, domain-only cognitive tracking HUD foundation.
 * Strictly avoids page scraping, keystroke logging, screenshots, or camera streams.
 */

// Extensible Domain Categorization Function
function categorizeDomain(urlStr) {
  if (!urlStr) {
    return {
      category: "General Browsing",
      mode: "General",
      riskLevel: "low",
      label: "Universal Focus Mode Active"
    };
  }

  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    const domain = host.replace(/^www\./, '');

    // 1. Meeting Mode
    if (domain === 'meet.google.com' || 
        domain.includes('zoom.us') || 
        domain.includes('teams.microsoft.com') || 
        domain.includes('teams.live.com')) {
      return {
        category: "Meeting / Collaboration",
        mode: "Meeting",
        riskLevel: "low",
        label: "Meeting Focus Mode Active"
      };
    }

    // 2. Coding Mode
    if (domain === 'github.com' || 
        domain === 'stackoverflow.com' || 
        domain === 'localhost' || 
        domain === '127.0.0.1' || 
        domain === 'codeforces.com' || 
        domain === 'leetcode.com') {
      return {
        category: "Development",
        mode: "Coding",
        riskLevel: "low",
        label: "Coding Focus Mode Active"
      };
    }

    // 3. Study / Reading Mode
    if (domain === 'docs.google.com' || 
        domain === 'notion.so' || 
        domain === 'medium.com' || 
        domain === 'arxiv.org') {
      return {
        category: "Study / Writing",
        mode: "Study",
        riskLevel: "low",
        label: "Deep Study Mode Active"
      };
    }

    // 4. Learning Mode
    if (domain.includes('youtube.com') || 
        domain === 'coursera.org' || 
        domain === 'udemy.com') {
      return {
        category: "Learning / Tutorial",
        mode: "Learning",
        riskLevel: "low",
        label: "Learning Mode Active"
      };
    }

    // 5. Distraction Risk
    if (domain === 'instagram.com' || 
        domain === 'x.com' || 
        domain === 'twitter.com' || 
        domain === 'reddit.com') {
      return {
        category: "Social / Entertainment",
        mode: "Distracting",
        riskLevel: "high",
        label: "Distraction Risk Detected"
      };
    }

    // 6. General Focus Mode
    return {
      category: "General Browsing",
      mode: "General",
      riskLevel: "low",
      label: "Universal Focus Mode Active"
    };

  } catch (e) {
    // Fail-safe default if URL parsing fails (e.g. chrome:// tabs)
    return {
      category: "System / Navigation",
      mode: "General",
      riskLevel: "low",
      label: "Universal Focus Mode Active"
    };
  }
}

// Extracted helper to retrieve domain string from URL
function getDomainFromUrl(urlStr) {
  if (!urlStr) return "";
  try {
    const url = new URL(urlStr);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    return "";
  }
}

// Active tracking session state in background memory
let activeDomain = "";
let category = "General Browsing";
let focusMode = "General";
let timeSpentSeconds = 0;
let tabSwitches = 0;
let lastUpdated = Date.now();
let syncStatus = "Local only";

// Restore from chrome.storage.local on launch
function initializeState() {
  chrome.storage.local.get([
    "activeDomain",
    "category",
    "focusMode",
    "timeSpentSeconds",
    "tabSwitches",
    "lastUpdated",
    "syncStatus"
  ], (result) => {
    if (result.activeDomain !== undefined) {
      activeDomain = result.activeDomain;
      category = result.category || "General Browsing";
      focusMode = result.focusMode || "General";
      timeSpentSeconds = result.timeSpentSeconds || 0;
      tabSwitches = result.tabSwitches || 0;
      lastUpdated = result.lastUpdated || Date.now();
      syncStatus = result.syncStatus || "Local only";
    } else {
      saveState();
    }
  });
}

// Persist standard structured state to chrome.storage.local
function saveState() {
  chrome.storage.local.set({
    activeDomain,
    category,
    focusMode,
    timeSpentSeconds,
    tabSwitches,
    lastUpdated,
    syncStatus
  });
}

// Main tick update (calculates precise delta since last tick)
function updateHeartbeat() {
  const now = Date.now();
  const elapsedMs = now - lastUpdated;
  
  if (activeDomain && activeDomain !== "newtab" && activeDomain !== "") {
    timeSpentSeconds += Math.round(elapsedMs / 1000);
  }
  
  lastUpdated = now;
  saveState();
}

// Reset timer state when shifting to a brand new domain
function handleTabTransition(url) {
  const now = Date.now();
  const elapsedMs = now - lastUpdated;
  
  // Save previous domain's accumulated time to prevent loss on fast changes
  if (activeDomain && activeDomain !== "newtab" && activeDomain !== "") {
    timeSpentSeconds += Math.round(elapsedMs / 1000);
  }

  const newDomain = getDomainFromUrl(url);
  const info = categorizeDomain(url);

  if (newDomain !== activeDomain) {
    tabSwitches += 1;
    activeDomain = newDomain;
    category = info.category;
    focusMode = info.mode; // Meeting, Coding, Study, Learning, Distracting, General
    timeSpentSeconds = 0; // Reset active duration for the newly activated domain
  }

  lastUpdated = now;
  saveState();
}

// 1. Tab activated listener (user clicks different tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    handleTabTransition(tab.url || tab.pendingUrl);
  });
});

// 2. Tab updated listener (user navigates to another URL in same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    // Only transition if the updated tab is the active tab in its window
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const activeTab = activeTabs[0];
      if (activeTab && activeTab.id === tabId) {
        handleTabTransition(changeInfo.url);
      }
    });
  }
});

// 3. Window focus listener (user switches applications/windows)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser is out of focus, add time elapsed and stop actively accumulating
    const now = Date.now();
    const elapsedMs = now - lastUpdated;
    if (activeDomain && activeDomain !== "newtab" && activeDomain !== "") {
      timeSpentSeconds += Math.round(elapsedMs / 1000);
    }
    lastUpdated = now;
    saveState();
  } else {
    // Browser is back in focus, update active tab details
    chrome.tabs.query({ active: true, windowId: windowId }, (activeTabs) => {
      const activeTab = activeTabs[0];
      if (activeTab) {
        handleTabTransition(activeTab.url || activeTab.pendingUrl);
      }
    });
  }
});

// Synchronization handler (every 30 seconds)
function syncTelemetry() {
  chrome.storage.local.get(["user_id", "userId"], (result) => {
    const userId = result.user_id || result.userId;
    
    if (!userId) {
      syncStatus = "Waiting for Account";
      saveState();
      return;
    }

    // Avoid duplicate spam: If duration is 0 and tab_switches is 0, skip sync
    if (timeSpentSeconds === 0 && tabSwitches === 0) {
      syncStatus = "Synced";
      saveState();
      return;
    }

    const riskLevel = focusMode === "Distracting" ? "High" : "Low";

    const payload = {
      user_id: userId,
      domain: activeDomain || "unknown",
      category: category,
      mode: focusMode,
      risk_level: riskLevel,
      active_duration_seconds: timeSpentSeconds,
      tab_switches: tabSwitches
    };

    fetch("http://127.0.0.1:8000/extension/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      
      // Reset interval counters: active_duration_seconds, tab_switches
      timeSpentSeconds = 0;
      tabSwitches = 0;
      syncStatus = "Synced";
      lastUpdated = Date.now();
      saveState();
    })
    .catch((err) => {
      console.error("Cognivue Telemetry sync failed (backend offline):", err);
      syncStatus = "Backend offline";
      saveState();
    });
  });
}

// Alarm / Heartbeat setup to drive live incremental counts (1-second updates)
chrome.alarms.create("hud-heartbeat", { periodInMinutes: 1 / 60 });

// Sync alarm trigger (runs every 30 seconds / 0.5 minutes)
chrome.alarms.create("telemetry-sync", { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "hud-heartbeat") {
    updateHeartbeat();
  } else if (alarm.name === "telemetry-sync") {
    syncTelemetry();
  }
});

// Initialize on service worker startup
initializeState();

// TODO: Later connect to Cognivue CV camera permission system
// TODO: Later fetch latest backend metrics if active_session_id exists
// TODO: Later show floating overlay across supported websites
// TODO: Later allow user to customize productive/distracting domains
