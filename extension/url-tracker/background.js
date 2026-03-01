const SUPABASE_URL = "https://wklnsuidivmqteyvvkxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbG5zdWlkaXZtcXRleXZ2a3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NjkxODgsImV4cCI6MjA4NjQ0NTE4OH0.op66TL4RPOd1tbkAguA9WoMNG37Z9mekEQ9FWz7Spcs";

// Store state for each tab: { url, status: 'pending'|'tracked', title, timestamp, ignoreNext, recordId }
let tabStates = {};
let ignoredRules = []; // Array of strings (patterns)

// Sync ignored rules from Supabase
async function syncIgnoredRules() {
    try {
        const { userId } = await browser.storage.local.get(['userId']);
        if (!userId) return;

        console.log("URL Tracker: Syncing ignored rules...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tracking_ignored_urls?user_id=eq.${userId}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            ignoredRules = data.map(rule => rule.url_pattern.toLowerCase());
            await browser.storage.local.set({ ignoredRules });
            console.log(`URL Tracker: Sync'd ${ignoredRules.length} ignored rules.`);
        }
    } catch (e) {
        console.error("URL Tracker: Failed to sync ignored rules", e);
    }
}

// Helper to check if a URL should be ignored
function isUrlIgnored(url) {
    if (!url) return true;
    const lowerUrl = url.toLowerCase();
    return ignoredRules.some(pattern => lowerUrl.includes(pattern));
}

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

    const { userId } = await browser.storage.local.get(['userId']);
    if (!userId) {
        console.warn("URL Tracker: No User ID configured.");
        return;
    }

    // Skip internal urls
    if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://')) return;

    // Skip if URL matches blocklist
    if (isUrlIgnored(url)) {
        console.log("URL Tracker: Blocking tracking for ignored URL:", url);
        return;
    }

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

                    // Flush any pending update that arrived while we were waiting for the ID
                    if (tabStates[tabId].pendingUpdate) {
                        const { watchTime, videoStart, videoEnd, totalDuration, channelName, youtubeCategory } = tabStates[tabId].pendingUpdate;
                        console.log(`URL Tracker: Flushing pending update for ID ${record.id}: ${watchTime}s`);
                        updateWatchTime(record.id, watchTime, videoStart, videoEnd, totalDuration, channelName, youtubeCategory);
                        delete tabStates[tabId].pendingUpdate;
                    }
                }
            }

            // Update local history for popup
            const { history = [] } = await browser.storage.local.get(['history']);
            const newHistory = [{ url, title, time: Date.now(), success: true }, ...history].slice(0, 5);
            await browser.storage.local.set({ history: newHistory, lastSync: Date.now(), lastError: null });
        } else {
            const err = await response.text();
            console.error("URL Tracker API Error:", response.status, err);
            await browser.storage.local.set({ lastError: `API ${response.status}: ${err}` });
        }
    } catch (error) {
        console.error("URL Tracker Network Error:", error);
        await browser.storage.local.set({ lastError: `Network Error: ${error.message}` });
    }
}

// Listen for watch time updates from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_WATCH_TIME') {
        const tabId = sender.tab?.id;
        if (!tabId || !tabStates[tabId]) return;

        // Double check if tab URL shifted to something ignored during the session
        if (isUrlIgnored(sender.tab?.url)) {
            return;
        }

        const { watchTime, videoStart, videoEnd, totalDuration, channelName, youtubeCategory } = message.data;

        if (tabStates[tabId].recordId) {
            // Success: record exists, update it normally
            const recordId = tabStates[tabId].recordId;
            console.log(`URL Tracker: Updating watch time for ID ${recordId}: ${watchTime}s (${channelName})`);
            updateWatchTime(recordId, watchTime, videoStart, videoEnd, totalDuration, channelName, youtubeCategory);
        } else {
            // Race condition: record doesn't exist yet, queue it
            console.log(`URL Tracker: Queuing pending update for tab ${tabId} (waiting for recordId)`);
            tabStates[tabId].pendingUpdate = message.data;
        }
    }
});

async function updateWatchTime(recordId, watchTime, videoStart, videoEnd, totalDuration, channelName, youtubeCategory) {
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
                video_end_time: videoEnd,
                total_duration_seconds: totalDuration,
                channel_name: channelName,
                youtube_category: youtubeCategory
            }),
            keepalive: true
        });
    } catch (e) {
        console.error("URL Tracker: Failed to update watch time", e);
    }
}

// 1. Detect reloads to ignore them
browser.webNavigation.onCommitted.addListener((details) => {
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

    if (isUrlIgnored(url)) {
        console.log("URL Tracker: Navigation to ignored URL, skipping state setup:", url);
        delete tabStates[tabId];
        return;
    }

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
                browser.tabs.get(tabId).then(tab => {
                    sendToSupabase(tabId, url, tab.title || "Untitled");
                }).catch(() => {
                    sendToSupabase(tabId, url, "Untitled");
                });
            }
        }, 5000)
    };
}

browser.webNavigation.onCompleted.addListener(handleNavigation);
browser.webNavigation.onHistoryStateUpdated.addListener(handleNavigation);

// 3. Listen for Title Changes
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
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
        if (browser.declarativeNetRequest && browser.declarativeNetRequest.updateDynamicRules) {
            await browser.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [RULE_ID],
                addRules: rules
            });
            console.log("URL Tracker: Header-stripping rules active.");
        } else {
            console.warn("URL Tracker: declarativeNetRequest not fully supported in this browser version. Header stripping disabled.");
        }
    } catch (e) {
        console.error("URL Tracker: Failed to set up header-stripping rules", e);
    }
}

// Setup on startup and install
browser.runtime.onInstalled.addListener(() => {
    setupHeaderStrippingRules();
    syncIgnoredRules();
});

browser.runtime.onStartup.addListener(() => {
    setupHeaderStrippingRules();
    syncIgnoredRules();
});

// Periodic sync every 30 minutes
setInterval(syncIgnoredRules, 1000 * 60 * 30);

// Also run immediately in case it just loaded
setupHeaderStrippingRules();
browser.storage.local.get(['ignoredRules']).then(res => {
    if (res.ignoredRules) ignoredRules = res.ignoredRules;
    syncIgnoredRules();
});
