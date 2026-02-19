// YouTube Content Script for real-time watch tracking

let videoElement = null;
let trackingInterval = null;
let lastState = null; // { url, startTime, watchTime, videoStart, videoEnd }

// Helper to get video ID and current time
function getVideoState() {
    if (!videoElement) return null;
    return {
        currentTime: videoElement.currentTime,
        duration: videoElement.duration,
        paused: videoElement.paused,
        url: window.location.href
    };
}

// Initialize tracking for a new video
function initTracking() {
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
    if (!lastState) return;

    // Calculate delta since last tick if playing
    const now = Date.now();
    if (!videoElement.paused && !lastState.isBuffering) {
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

    // Find video element
    videoElement = document.querySelector('video');
    if (!videoElement) {
        console.log("LAAG Tracker: No video element found.");
        return;
    }

    initTracking();

    // Listeners
    videoElement.addEventListener('play', () => {
        lastState.lastTick = Date.now();
        lastState.isBuffering = false;
        console.log("LAAG Tracker: Play");
    });

    videoElement.addEventListener('pause', () => {
        sendUpdate(); // Send final chunk before pause
        console.log("LAAG Tracker: Pause");
    });

    videoElement.addEventListener('seeking', () => {
        // If seeking, we might want to "break" the session or just update the end time?
        // User asked for "which minute:sec of video was started and ended"
        // If they skip from 0:10 to 5:00, the videoEnd becomes 5:00+. 
        // We update videoEnd to the new time.
        // NOTE: If they jump BACKWARDS, videoEnd might decrease? 
        // Let's keep videoStart as the *initial* start, and videoEnd as the *latest* point reached?
        // Or just the current point.
        // Let's track the *furthest* point? Or just the point where they stop?
        // "which minute:sec of video was started and ended" implies the range of THIS session.
        // If I watch 0-10, seek to 50, watch 50-60.
        // The watch time is 20s. Start 0. End 60? Or End 50?
        // Simple approach: Start is when they loaded/started. End is where they left off.
        lastState.videoEnd = videoElement.currentTime;
        console.log("LAAG Tracker: Seek to", lastState.videoEnd);
    });

    videoElement.addEventListener('waiting', () => {
        lastState.isBuffering = true;
        console.log("LAAG Tracker: Buffering...");
    });

    videoElement.addEventListener('playing', () => {
        lastState.isBuffering = false;
        lastState.lastTick = Date.now();
        console.log("LAAG Tracker: Resumed");
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
}

// Observe navigation (YouTube is SPA)
// We can listen to title changes or URL changes via MutationObserver or just interval check?
// Background script handles the MAIN tracking of URL visits.
// THIS script is purely for augmenting with watch time.
// We need to know when the generic "page load" effectively happens for a new video.

let currentUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        if (currentUrl.includes('/watch')) {
            // Give time for DOM to update
            setTimeout(startTracking, 2000);
        } else {
            stopTracking();
        }
    }
}, 1000);

// Initial start
if (currentUrl.includes('/watch')) {
    setTimeout(startTracking, 2000);
}

// Handle unload/close
window.addEventListener('beforeunload', () => {
    sendUpdate();
});
