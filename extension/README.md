# Cognivue Chrome Extension Companion

A Manifest V3 Chrome Extension serving as a lightweight contextual focus coach in the browser toolbar, tracking active tab focus and time intervals.

## Companion Overview
The Cognivue toolbar companion runs in Google Chrome and Chrome-based browsers. It helps the local cognitive engine categorize web browsing behavior (e.g. distinguishing productive work on GitHub from distracting cycles on social media) and sends telemetry data to the web app dashboard.

---

## Strict Privacy Boundaries

Cognivue is built with a privacy-first architecture. The extension collects only what is absolutely necessary to compute productivity scores.

### What it tracks:
* Active Domain: The base domain name of the tab you are currently viewing (e.g. github.com, docs.google.com).
* Active Mode & Category: Auto-classifies the domain into productivity modes (Coding, Learning, Meeting, Study, Distracting, General).
* Tab Switch Count: Frequency of context switching during a sync interval.
* Time Spent: Elapsed active focus duration on a domain (pauses when computer goes idle or tabs switch).
* Heartbeat Connection: Periodic 5-second lightweight pings mapping active status to backend when focus sessions are waiting.

### What it NEVER tracks:
* Keystrokes: The extension never monitors typing or keystroke sequences.
* Screenshots: No screens are captured, recorded, or saved.
* Page Content: No inputs, text fields, page html, or private content are read.
* Raw Camera/Video feeds: Eye mesh computer vision calculations are done entirely inside the main React web app sandbox, not inside the extension background thread.

---

## Sub-module Contents
* manifest.json: Defines extension metadata, declarative host permission requests, and active service worker scopes.
* background.js: Service worker running on alarms, accumulating focus times on domains, managing pauses, and sending heartbeat sync payloads.
* popup.html / popup.js / popup.css: Premium dark glassmorphic toolbar user interface with account connect/disconnect selectors, timer meters, and manual sync controllers.

---

## Installation & Setup

1. Open Google Chrome Extensions Manager:
   - In Chrome, navigate to chrome://extensions in the address bar.
2. Enable Developer Mode:
   - Toggle the Developer mode switch in the top-right corner to active.
3. Load the unpacked project:
   - Click the Load unpacked button in the top-left corner.
   - Select the /extension directory of this cloned repository.
4. Pin the extension:
   - Click the extensions puzzle icon in your Chrome toolbar and pin Cognivue.

---

## Connection Flow

To link the toolbar HUD to your active web account:
1. Open the hosted Cognivue web app dashboard.
2. Go to the Extension page or Settings > Chrome extension section.
3. Copy your base64 local demo connection key.
4. Click the Cognivue icon in your browser toolbar to open the popup HUD.
5. Click Connect, paste your key, and submit.
6. The extension will link successfully, and sync status will update to "Synced".

---

## Telemetry heartbeats
When the extension is linked but no focus session is actively running on the dashboard, the service worker switches to lightweight Heartbeat Sync:
* Submits zeroed accumulators (time_spent: 0, tab_switches: 0) and sets session_id to null to isolate them from analytical averages.
* Prevents data pollution, while ensuring the Settings and Sidebar pages can reactively display the "Extension: Connected" status in real time.

---

## Troubleshooting

If the popup HUD displays CLOUD SYNC PAUSED or fails to update:
1. Check Backend URL: Ensure the API_BASE_URL inside background.js matches your running backend endpoint (e.g. http://127.0.0.1:8000 locally, or your production hosted URL).
2. Reload Extension: Open chrome://extensions and click the circular refresh arrow on the Cognivue card.
3. Reset Extension Data: Open the extension popup, click Reset Data (or Disconnect to clear linked states) to flush accumulated domain counters.
4. Inspect Console Logs: Right-click the extension icon, choose Inspect popup (or inspect background page) to review detailed HTTP failure logs and payloads.
5. Verify Render API Logs: Ensure your FastAPI backend Render log has no incoming validation schema rejects (sync checks automatically clean invalid session IDs to None).

### Deployed API Endpoint
Configure the deployed API address at the top of /extension/background.js:
```javascript
const API_BASE_URL = "http://127.0.0.1:8000"; // [Add Render API hosted endpoint link here for production]
```
