const SUPABASE_URL = "https://wklnsuidivmqteyvvkxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbG5zdWlkaXZtcXRleXZ2a3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NjkxODgsImV4cCI6MjA4NjQ0NTE4OH0.op66TL4RPOd1tbkAguA9WoMNG37Z9mekEQ9FWz7Spcs";

// Store state for each tab: { url, status: 'pending'|'tracked', title, timestamp, ignoreNext, recordId }
let tabStates = {};

// Helper to clear timer
function clearTabTimer(tabId) {
    if (tabStates[tabId]?.timer) {
        clearTimeout(tabStates[tabId].timer);
        tabStates[tabId].timer = null;
    }
}

// Actual tracking function
async function sendToSupabase(tabId, url, title) {
    // If we've already tracked this specific URL/Title combo for this tab recently, skip (debounce)
    // But here we rely on the logic that calls this function to be correct.

    // Cleanup state for this tracking event
    clearTabTimer(tabId);
    if (tabStates[tabId]) {
        tabStates[tabId].status = 'tracked';
        tabStates[tabId].title = title; // update with final title used
    }

    const { userId } = await chrome.storage.local.get(['userId']);
    if (!userId) {
        console.warn("URL Tracker: No User ID configured.");
        return;
    }

    // Skip internal urls
    if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://')) return;

    try {
        console.log("URL Tracker: Sending to Supabase:", url, title);
        const visitedAt = new Date().toISOString();

        // Use Prefer: return=representation to get the ID back
        const response = await fetch(`${SUPABASE_URL}/rest/v1/visited_urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: userId,
                url: url,
                title: title,
                visited_at: visitedAt
            }),
            keepalive: true // CRITICAL: Ensure request completes even if tab closes
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                const record = data[0];
                console.log("URL Tracker: Logged successfully (ID: " + record.id + "):", url);

                // Store the ID in tabStates for future updates (watch time)
                if (tabStates[tabId]) {
                    tabStates[tabId].recordId = record.id;
                }
            }

            // Update local history for popup
            const { history = [] } = await chrome.storage.local.get(['history']);
            const newHistory = [{ url, title, time: Date.now(), success: true }, ...history].slice(0, 5);
            await chrome.storage.local.set({ history: newHistory, lastSync: Date.now(), lastError: null });
        } else {
            const err = await response.text();
            console.error("URL Tracker API Error:", response.status, err);
            await chrome.storage.local.set({ lastError: `API ${response.status}: ${err}` });
        }
    } catch (error) {
        console.error("URL Tracker Network Error:", error);
        await chrome.storage.local.set({ lastError: `Network Error: ${error.message}` });
    }
}

// Listen for watch time updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_WATCH_TIME') {
        const tabId = sender.tab?.id;
        if (tabId && tabStates[tabId]?.recordId) {
            const recordId = tabStates[tabId].recordId;
            const { watchTime, videoStart, videoEnd } = message.data;

            console.log(`URL Tracker: Updating watch time for ID ${recordId}: ${watchTime}s`);

            // Update the record in Supabase
            // We use a separate async function to not block the listener
            updateWatchTime(recordId, watchTime, videoStart, videoEnd);
        }
    }
});

async function updateWatchTime(recordId, watchTime, videoStart, videoEnd) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/visited_urls?id=eq.${recordId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                watch_time_seconds: watchTime,
                video_start_time: videoStart,
                video_end_time: videoEnd
            }),
            keepalive: true
        });
    } catch (e) {
        console.error("URL Tracker: Failed to update watch time", e);
    }
}

// 1. Detect reloads to ignore them
chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) {
        if (details.transitionType === 'reload') {
            console.log("URL Tracker: Detected reload for tab", details.tabId, " - Ignoring next completion.");
            if (!tabStates[details.tabId]) tabStates[details.tabId] = {};
            tabStates[details.tabId].ignoreNext = true;
        }
    }
});

// 2. Main Navigation Listener (Completions & History/SPA updates)
function handleNavigation(details) {
    if (details.frameId !== 0) return;
    const { tabId, url } = details;

    // Check if we should ignore this (reload)
    if (tabStates[tabId]?.ignoreNext) {
        console.log("URL Tracker: Ignoring reload for", url);
        tabStates[tabId].ignoreNext = false; // Reset flag
        return;
    }

    // If there was a pending track for this tab (previous page was waiting for title), force send it now
    if (tabStates[tabId]?.status === 'pending') {
        clearTabTimer(tabId);
        // Force send the previous pending URL with whatever title we have (or "Untitled")
        // NOTE: Actually, if we navigated AWAY, we might want to track the PREVIOUS page.
        // But usually, the previous page was already tracked or we are moving to a new one.
        // If we implement "duration" later, we'd handle it here.
        // For now, let's just assume the previous one is "lost" or "done" if we navigate away too fast?
        // Actually, if we navigate away, onUpdated might not fire for the OLD page anymore.
        // So yes, if pending, we might missed the title update. 
        // We could initiate a "force flush" here for the old URL, but we don't know the old title.
        // Let's just Overwrite state for the NEW page.
    }

    // Initialize state for NEW page
    console.log("URL Tracker: Navigation detected:", url);
    tabStates[tabId] = {
        url: url,
        status: 'pending',
        title: "Loading...", // Placeholder
        timestamp: Date.now(),
        ignoreNext: false,
        recordId: null, // Will be filled after successful insert
        timer: setTimeout(() => {
            // Timeout: if title never updates in 5s, track anyway
            if (tabStates[tabId]?.status === 'pending' && tabStates[tabId].url === url) {
                console.log("URL Tracker: Timeout waiting for title, sending now.");
                // Try to get current title from tab if possible, else use what we have
                chrome.tabs.get(tabId).then(tab => {
                    sendToSupabase(tabId, url, tab.title || "Untitled");
                }).catch(() => {
                    sendToSupabase(tabId, url, "Untitled");
                });
            }
        }, 5000)
    };
}

chrome.webNavigation.onCompleted.addListener(handleNavigation);
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation);

// 3. Listen for Title Changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only care if title changed and we are tracking this tab
    if (changeInfo.title && tabStates[tabId]) {
        const state = tabStates[tabId];

        // Only if we are 'pending' logic for this URL
        // (If strictly matching URLs is hard because of hash/params, we assume tabId implies same page flow)
        if (state.status === 'pending' && state.url === tab.url) {
            console.log("URL Tracker: Title generated:", changeInfo.title);
            sendToSupabase(tabId, state.url, changeInfo.title);
        }
    }
});

// 4. Tab Closed Listener
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabStates[tabId]) {
        const state = tabStates[tabId];
        if (state.status === 'pending') {
            console.log("URL Tracker: Tab closed while pending. Tracking immediately.");
            // We can't get the tab title anymore, use what we have or "Untitled"
            // If the user closed it 1s into the video, the title might never have loaded.
            sendToSupabase(tabId, state.url, state.title || "Untitled");
        }
        delete tabStates[tabId];
    }
});


// 5. Anti-X-Frame & CSP Bypass for In-App Browser
const RULE_ID = 1;

async function setupHeaderStrippingRules() {
    console.log("URL Tracker: Initializing header-stripping rules...");
    try {
        const rules = [
            {
                id: RULE_ID,
                priority: 1,
                action: {
                    type: "modifyHeaders",
                    responseHeaders: [
                        { header: "X-Frame-Options", operation: "remove" },
                        { header: "Content-Security-Policy", operation: "remove" },
                        { header: "Frame-Options", operation: "remove" }
                    ]
                },
                condition: {
                    resourceTypes: ["sub_frame"]
                }
            }
        ];

        // Replace any existing rules with this set
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [RULE_ID],
            addRules: rules
        });
        console.log("URL Tracker: Header-stripping rules active.");
    } catch (e) {
        console.error("URL Tracker: Failed to set up header-stripping rules", e);
    }
}

// Setup on startup and install
chrome.runtime.onInstalled.addListener(() => {
    setupHeaderStrippingRules();
});

chrome.runtime.onStartup.addListener(() => {
    setupHeaderStrippingRules();
});

// Also run immediately in case it just loaded
setupHeaderStrippingRules();
