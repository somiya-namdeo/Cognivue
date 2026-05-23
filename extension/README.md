# Cognivue Focus Coach — Universal Browser Companion (MV3)

A privacy-first real-time cognitive HUD browser extension designed to track active focus windows, categorize browsing contexts universally, and prepare for live desktop web-app synchronizations.

---

## 🛡️ Privacy Guarantee & Ethos

This extension is built on strict safety and transparency principles:
- **No Page Scraping**: Never reads or parses the HTML content of your websites.
- **No Keystroke Tracking**: Never logs or records keystrokes.
- **No Screenshots**: Never captures screenshots of your browser.
- **No Browsing History Export**: Never compiles or uploads raw browsing logs.
- **Zero Webcam Access in Extension**: Facial telemetry is processed securely via the main desktop agent, maintaining full camera transparency.

**This extension works universally across websites by categorizing only the active domain, not reading page content.**

---

## ⚡ Universal Cognitive Modes

The HUD dynamically evaluates the active tab's domain and transitions between specialized focus modes, updating the header banner and color accents automatically:

| Domain | Cognitive Mode | HUD Header | Category Badge | Accent Color |
| :--- | :--- | :--- | :--- | :--- |
| `meet.google.com`, `zoom.us`, `teams.microsoft.com` | **Meeting** | Meeting Focus Mode Active | Meeting / Collaboration | Emerald / Green |
| `github.com`, `stackoverflow.com`, `localhost`, `leetcode.com`, `codeforces.com` | **Coding** | Coding Focus Mode Active | Development | Violet / Purple |
| `docs.google.com`, `notion.so`, `medium.com`, `arxiv.org` | **Study** | Deep Study Mode Active | Study / Writing | Blue / Slate |
| `youtube.com`, `coursera.org`, `udemy.com` | **Learning** | Learning Mode Active | Learning / Tutorial | Cyan / Light Blue |
| `instagram.com`, `x.com`, `twitter.com`, `reddit.com` | **Distracting** | Distraction Risk Detected | Social / Entertainment | Red / Amber |
| *All other domains* | **General** | Universal Focus Mode Active | General Browsing | Cyan / Violet |

---

## 🚀 How to Install and Test Locally

Chrome Web Store publishing is planned for the production release. For now, you can install the extension locally:

1. **Download & Extract**: Download the `cognivue-extension.zip` from the dashboard and extract it to a folder on your computer.
2. **Open Extensions**: In your browser, navigate to:
   ```txt
   chrome://extensions
   ```
3. **Enable Developer Mode**: Toggle the "Developer mode" switch in the top right corner.
4. **Load Unpacked**: Click the **Load unpacked** button in the top-left corner.
5. **Select Folder**: Select your extracted `cognivue-extension` folder.
6. **Pin the Extension**: Click the Extensions puzzle icon in the toolbar, pin **Cognivue Focus Coach**, and verify:
   - The **Active Domain** and **Activity Category** update reactively.
   - The **Detected Mode** changes alongside the dynamic header copy and gradient animations.
   - The **Time Spent** ticks up second-by-second while you focus on the tab.
   - **Tab Switches** increment every time you click active windows.

---

## 🔮 Future Roadmap (TODOs)

- **Backend Metrics Integration**: Fetch dynamic face focus telemetry from `GET http://127.0.0.1:8000/metrics/latest/{session_id}`.
- **Web App Session Sync**: Dynamically save the active focus `session_id` to `chrome.storage.local` to trigger automatic real-time metric HUD tracking.
- **Optional Google Meet Floating Overlay**: Create a configurable picture-in-picture style focus ring on camera/meeting calls using local content-scripts.
- **MediaPipe OpenCV CV Telemetry**: Seamlessly connect CV visual gaze variables directly into the dashboard.
- **Custom Site Classification**: Allow users to customize their personal list of productive, educational, and distracting domains through a dedicated settings tab.

---

## 🛠️ Supabase Database Schema

To support synchronization of privacy-first browser telemetry, the backend stores events in a table named `browser_activity`. Below is the complete SQL DDL schema required to provision this table in Supabase:

```sql
CREATE TABLE IF NOT EXISTS browser_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    mode VARCHAR(100) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    active_duration_seconds INT NOT NULL DEFAULT 0,
    tab_switches INT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and add basic security policies as needed
ALTER TABLE browser_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and write" 
ON browser_activity 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

---

## 🧪 Local Development Testing

To manually connect the extension to a local developer profile during testing:

### 1. Retrieve a Valid Profile UUID
Connect to your Supabase studio or query the database to find an existing user ID in the `profiles` table.
Alternatively, start the FastAPI server and navigate to Swagger `http://127.0.0.1:8000/docs` to read existing profiles.

### 2. Set the `user_id` in chrome.storage.local
Since the extension does not force a login flow for local development, you can manually inject a valid profile UUID into the extension's sandbox:

1. Open **Google Chrome** and navigate to `chrome://extensions`.
2. Find **Cognivue Focus Coach** and click on the **service worker** link (under "Inspect views") to open the background inspector panel.
3. Select the **Console** tab in the inspector.
4. Execute the following command, replacing `'your-valid-uuid-here'` with your profile UUID:
   ```javascript
   chrome.storage.local.set({ user_id: 'your-valid-uuid-here' }, () => {
     console.log('Manually set test user_id in chrome.storage.local');
   });
   ```
5. To check that it has been set successfully, run:
   ```javascript
   chrome.storage.local.get('user_id', console.log);
   ```
6. Alternatively, inspect the popup HUD by clicking on the extension icon in the toolbar, right-clicking inside the popup, choosing **Inspect**, opening the console, and running the same `chrome.storage.local.set` command.
7. Once set, the cloud synchronization indicator will immediately transition from `"Local Only"` to `"Synced"`, and starts syncing tracking intervals to `http://127.0.0.1:8000/extension/activity` every 30 seconds!
