# LAAG URL Tracker — Firefox Extension Source Code

## Overview
This extension is written entirely in **plain JavaScript, HTML, and CSS** with no build tools, transpilers, minifiers, or bundlers. The source code is the add-on code — no compilation or transformation is required.

---

## Requirements

- **Operating System**: Windows, macOS, or Linux
- **Required Software**: None (no Node.js, npm, or any build tool is needed)
- **Browser for Testing**: Firefox 142+ or any Chromium browser (Chrome, Brave, Kiwi)

---

## File Structure

```
url-tracker/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── youtube-tracker.js     # YouTube content script
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Build Instructions

**There is no build step.** The source code IS the extension.

### To load the extension in Firefox:
1. Open Firefox and navigate to `about:debugging`
2. Click **"This Firefox"**
3. Click **"Load Temporary Add-on..."**
4. Navigate to the `url-tracker/` folder and select `manifest.json`
5. The extension will load immediately

### To load the extension in Chrome/Kiwi/Brave:
1. Open the browser and navigate to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `url-tracker/` folder
5. The extension will load immediately

---

## How It Works

- **background.js**: Listens for tab navigation events and sends visit data to the LAAG backend API
- **youtube-tracker.js**: A content script injected on `youtube.com` that tracks video watch time using the HTML5 video element
- **popup.js**: Fetches and displays live KPI data from the LAAG API when the popup is opened

---

## Configuration

After loading the extension, click the extension icon and enter:
- **User ID**: Your LAAG account UUID (found in your profile settings)
- **App URL**: Your LAAG deployment URL (default: `https://laag.vercel.app`)

---

## Third-Party Code

None. All code is original and written specifically for this project.
