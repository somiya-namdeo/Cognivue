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
    "timeSpentSeconds",
    "tabSwitches",
    "active_session_id",
    "syncStatus",
    "user_id",
    "userId"
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

    // 4. Resolve and format time spent
    const timeEl = document.getElementById("time-spent");
    if (timeEl) {
      timeEl.textContent = formatDuration(result.timeSpentSeconds);
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

    // 7. Check for real-time Cognivue session metrics
    handleCognitiveMetricsFetch(result.active_session_id);

    // 8. Update cloud synchronization card and display "Connect later" helper if no user_id exists
    const syncStatus = result.syncStatus || "Local only";
    const userId = result.user_id || result.userId;
    
    const syncIcon = document.getElementById("sync-icon");
    const syncMsg = document.getElementById("sync-status-msg");
    const connectLaterBadge = document.getElementById("connect-later-badge");

    if (syncMsg) {
      if (!userId) {
        // "Connect later" helper state - extension still works fully locally!
        syncMsg.textContent = "Connect account later. Tracking active locally.";
        if (syncIcon) syncIcon.textContent = "👤";
        if (connectLaterBadge) {
          connectLaterBadge.style.display = "block";
          connectLaterBadge.textContent = "Local Only";
          connectLaterBadge.style.borderColor = "var(--border-white)";
          connectLaterBadge.style.color = "var(--text-muted)";
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
      } else if (syncStatus === "Backend offline") {
        syncMsg.textContent = "Cloud sync offline. Retrying...";
        if (syncIcon) syncIcon.textContent = "🔌";
        if (connectLaterBadge) {
          connectLaterBadge.style.display = "block";
          connectLaterBadge.textContent = "Cached";
          connectLaterBadge.style.borderColor = "rgba(251, 191, 36, 0.3)";
          connectLaterBadge.style.color = "var(--amber-accent)";
        }
      } else if (syncStatus === "Waiting for Account") {
        syncMsg.textContent = "Connect account later. Tracking active locally.";
        if (syncIcon) syncIcon.textContent = "👤";
        if (connectLaterBadge) {
          connectLaterBadge.style.display = "block";
          connectLaterBadge.textContent = "Local Only";
          connectLaterBadge.style.borderColor = "var(--border-white)";
          connectLaterBadge.style.color = "var(--text-muted)";
        }
      } else {
        syncMsg.textContent = "Universal focus tracking active.";
        if (syncIcon) syncIcon.textContent = "✨";
        if (connectLaterBadge) {
          connectLaterBadge.style.display = "block";
          connectLaterBadge.textContent = "Local";
          connectLaterBadge.style.borderColor = "var(--border-white)";
          connectLaterBadge.style.color = "var(--text-muted)";
        }
      }
    }
  });
}

// Prepare to query backend metrics once active_session_id is saved
function handleCognitiveMetricsFetch(sessionId) {
  const focusValEl = document.getElementById("metric-focus-val");
  const focusBarEl = document.getElementById("metric-focus-bar");
  const loadValEl = document.getElementById("metric-load-val");
  const fatigueValEl = document.getElementById("metric-fatigue-val");

  if (!sessionId) {
    // Show premium waiting state placeholders (as requested)
    if (focusValEl) {
      focusValEl.textContent = "Waiting for Cognivue session";
      focusValEl.className = "metric-val text-cyan italic";
    }
    if (focusBarEl) {
      focusBarEl.style.width = "0%";
    }
    if (loadValEl) {
      loadValEl.textContent = "—";
    }
    if (fatigueValEl) {
      fatigueValEl.textContent = "—";
    }
    return;
  }

  // TODO: Later fetch latest backend metrics
  // Once active_session_id exists in storage, we can fetch dynamic CV telemetry:
  //
  // fetch(`http://127.0.0.1:8000/metrics/latest/${sessionId}`)
  //   .then(res => res.json())
  //   .then(metric => {
  //     const focus = Math.round(metric.focus_score);
  //     const load = Math.round(metric.cognitive_load);
  //     
  //     focusValEl.textContent = `${focus}%`;
  //     focusValEl.className = "metric-val text-cyan font-bold";
  //     focusBarEl.style.width = `${focus}%`;
  //     
  //     loadValEl.textContent = `${load}%`;
  //     fatigueValEl.textContent = metric.fatigue_score >= 71 ? "High" : metric.fatigue_score >= 36 ? "Medium" : "Low";
  //   })
  //   .catch(err => console.error("Error fetching live HUD metrics:", err));
}

// Run immediately on page load
document.addEventListener("DOMContentLoaded", () => {
  updatePopupHUD();
  
  // Tick updates every 500ms to keep duration and metrics perfectly in sync
  const liveInterval = setInterval(updatePopupHUD, 500);

  // Clear interval on window close
  window.addEventListener("unload", () => {
    clearInterval(liveInterval);
  });
});

// ==========================================
// ARCHITECTURAL FUTURE DEVELOPMENTS (TODOs)
// ==========================================
// TODO: Later connect to Cognivue CV camera permission system to control desktop webcam
// TODO: Later show floating overlay across supported websites (Google Meet, Zoom) using content scripts
// TODO: Later allow user to customize productive/distracting domains via a premium settings panel
