// YouTube Content Script for real-time watch tracking

let videoElement = null;
let trackingInterval = null;
let lastState = null; // { url, startTime, watchTime, videoStart, videoEnd, channelName, totalDuration }

// Helper to check if current URL is a trackable YouTube page
function isTrackableUrl(url) {
    return url.includes('/watch') || url.includes('/shorts/');
}

// Extract Channel Name based on current page type
function getChannelName() {
    try {
        if (window.location.href.includes('/shorts/')) {
            // Better selector for active Short
            const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');
            const container = activeShort || document;

            const channelAnchor = container.querySelector('yt-reel-channel-bar-view-model a') ||
                container.querySelector('#channel-name a') ||
                container.querySelector('.ytd-channel-name a') ||
                container.querySelector('a[href*="/@"]');

            return channelAnchor?.innerText?.trim() || null;
        } else {
            // Ensure we strictly look within the active passenger (not old shorts or hidden elements)
            const watchFlexy = document.querySelector('ytd-watch-flexy[player-unavailable="false"]') || document;
            const channelAnchor = watchFlexy.querySelector('ytd-video-owner-renderer .ytd-channel-name a') ||
                watchFlexy.querySelector('#owner-and-teaser #channel-name a') ||
                watchFlexy.querySelector('#upload-info #channel-name a');
            return channelAnchor?.innerText?.trim() || null;
        }
    } catch (e) {
        console.error("LAAG Tracker: Error getting channel name", e);
    }
    return null;
}

// Extract Category more robustly
function getCategory() {
    try {
        // 1. Try meta tag
        const metaTag = document.querySelector('meta[itemprop="genre"]');
        if (metaTag && metaTag.content) return metaTag.content;

        // 2. Try JSON-LD script block
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd && jsonLd.innerText.includes('"genre"')) {
            const match = jsonLd.innerText.match(/"genre"\s*:\s*"([^"]+)"/);
            if (match) return match[1];
        }

        // 3. Deep fallback to ytInitialPlayerResponse in scripts
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
            if (script.innerText && script.innerText.includes('"category":"')) {
                // In SPA, the page might have multiple ytInitialPlayerResponse objects.
                // It's safer to only trust JSON-LD and meta tags on navigate, 
                // but if we must, we try to grab the last one or the one matching the video ID.
                const match = script.innerText.match(/"category":"([^"]+)"/);
                if (match) return match[1];
            }
        }
    } catch (e) {
        console.error("LAAG Tracker: Error getting category", e);
    }
    return null;
}

// Get the true duration of the content video (bypassing Ads)
function getTrueDuration(videoElement) {
    try {
        // If we are on a Short, NEVER trust the standard ytp-time-duration element
        // because it belongs to the hidden standard yt player. Shorts duration is the video element duration.
        if (window.location.href.includes('/shorts/')) {
            if (videoElement && !isNaN(videoElement.duration) && videoElement.duration > 0) {
                return videoElement.duration;
            }
            return null;
        }

        // 1. Check UI time string (very reliable, ignores ads usually)
        const timeElement = document.querySelector('.ytp-time-duration');
        if (timeElement && timeElement.textContent) {
            const parts = timeElement.textContent.split(':').map(n => parseInt(n, 10));
            let seconds = 0;
            if (parts.length === 3) {
                seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
                seconds = parts[0] * 60 + parts[1];
            }
            if (seconds > 0) return seconds;
        }

        // 2. Check meta tag
        const metaTag = document.querySelector('meta[itemprop="duration"]');
        if (metaTag && metaTag.content) {
            const match = metaTag.content.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
                const hours = parseInt(match[1] || 0, 10);
                const minutes = parseInt(match[2] || 0, 10);
                const seconds = parseInt(match[3] || 0, 10);
                const total = hours * 3600 + minutes * 60 + seconds;
                if (total > 0) return total;
            }
        }
    } catch (e) {
        console.error("LAAG Tracker: Error parsing duration UI", e);
    }

    // 3. Fallback to video element duration, avoiding ad takeovers
    const isAdPlaying = !!document.querySelector('.ad-showing, .ad-interrupting, .video-ads.ytp-ad-module:not(:empty)');
    if (isAdPlaying) return null; // Don't trust the video element during an ad!

    if (videoElement && !isNaN(videoElement.duration) && videoElement.duration > 0) {
        return videoElement.duration;
    }

    // Still nothing? Find longest video on page
    const videos = Array.from(document.querySelectorAll('video'));
    let max = 0;
    for (const v of videos) {
        if (!isNaN(v.duration) && v.duration > max) max = v.duration;
    }
    return max > 0 ? max : null;
}

