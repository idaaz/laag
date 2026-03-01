// YouTube Content Script for real-time watch tracking

let videoElement = null;
let trackingInterval = null;
let lastState = null; // { url, startTime, watchTime, videoStart, videoEnd }

// Helper to check if current URL is a trackable YouTube page
function isTrackableUrl(url) {
    return url.includes('/watch') || url.includes('/shorts/');
}

// Initialize tracking for a new video
function initTracking() {
    if (!videoElement) return;

    // Reset state
    lastState = {
        url: window.location.href,
        startTime: Date.now(), // Wall clock start
        watchTime: 0,
        videoStart: videoElement.currentTime,
        videoEnd: videoElement.currentTime,
        lastTick: Date.now(),
        isBuffering: false
    };

    console.log("LAAG Tracker: Initialized for", lastState.url);
}

// Send update to background script
function sendUpdate() {
    if (!lastState || !videoElement) return;

    // Calculate delta since last tick if playing
    const now = Date.now();
    if (!videoElement.paused && !lastState.isBuffering && videoElement.readyState >= 2) {
        const delta = (now - lastState.lastTick) / 1000;
        if (delta > 0 && delta < 5) { // Sanity check: ignore huge jumps (sleep/suspend)
            lastState.watchTime += delta;
        }
    }
    lastState.lastTick = now;
    lastState.videoEnd = videoElement.currentTime;

    // Send to background
    try {
        chrome.runtime.sendMessage({
            type: 'UPDATE_WATCH_TIME',
            data: {
                url: lastState.url,
                watchTime: Math.round(lastState.watchTime),
                videoStart: lastState.videoStart,
                videoEnd: lastState.videoEnd
            }
        });
    } catch (e) {
        // Extension might be reloaded/invalidated
        console.warn("LAAG Tracker: Failed to send update", e);
        stopTracking();
    }
}

function startTracking() {
    stopTracking(); // Ensure cleanup

    // Find video element - in Shorts it might be one of several
    // We target the active/visible video if possible
    const videos = Array.from(document.querySelectorAll('video'));
    videoElement = videos.find(v => v.offsetParent !== null) || videos[0];

    if (!videoElement) {
        console.log("LAAG Tracker: No active video element found. Retrying...");
        setTimeout(startTracking, 2000);
        return;
    }

    initTracking();

    // Listeners
    videoElement.addEventListener('play', () => {
        if (!lastState) initTracking();
        lastState.lastTick = Date.now();
        lastState.isBuffering = false;
        console.log("LAAG Tracker: Play");
    });

    videoElement.addEventListener('pause', () => {
        sendUpdate(); // Send final chunk before pause
        console.log("LAAG Tracker: Pause");
    });

    videoElement.addEventListener('seeking', () => {
        if (lastState) {
            lastState.videoEnd = videoElement.currentTime;
        }
    });

    videoElement.addEventListener('waiting', () => {
        if (lastState) lastState.isBuffering = true;
    });

    videoElement.addEventListener('playing', () => {
        if (lastState) {
            lastState.isBuffering = false;
            lastState.lastTick = Date.now();
        }
    });

    // Heartbeat every 5 seconds
    trackingInterval = setInterval(sendUpdate, 5000);
}

function stopTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    videoElement = null;
    lastState = null;
}

// Observe navigation (YouTube is SPA)
let currentUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentUrl) {
        const oldUrl = currentUrl;
        currentUrl = window.location.href;

        console.log("LAAG Tracker: URL changed from", oldUrl, "to", currentUrl);

        if (isTrackableUrl(currentUrl)) {
            // Give time for DOM to update and new video element to become active
            setTimeout(startTracking, 1500);
        } else {
            stopTracking();
        }
    }
}, 1000);

// Initial start
if (isTrackableUrl(currentUrl)) {
    setTimeout(startTracking, 2000);
}

// Handle unload/close
window.addEventListener('beforeunload', () => {
    sendUpdate();
});
