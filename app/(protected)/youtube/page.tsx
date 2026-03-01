"use client";

import { useMemo, useState } from "react";
import { Youtube, History, ArrowRight, Play, Clock, Video } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTracking } from "@/hooks/useTracking";
import { TrackedYouTubePlayer } from "@/components/tracking/TrackedYouTubePlayer";
import { useAuth } from "@/hooks/useAuth";

export default function YouTubeFocusPage() {
    const { user } = useAuth();
    const [urlInput, setUrlInput] = useState("");
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    const { visitedUrlsQuery } = useTracking(user?.id);

    // Filter to show only YouTube videos in history
    const youtubeHistory = useMemo(() => {
        if (!visitedUrlsQuery.data?.data) return [];
        return (visitedUrlsQuery.data.data)
            .filter(v => v.url.includes("youtube.com") || v.url.includes("youtu.be"))
            .slice(0, 10); // Show top 10 recent
    }, [visitedUrlsQuery.data]);

    const handleStartFocus = (url: string) => {
        if (!url) return;
        setActiveVideo(url);
        setUrlInput("");
    };

    return (
        <PageFrame
            header={
                <SectionHeader
                    title="YouTube Focus"
                    description="Watch and track your focus in real-time."
                    icon={<Youtube className="h-5 w-5 text-red-500" />}
                />
            }
        >
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {/* ═══════════════════════════════════════════════
                    SECTION 1: ACTIVE PLAYER OR INPUT
                ═══════════════════════════════════════════════ */}
                {!activeVideo ? (
                    <div className="p-8 rounded-[2.5rem] bg-card/40 border border-white/10 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col items-center text-center gap-6 max-w-lg mx-auto">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
                                <Youtube className="w-10 h-10 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-foreground">
                                    Start Tracked Session
                                </h1>
                                <p className="text-muted-foreground mt-2 font-medium">
                                    Paste any YouTube link below. We&apos;ll automatically track your watch time for your LAAG metrics.
                                </p>
                            </div>

                            <div className="flex w-full gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl shadow-inner group-within:border-primary/50 transition-all">
                                <Input
                                    placeholder="Paste YouTube Video or Short URL..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    className="border-none bg-transparent shadow-none focus-visible:ring-0 text-lg h-12"
                                />
                                <Button
                                    onClick={() => handleStartFocus(urlInput)}
                                    size="icon"
                                    className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/80 shrink-0 shadow-lg shadow-primary/20"
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center justify-between px-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveVideo(null)}
                                className="text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-[10px] gap-2"
                            >
                                <History className="w-3 h-3" />
                                Stop and Change Video
                            </Button>
                        </div>
                        <TrackedYouTubePlayer videoUrl={activeVideo} onEnd={() => { }} />
                    </div>
                )}

                {/* ═══════════════════════════════════════════════
                    SECTION 2: RECENT HISTORY (SYNCED)
                ═══════════════════════════════════════════════ */}
                {!activeVideo && youtubeHistory.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="flex items-center gap-3 px-2">
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                <History className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-foreground">Pick up from Recent</h2>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Synced from your desktop & chrome extension</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {youtubeHistory.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleStartFocus(item.url)}
                                    className="group flex gap-4 p-4 rounded-3xl bg-card/30 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-left relative overflow-hidden active:scale-95 duration-200"
                                >
                                    <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Play className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                            {item.title || "Unknown Video"}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            {item.channel_name && (
                                                <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Video className="w-3 h-3" />
                                                    {item.channel_name}
                                                </span>
                                            )}
                                            {item.total_duration_seconds && (
                                                <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {Math.floor(item.total_duration_seconds / 60)}m
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4 text-primary" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PageFrame>
    );
}
