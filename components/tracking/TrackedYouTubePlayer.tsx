"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";

interface YTPlayer {
    destroy: () => void;
    getCurrentTime: () => number;
}

interface YTNamespace {
    Player: new (element: HTMLElement | string, options: Record<string, unknown>) => YTPlayer;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: YTNamespace;
    }
}

interface VideoMetadata {
    title: string;
    category: string;
    channel: string;
    duration: number;
}

interface TrackedYouTubePlayerProps {
    videoUrl: string;
    onEnd?: () => void;
}

export function TrackedYouTubePlayer({ videoUrl, onEnd }: TrackedYouTubePlayerProps) {
    const { user } = useAuth();
    const playerRef = useRef<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
    const [recordId, setRecordId] = useState<string | null>(null);
    const watchTimeRef = useRef(0);
    const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Extract video ID from URL
    const getVideoId = (url: string) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes("youtube.com") && urlObj.pathname === "/watch") {
                return urlObj.searchParams.get("v");
            }
            if (urlObj.hostname.includes("youtu.be")) {
                return urlObj.pathname.slice(1);
            }
            if (urlObj.pathname.includes("/shorts/")) {
                return urlObj.pathname.split("/shorts/")[1].split("?")[0];
            }
        } catch { }
        return null;
    };

    const videoId = getVideoId(videoUrl);

    // Fetch Metadata
    useEffect(() => {
        if (!videoUrl) return;

        async function fetchMeta() {
            try {
                const res = await fetch(`/api/tracking/mobile?url=${encodeURIComponent(videoUrl)}`);
                const data = await res.json();
                if (!data.error) {
                    setMetadata(data);
                }
            } catch (e) {
                console.error("Failed to fetch YouTube metadata:", e);
            }
        }
        fetchMeta();
    }, [videoUrl]);

    const sendHeartbeat = useCallback(async (totalWatch: number, currentPos: number) => {
        if (!user?.id) return;
        try {
            const body = {
                userId: user.id,
                url: videoUrl,
                title: metadata?.title || "YouTube Video",
                watchTime: totalWatch,
                videoStart: 0,
                videoEnd: currentPos,
                totalDuration: metadata?.duration || 0,
                channelName: metadata?.channel || "Unknown",
                youtubeCategory: metadata?.category || "Entertainment",
                recordId: recordId
            };

            const res = await fetch("/api/tracking/mobile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.recordId && !recordId) {
                setRecordId(data.recordId);
            }
        } catch (e) {
            console.error("Heartbeat failed:", e);
        }
    }, [user?.id, videoUrl, metadata, recordId]);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
    }, []);

    const startHeartbeat = useCallback(() => {
        if (heartbeatTimerRef.current) return;

        heartbeatTimerRef.current = setInterval(async () => {
            if (!playerRef.current || !user?.id) return;

            const currentTime = Math.floor(playerRef.current.getCurrentTime());
            watchTimeRef.current += 10;
            sendHeartbeat(watchTimeRef.current, currentTime);
        }, 10000);
    }, [user?.id, sendHeartbeat]);

    // Handle Playback Updates
    const handleStateChange = useCallback((event: { data: number }) => {
        const newState = event.data;

        // YT.PlayerState.PLAYING = 1
        if (newState === 1) {
            startHeartbeat();
        } else {
            stopHeartbeat();
        }

        if (newState === 0 && onEnd) {
            onEnd();
        }
    }, [startHeartbeat, stopHeartbeat, onEnd]);

    // Load YouTube API
    useEffect(() => {
        if (!videoId || typeof window === "undefined") return;

        function loadYT() {
            if (window.YT) {
                initPlayer();
            } else {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
                window.onYouTubeIframeAPIReady = initPlayer;
            }
        }

        function initPlayer() {
            if (!containerRef.current) return;

            playerRef.current = new window.YT.Player(containerRef.current, {
                height: "100%",
                width: "100%",
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: () => setStatus("ready"),
                    onStateChange: handleStateChange,
                    onError: () => setStatus("error")
                }
            });
        }

        loadYT();

        return () => {
            if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
            if (playerRef.current?.destroy) playerRef.current.destroy();
        };
    }, [videoId, handleStateChange]);

    if (!videoId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive gap-4">
                <AlertCircle className="w-12 h-12" />
                <p className="font-bold text-center">Invalid YouTube URL. Please enter a valid watch link or Short.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl relative border border-white/10 group">
                <div ref={containerRef} className="w-full h-full" />

                {status === "loading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                )}

                {status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6 text-center text-white gap-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                        <p>An error occurred with the YouTube player. It might be restricted from embedding.</p>
                    </div>
                )}
            </div>

            {metadata && (
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-black leading-tight text-foreground tracking-tight line-clamp-2">
                            {metadata.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                                {metadata.channel}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 bg-white/5 rounded-full border border-white/10">
                                {metadata.category}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 animate-pulse flex items-center gap-1.5 ml-auto">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Tracking Active
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
