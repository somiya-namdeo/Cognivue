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
    "totalTimeByDomain",
    "activeDomainStartTime",
    "latestMetrics"
  ], (result) => {
    
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

    // 4. Resolve and format time spent (Dynamic Calculation)
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
      const liveElapsed = (activeDomain && activeDomain !== "newtab" && activeDomainStartTime)
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

    // 6. Update dynamic banner styling & header copy
    const bannerEl = document.getElementById("dynamic-mode-banner");
    const bannerTextEl = document.getElementById("dynamic-mode-text");
    const statusDotEl = document.getElementById("hud-status-dot");
    const statusTextEl = document.getElementById("hud-status-text");

    const config = modeConfigurations[resolvedMode] || modeConfigurations.General;

    if (bannerEl && bannerTextEl) {
      bannerTextEl.textContent = config.bannerText;
      
      // Reset all styling classes and apply correct gradient theme
      bannerEl.className = "mode-banner";
      bannerEl.classList.add(config.bannerClass);
    }

    if (statusDotEl && statusTextEl) {
      statusTextEl.textContent = config.statusText;
      statusTextEl.style.color = config.statusTextColor;
      
      // Update glow class
      statusDotEl.className = "status-dot";
      statusDotEl.classList.add(config.statusDotClass);
      statusDotEl.style.backgroundColor = config.statusDotBg;
      statusDotEl.style.boxShadow = `0 0 8px ${config.statusDotBg}`;
    }
    // 8. Update cloud synchronization card and display "Connect later" helper if no user_id exists
    const syncStatus = result.syncStatus || "Local only";
    const userId = result.user_id || result.userId;
    
    const syncIcon = document.getElementById("sync-icon");
    const syncMsg = document.getElementById("sync-status-msg");
    const connectLaterBadge = document.getElementById("connect-later-badge");
    const linkedUserContainer = document.getElementById("linked-user-container");
    const linkedUserId = document.getElementById("linked-user-id");

    const connectFlowContainer = document.getElementById("connect-flow-container");

    if (syncMsg) {
      if (!userId) {
        // "Connect later" helper state
        syncMsg.textContent = "Demo tracking active locally.";
        if (syncIcon) syncIcon.textContent = "👤";
        if (connectLaterBadge) {
          connectLaterBadge.style.display = "block";
          connectLaterBadge.textContent = "Local Only";
          connectLaterBadge.style.borderColor = "var(--border-white)";
          connectLaterBadge.style.color = "var(--text-muted)";
        }
        if (connectFlowContainer) {
          connectFlowContainer.style.display = "block";
        }
        if (linkedUserContainer) {
          linkedUserContainer.style.display = "none";
        }
      } else {
        if (connectFlowContainer) {
          connectFlowContainer.style.display = "none";
        }
        if (linkedUserContainer && linkedUserId) {
          linkedUserContainer.style.display = "block";
          linkedUserId.textContent = userId.substring(0, 8) + "...";
        }
        if (syncStatus === "Synced") {
          syncMsg.textContent = "Telemetry synced with Cloud.";
          if (syncIcon) syncIcon.textContent = "☁️";
          if (connectLaterBadge) {
            connectLaterBadge.style.display = "block";
            connectLaterBadge.textContent = "Synced";
            connectLaterBadge.style.borderColor = "rgba(52, 211, 153, 0.3)";
            connectLaterBadge.style.color = "var(--emerald-accent)";
          }
        } else if (syncStatus === "Cloud sync paused") {
          syncMsg.textContent = "Cloud sync paused. Tracking locally...";
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
      if (input && input.value) {
        try {
          const decoded = atob(input.value); // Base64 decode demo key
          
          if (!decoded || decoded.length < 5 || decoded === "undefined") {
            throw new Error("Invalid demo key");
          }

          chrome.storage.local.set({ 
            user_id: decoded, 
            cognivue_user_id: decoded, 
            extension_connected: true, 
            syncStatus: "Synced" 
          }, () => {
            updatePopupHUD();
          });
        } catch (e) {
          alert("Invalid base64 demo key.");
        }
      }
    });
  }

  const changeAccountBtn = document.getElementById("change-account-btn");
  if (changeAccountBtn) {
    changeAccountBtn.addEventListener("click", () => {
      const connectFlowContainer = document.getElementById("connect-flow-container");
      if (connectFlowContainer) {
        connectFlowContainer.style.display = "block";
      }
    });
  }

  const disconnectBtn = document.getElementById("disconnect-btn");
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", () => {
      chrome.storage.local.remove([
        "user_id", 
        "cognivue_user_id", 
        "extension_connected", 
        "active_session_id", 
        "syncStatus",
        "latestMetrics"
      ], () => {
        updatePopupHUD();
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
