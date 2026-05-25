/**
 * Cognivue Focus Coach - Popup HUD Controller
 * 
 * Manages the reactive UI state of the premium dark glassmorphic popup HUD,
 * pulling active telemetry from chrome.storage.local and updating DOM components.
 */

// Helper to format elapsed time into highly readable segments
function formatDuration(totalSeconds) {
  if (totalSeconds === undefined || totalSeconds === null || totalSeconds < 0) {
    return "0s";
  }
  
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${seconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${seconds}s`;
}

// Configures UI styles and copy for each dynamic mode
const modeConfigurations = {
  Meeting: {
    bannerText: "Meeting Focus Mode Active",
    bannerClass: "bg-gradient-meeting",
    statusDotClass: "pulse-emerald",
    statusDotBg: "#34d399",
    statusText: "COLLABORATING",
    statusTextColor: "#34d399"
  },
  Coding: {
    bannerText: "Coding Focus Mode Active",
    bannerClass: "bg-gradient-coding",
    statusDotClass: "pulse-cyan",
    statusDotBg: "#22d3ee",
    statusText: "FLOW STATE",
    statusTextColor: "#22d3ee"
  },
  Study: {
    bannerText: "Deep Study Mode Active",
    bannerClass: "bg-gradient-study",
    statusDotClass: "pulse-cyan",
    statusDotBg: "#22d3ee",
    statusText: "HYPERFOCUS",
    statusTextColor: "#22d3ee"
  },
  Learning: {
    bannerText: "Learning Mode Active",
    bannerClass: "bg-gradient-learning",
    statusDotClass: "pulse-cyan",
    statusDotBg: "#22d3ee",
    statusText: "LEARNING",
    statusTextColor: "#22d3ee"
  },
  Distracting: {
    bannerText: "Distraction Risk Detected",
    bannerClass: "bg-gradient-distracting",
    statusDotClass: "pulse-red",
    statusDotBg: "#f87171",
    statusText: "DISTRACTED",
    statusTextColor: "#f87171"
  },
  General: {
    bannerText: "Universal Focus Mode Active",
    bannerClass: "bg-gradient-general",
    statusDotClass: "pulse-cyan",
    statusDotBg: "#22d3ee",
    statusText: "ACTIVE",
    statusTextColor: "#22d3ee"
  }
};

let isChangingAccount = false;

// Main function to read state from chrome.storage.local and update the HUD
function updatePopupHUD() {
  chrome.storage.local.get([
    "activeDomain",
    "category",
    "focusMode",
    "tabSwitches",
    "active_session_id",
    "syncStatus",
    "user_id",
    "userId",
    "trackingEnabled",
    "extension_connected",
    "totalTimeByDomain",
    "activeDomainStartTime",
    "latestMetrics"
  ], (result) => {
    const userId = result.user_id || result.userId;
    const trackingEnabled = result.trackingEnabled === true; // default to false
    const extensionConnected = !!result.extension_connected;
    const activeSessionId = result.active_session_id;

    const isConnected = !!userId && extensionConnected;
    const hasActiveSession = !!activeSessionId;
    const canTrack = isConnected && trackingEnabled && hasActiveSession;
    
    // 1. Resolve active domain display
    const domainEl = document.getElementById("active-domain");
    if (domainEl) {
      domainEl.textContent = result.activeDomain || "Empty Session";
    }

    // 2. Resolve activity category
    const categoryEl = document.getElementById("activity-category");
    if (categoryEl) {
      const catText = result.category || "General Browsing";
      categoryEl.textContent = catText;
    }

    // 3. Resolve detected mode
    const modeEl = document.getElementById("detected-mode");
    const resolvedMode = result.focusMode || "General";
    if (modeEl) {
      modeEl.textContent = resolvedMode;
    }

    // 4. Resolve and format time spent (Dynamic Calculation gated by tracking state)
    const timeEl = document.getElementById("time-spent");
    if (timeEl) {
      const activeDomain = result.activeDomain || "";
      const totalTimeByDomain = result.totalTimeByDomain || {};
      let activeDomainStartTime = result.activeDomainStartTime;
      
      // Initialize activeDomainStartTime if missing but domain exists
      if (!activeDomainStartTime && activeDomain) {
        activeDomainStartTime = Date.now();
        chrome.storage.local.set({ activeDomainStartTime: activeDomainStartTime });
      }

      const storedTotal = totalTimeByDomain[activeDomain] || 0;
      // Live elapsed seconds are ONLY counted when tracking is fully active
      const liveElapsed = (canTrack && activeDomain && activeDomain !== "newtab" && activeDomainStartTime)
        ? Math.floor((Date.now() - activeDomainStartTime) / 1000)
        : 0;
      
      const displayTime = storedTotal + liveElapsed;

      // Debug logs
      console.log("activeDomain", activeDomain);
      console.log("activeDomainStartTime", activeDomainStartTime);
      console.log("totalTimeByDomain", totalTimeByDomain);
      console.log("displayTime", displayTime);

      timeEl.textContent = formatDuration(displayTime);
    }

    // 5. Resolve tab switches
    const switchesEl = document.getElementById("tab-switches");
    if (switchesEl) {
      switchesEl.textContent = result.tabSwitches || 0;
    }

    // 6. Update dynamic banner styling & header copy (Strictly matching connection & tracking states)
    const bannerEl = document.getElementById("dynamic-mode-banner");
    const bannerTextEl = document.getElementById("dynamic-mode-text");
    const statusDotEl = document.getElementById("hud-status-dot");
    const statusTextEl = document.getElementById("hud-status-text");

    if (bannerEl && bannerTextEl && statusDotEl && statusTextEl) {
      if (!isConnected) {
        // State 1: Local only / Not connected
        statusTextEl.textContent = "NOT CONNECTED";
        statusTextEl.style.color = "var(--text-subtle)";
        
        statusDotEl.className = "status-dot status-dot-inactive";
        statusDotEl.style.backgroundColor = "var(--text-subtle)";
        statusDotEl.style.boxShadow = "none";
        
        bannerTextEl.textContent = "Connect account to start tracking";
        bannerEl.className = "mode-banner bg-gradient-paused";
      } else if (result.syncStatus === "Cloud sync paused") {
        // State 1.5: Connected but backend unreachable
        statusTextEl.textContent = "CLOUD SYNC PAUSED";
        statusTextEl.style.color = "var(--amber-accent)";
        
        statusDotEl.className = "status-dot pulse-amber";
        statusDotEl.style.backgroundColor = "var(--amber-accent)";
        statusDotEl.style.boxShadow = "0 0 8px var(--amber-accent)";
        
        bannerTextEl.textContent = "Cloud sync paused - Backend offline";
        bannerEl.className = "mode-banner bg-gradient-paused";
      } else if (!trackingEnabled) {
        // State 2: Connected + Paused
        statusTextEl.textContent = "PAUSED";
        statusTextEl.style.color = "var(--amber-accent)";
        
        statusDotEl.className = "status-dot pulse-amber";
        statusDotEl.style.backgroundColor = "var(--amber-accent)";
        statusDotEl.style.boxShadow = "0 0 8px var(--amber-accent)";
        
        bannerTextEl.textContent = "Tracking Paused";
        bannerEl.className = "mode-banner bg-gradient-paused";
      } else if (!hasActiveSession) {
        // State 3: Connected + Tracking active but no active session exists
        statusTextEl.textContent = "WAITING";
        statusTextEl.style.color = "var(--amber-accent)";
        
        statusDotEl.className = "status-dot pulse-amber";
        statusDotEl.style.backgroundColor = "var(--amber-accent)";
        statusDotEl.style.boxShadow = "0 0 8px var(--amber-accent)";
        
        bannerTextEl.textContent = "Waiting for active Cognivue session";
        bannerEl.className = "mode-banner bg-gradient-paused";
      } else {
        // State 4: Connected + Tracking active + Session exists
        const config = modeConfigurations[resolvedMode] || modeConfigurations.General;
        
        statusTextEl.textContent = config.statusText;
        statusTextEl.style.color = config.statusTextColor;
        
        statusDotEl.className = "status-dot " + config.statusDotClass;
        statusDotEl.style.backgroundColor = config.statusDotBg;
        statusDotEl.style.boxShadow = `0 0 8px ${config.statusDotBg}`;
        
        bannerTextEl.textContent = config.bannerText;
        bannerEl.className = "mode-banner " + config.bannerClass;
      }
    }

    // 7. Update Cloud Sync Details
    const syncStatus = result.syncStatus || "Local only";
    
    const syncIcon = document.getElementById("sync-icon");
    const syncMsg = document.getElementById("sync-status-msg");
    const connectLaterBadge = document.getElementById("connect-later-badge");
    const linkedUserContainer = document.getElementById("linked-user-container");
    const linkedUserId = document.getElementById("linked-user-id");

    const connectFlowContainer = document.getElementById("connect-flow-container");
    const cancelConnectBtn = document.getElementById("cancel-connect-btn");
    const toggleTrackingBtn = document.getElementById("toggle-tracking-btn");

    if (toggleTrackingBtn) {
      if (trackingEnabled) {
        toggleTrackingBtn.textContent = "Pause";
        toggleTrackingBtn.className = "hud-btn";
      } else {
        toggleTrackingBtn.textContent = "Resume";
        toggleTrackingBtn.className = "hud-btn hud-btn-cyan";
      }
    }

    // Handle Connection Flow Views & Changing Account Forms
    const connectFlowTitle = document.getElementById("connect-flow-title");
    if (connectFlowTitle) {
      if (isChangingAccount) {
        connectFlowTitle.textContent = "Paste new Cognivue connection key";
      } else {
        connectFlowTitle.textContent = "DEMO CONNECTION KEY";
      }
    }

    if (!isConnected) {
      isChangingAccount = false;
      if (connectFlowContainer) connectFlowContainer.style.display = "block";
      if (linkedUserContainer) linkedUserContainer.style.display = "none";
      if (cancelConnectBtn) cancelConnectBtn.style.display = "none";
    } else {
      if (isChangingAccount) {
        if (connectFlowContainer) connectFlowContainer.style.display = "block";
        if (linkedUserContainer) linkedUserContainer.style.display = "none";
        if (cancelConnectBtn) cancelConnectBtn.style.display = "inline-block";
      } else {
        if (connectFlowContainer) connectFlowContainer.style.display = "none";
        if (linkedUserContainer) linkedUserContainer.style.display = "block";
        if (cancelConnectBtn) cancelConnectBtn.style.display = "none";
      }
    }

    // Proactively hide validation errors if connection container is closed
    const connectErrorMsg = document.getElementById("connect-error-msg");
    if (connectErrorMsg && connectFlowContainer && connectFlowContainer.style.display === "none") {
      connectErrorMsg.style.display = "none";
      connectErrorMsg.textContent = "";
    }

    if (syncMsg) {
      if (!isConnected) {
        syncMsg.textContent = "Not connected to Cognivue.";
        if (syncIcon) syncIcon.textContent = "🔌";
        if (connectLaterBadge) {
          connectLaterBadge.style.display = "block";
          connectLaterBadge.textContent = "Local Only";
          connectLaterBadge.style.borderColor = "var(--border-white)";
          connectLaterBadge.style.color = "var(--text-subtle)";
        }
      } else {
        if (linkedUserId) {
          linkedUserId.textContent = userId.substring(0, 8) + "...";
        }
        
        if (!trackingEnabled) {
          syncMsg.textContent = "Tracking is paused.";
          if (syncIcon) syncIcon.textContent = "⏸️";
          if (connectLaterBadge) {
            connectLaterBadge.style.display = "block";
            connectLaterBadge.textContent = "Paused";
            connectLaterBadge.style.borderColor = "rgba(251, 191, 36, 0.3)";
            connectLaterBadge.style.color = "var(--amber-accent)";
          }
        } else if (!hasActiveSession) {
          syncMsg.textContent = "Waiting for session telemetry...";
          if (syncIcon) syncIcon.textContent = "⏳";
          if (connectLaterBadge) {
            connectLaterBadge.style.display = "block";
            connectLaterBadge.textContent = "Waiting";
            connectLaterBadge.style.borderColor = "rgba(251, 191, 36, 0.3)";
            connectLaterBadge.style.color = "var(--amber-accent)";
          }
        } else if (syncStatus === "Synced") {
          syncMsg.textContent = "Telemetry synced with Cloud.";
          if (syncIcon) syncIcon.textContent = "☁️";
          if (connectLaterBadge) {
            connectLaterBadge.style.display = "block";
            connectLaterBadge.textContent = "Synced";
            connectLaterBadge.style.borderColor = "rgba(52, 211, 153, 0.3)";
            connectLaterBadge.style.color = "var(--emerald-accent)";
          }
        } else if (syncStatus === "Cloud sync paused") {
          syncMsg.textContent = "Sync offline. Telemetry cached.";
          if (syncIcon) syncIcon.textContent = "🔌";
          if (connectLaterBadge) {
            connectLaterBadge.style.display = "block";
            connectLaterBadge.textContent = "Cached";
            connectLaterBadge.style.borderColor = "rgba(251, 191, 36, 0.3)";
            connectLaterBadge.style.color = "var(--amber-accent)";
          }
        } else {
          syncMsg.textContent = syncStatus;
          if (syncIcon) syncIcon.textContent = "✨";
          if (connectLaterBadge) {
            connectLaterBadge.style.display = "block";
            connectLaterBadge.textContent = "Local";
            connectLaterBadge.style.borderColor = "var(--border-white)";
            connectLaterBadge.style.color = "var(--text-muted)";
          }
        }
      }
    }
  });
}

// Run immediately on page load
document.addEventListener("DOMContentLoaded", () => {
  updatePopupHUD();
  
  // Tick updates every 500ms to keep duration and metrics perfectly in sync
  const liveInterval = setInterval(updatePopupHUD, 500);

  // Connection logic
  const connectBtn = document.getElementById("connect-btn");
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      const input = document.getElementById("connect-key-input");
      const errorMsg = document.getElementById("connect-error-msg");
      
      if (errorMsg) {
        errorMsg.style.display = "none";
        errorMsg.textContent = "";
      }

      if (input && input.value) {
        try {
          const decoded = atob(input.value.trim()); // Base64 decode demo key
          
          if (!decoded || decoded.length < 5 || decoded === "undefined") {
            throw new Error("Invalid demo key");
          }

          // Fresh link or switching accounts: reset timers and tab counts first (Requirement 4)
          chrome.runtime.sendMessage({ action: "reset_extension_data" }, (response) => {
            chrome.storage.local.set({ 
              user_id: decoded, 
              cognivue_user_id: decoded, 
              extension_connected: true, 
              trackingEnabled: true,
              syncStatus: "Synced" 
            }, () => {
              isChangingAccount = false;
              input.value = "";
              if (errorMsg) {
                errorMsg.style.display = "none";
              }
              updatePopupHUD();
            });
          });
        } catch (e) {
          // Invalid key: show inline error message, do not close form, do not disconnect old account (Requirement 5)
          if (errorMsg) {
            errorMsg.textContent = "Invalid base64 connection key.";
            errorMsg.style.display = "block";
          }
        }
      }
    });
  }

  // Cancel Connect button logic (restore old account)
  const cancelConnectBtn = document.getElementById("cancel-connect-btn");
  if (cancelConnectBtn) {
    cancelConnectBtn.addEventListener("click", () => {
      isChangingAccount = false;
      const input = document.getElementById("connect-key-input");
      if (input) {
        input.value = "";
      }
      const errorMsg = document.getElementById("connect-error-msg");
      if (errorMsg) {
        errorMsg.style.display = "none";
        errorMsg.textContent = "";
      }
      updatePopupHUD();
    });
  }

  // Toggle Tracking Pause/Resume logic
  const toggleTrackingBtn = document.getElementById("toggle-tracking-btn");
  if (toggleTrackingBtn) {
    toggleTrackingBtn.addEventListener("click", () => {
      chrome.storage.local.get(["trackingEnabled"], (res) => {
        const current = res.trackingEnabled === true;
        chrome.storage.local.set({ trackingEnabled: !current }, () => {
          updatePopupHUD();
        });
      });
    });
  }

  const changeAccountBtn = document.getElementById("change-account-btn");
  if (changeAccountBtn) {
    changeAccountBtn.addEventListener("click", () => {
      isChangingAccount = true;
      const errorMsg = document.getElementById("connect-error-msg");
      if (errorMsg) {
        errorMsg.style.display = "none";
        errorMsg.textContent = "";
      }
      updatePopupHUD();
    });
  }

  const disconnectBtn = document.getElementById("disconnect-btn");
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", () => {
      // Disconnect: send clear message to background to reset timer totals, tab switches, and categories
      chrome.runtime.sendMessage({ action: "reset_extension_data" }, (response) => {
        // Clear all connection state and set trackingEnabled back to false (Requirement 5)
        chrome.storage.local.set({ trackingEnabled: false }, () => {
          chrome.storage.local.remove([
            "user_id", 
            "cognivue_user_id", 
            "extension_connected", 
            "active_session_id", 
            "syncStatus",
            "latestMetrics"
          ], () => {
            isChangingAccount = false;
            updatePopupHUD();
          });
        });
      });
    });
  }

  const resetDataBtn = document.getElementById("reset-data-btn");
  if (resetDataBtn) {
    resetDataBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "reset_extension_data" }, (response) => {
        if (response && response.status === "cleared") {
          updatePopupHUD();
        }
      });
    });
  }

  // Clear interval on window close
  window.addEventListener("unload", () => {
    clearInterval(liveInterval);
  });
});