// Initialize tracking for a new video
function initTracking() {
    // Find video element - in Shorts it might be one of several
    const videos = Array.from(document.querySelectorAll('video'));
    videoElement = videos.find(v => v.offsetParent !== null) || videos[0];

    if (!videoElement) {
        console.log("LAAG Tracker: No active video element found yet.");
        return;
    }

    const channelName = getChannelName();
    const duration = getTrueDuration(videoElement) || 0;

    // Reset state natively for a clean tracking slate
    lastState = {
        url: window.location.href,
        startTime: Date.now(),
        watchTime: 0,
        videoStart: videoElement.currentTime,
        videoEnd: videoElement.currentTime,
        totalDuration: duration,
        channelName: channelName,
        youtubeCategory: getCategory(),
        lastTick: Date.now(),
        isBuffering: false
    };

    console.log("LAAG Tracker: Initialized for", lastState.url, "Channel:", channelName, "Category:", lastState.youtubeCategory, "Total Duration:", duration);
}

// Send update to background script
function sendUpdate() {
    if (!lastState || !videoElement) {
        // If we have a video but no state, try initializing again
        if (document.querySelector('video')) initTracking();
        return;
    }

    // Try to recover missing metadata
    if (!lastState.channelName) {
        lastState.channelName = getChannelName();
    }
    if (!lastState.youtubeCategory) {
        lastState.youtubeCategory = getCategory();
    }

    // Always attempt to get the true duration if it's suspicious or missing (e.g., ad was playing)
    const currentTrueDuration = getTrueDuration(videoElement);
    if (currentTrueDuration && (!lastState.totalDuration || lastState.totalDuration < currentTrueDuration)) {
        lastState.totalDuration = currentTrueDuration;
    }

    // Calculate delta since last tick if playing
    const now = Date.now();
    if (!videoElement.paused && !lastState.isBuffering && videoElement.readyState >= 2) {
        const delta = (now - lastState.lastTick) / 1000;
        if (delta > 0 && delta < 60) {
            lastState.watchTime += delta;
        }
    }
    lastState.lastTick = now;
    lastState.videoEnd = videoElement.currentTime;

    // Send to background
    try {
        browser.runtime.sendMessage({
            type: 'UPDATE_WATCH_TIME',
            data: {
                url: lastState.url,
                watchTime: Math.round(lastState.watchTime),
                videoStart: lastState.videoStart,
                videoEnd: lastState.videoEnd,
                totalDuration: Math.round(lastState.totalDuration || 0),
                channelName: lastState.channelName,
                youtubeCategory: lastState.youtubeCategory
            }
        });
    } catch (e) {
        console.warn("LAAG Tracker: Failed to send update", e);
        stopTracking();
    }
}

function startTracking() {
    stopTracking();

    // Find video
    const videos = Array.from(document.querySelectorAll('video'));
    videoElement = videos.find(v => v.offsetParent !== null) || videos[0];

    if (!videoElement) {
        console.log("LAAG Tracker: Retrying startTracking...");
        setTimeout(startTracking, 2000);
        return;
    }

    initTracking();

    // Listeners
    const onPlay = () => {
        if (!lastState) initTracking();
        if (lastState) {
            lastState.lastTick = Date.now();
            lastState.isBuffering = false;
        }
    };

    videoElement.addEventListener('play', onPlay);
    videoElement.addEventListener('pause', sendUpdate);
    videoElement.addEventListener('seeking', () => { if (lastState) lastState.videoEnd = videoElement.currentTime; });
    videoElement.addEventListener('waiting', () => { if (lastState) lastState.isBuffering = true; });
    videoElement.addEventListener('playing', () => { if (lastState) { lastState.isBuffering = false; lastState.lastTick = Date.now(); } });

    // Heartbeat
    trackingInterval = setInterval(sendUpdate, 5000);
}

function stopTracking() {
    if (trackingInterval) clearInterval(trackingInterval);
    trackingInterval = null;
    videoElement = null;
    lastState = null;
}

// Observe navigation
let currentUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log("LAAG Tracker: URL changed to", currentUrl);
        stopTracking(); // Ensure state is fully cleared

        if (isTrackableUrl(currentUrl)) {
            setTimeout(startTracking, 2000);
        }
    }
}, 1000);

// Initial start
if (isTrackableUrl(currentUrl)) {
    setTimeout(startTracking, 2500);
}

window.addEventListener('beforeunload', sendUpdate);
