"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisitedUrlRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    Video,
    Clock,
    Calendar,
    ExternalLink,
    LayoutPanelLeft
} from "lucide-react";

interface VideoDetailsDialogProps {
    entry: VisitedUrlRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPreview: (entry: VisitedUrlRow) => void;
}

export function VideoDetailsDialog({ entry, open, onOpenChange, onPreview }: VideoDetailsDialogProps) {
    if (!entry) return null;

    const formatSeconds = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.round(s % 60);
        return `${mins}m ${secs}s`;
    };

    const isYouTube = entry.url.includes("youtube.com") || entry.url.includes("youtu.be");
    const progressPerc = entry.total_duration_seconds ? Math.min(100, (entry.watch_time_seconds / entry.total_duration_seconds) * 100) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] border-border/60 bg-background/95 backdrop-blur-md overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                            Tracking Details
                        </Badge>
                    </div>
                    <DialogTitle className="text-xl font-bold leading-tight line-clamp-2">
                        {entry.title || "Untitled Visit"}
                    </DialogTitle>
                    <div className="flex flex-col gap-2 mt-2">
                        <DialogDescription className="text-xs break-all text-muted-foreground font-mono">
                            {entry.url}
                        </DialogDescription>
                        <div className="flex flex-wrap items-center gap-2">
                            {entry.channel_name && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                    <Video className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{entry.channel_name}</span>
                                </div>
                            )}
                            {(entry.total_duration_seconds ?? 0) > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/30 border border-border text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{formatSeconds(entry.total_duration_seconds as number)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Stats */}
                    <div className="space-y-4">
                        <div className="rounded-xl border border-border/40 bg-secondary/10 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                                    <Clock className="w-3 h-3" />
                                    Watch Time
                                </div>
                                <span className="text-lg font-bold text-primary tabular-nums">
                                    {formatSeconds(entry.watch_time_seconds)}
                                </span>
                            </div>

                            {(entry.total_duration_seconds ?? 0) > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                                        <span>Progress</span>
                                        <span>{Math.round(progressPerc)}% of {formatSeconds(entry.total_duration_seconds as number)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${progressPerc}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Visited At</span>
                                    <span>{format(new Date(entry.visited_at), "MMMM d, yyyy 'at' HH:mm:ss")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Context */}
                    <div className="space-y-3">
                        <div className="rounded-xl border border-border/40 p-4 bg-background/50 space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Session Insights</h4>

                            <div className="flex items-center justify-between text-sm py-1 border-b border-border/20">
                                <span className="text-muted-foreground">In-App View</span>
                                <Badge variant={entry.is_in_app ? "default" : "secondary"} className="text-[9px] uppercase">
                                    {entry.is_in_app ? "Yes" : "No"}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between text-sm py-1 border-b border-border/20">
                                <span className="text-muted-foreground">Category</span>
                                <span className="text-[11px] font-bold uppercase tracking-tight">
                                    {isYouTube ? (entry.youtube_category || "YouTube Video") : "Web Browse"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-muted-foreground">Device ID</span>
                                <span className="text-[11px] font-mono text-muted-foreground/60">
                                    {entry.user_id.split('-')[0]}...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                    <Button
                        className="flex-1 gap-2 font-bold uppercase tracking-wider text-xs h-10"
                        onClick={() => onPreview(entry)}
                    >
                        <LayoutPanelLeft className="w-4 h-4" />
                        Preview in Popup
                    </Button>
                    <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            buttonVariants({ variant: "outline" }),
                            "flex-1 gap-2 font-bold uppercase tracking-wider text-xs h-10"
                        )}
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open Site
                    </a>
                </div>
            </DialogContent>
        </Dialog>
    );
}
