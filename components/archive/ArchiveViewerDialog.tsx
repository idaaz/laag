"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Archive,
    Loader2,
    ExternalLink,
    FileJson,
    RefreshCw
} from "lucide-react";
import { ArchiveType } from "@/lib/github/archive";
import { Badge } from "@/components/ui/badge";

interface ArchiveViewerDialogProps {
    type: ArchiveType;
    trigger?: React.ReactNode;
}

export function ArchiveViewerDialog({ type, trigger }: ArchiveViewerDialogProps) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<{ item: Record<string, unknown>; githubMeta: { path: string; sha: string } }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [restoringIdx, setRestoringIdx] = useState<number | null>(null);

    const fetchArchive = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/archive?type=${type}`);
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    const rawData = json.data as { item: Record<string, unknown>; githubMeta: { path: string; sha: string } }[];
                    setItems(rawData.sort((a, b) => {
                        const dateA = new Date((a.item.created_at as string) || (a.item.visited_at as string) || (a.item.relapse_at as string) || 0).getTime();
                        const dateB = new Date((b.item.created_at as string) || (b.item.visited_at as string) || (b.item.relapse_at as string) || 0).getTime();
                        return dateB - dateA;
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch archive:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (idx: number) => {
        const { item, githubMeta } = items[idx];
        setRestoringIdx(idx);
        try {
            const res = await fetch("/api/archive/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, item, githubMeta })
            });

            if (res.ok) {
                setItems(prev => prev.filter((_, i) => i !== idx));
            } else {
                const err = await res.json();
                console.error("Restoration failed:", err.error);
                alert(`Restoration failed: ${err.error}`);
            }
        } catch (error) {
            console.error("Restoration error:", error);
        } finally {
            setRestoringIdx(null);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && items.length === 0) {
            fetchArchive();
        }
    };

    return (
        <>
            {trigger ? (
                <div onClick={() => handleOpenChange(true)}>{trigger}</div>
            ) : (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleOpenChange(true)}>
                    <Archive className="h-4 w-4" />
                    Archive
                </Button>
            )}
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10">
                    <DialogHeader className="p-6 pb-2 shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Archive className="h-5 w-5" />
                                </div>
                                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} Archive
                            </DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchArchive}
                                disabled={isLoading}
                                className="rounded-full hover:bg-white/5"
                            >
                                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 px-6 pb-6">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                                <p className="text-sm font-medium">Fetching from GitHub storage...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <div className="p-4 rounded-full bg-muted/20">
                                    <FileJson className="h-10 w-10 opacity-20" />
                                </div>
                                <p className="text-sm">No archived items found for this category.</p>
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto laag-scroll pr-4">
                                <div className="space-y-3">
                                    {items.map(({ item }, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-sm truncate">
                                                            {(item.title as string) || (item.name as string) || (item.url as string) || "Untitled Entry"}
                                                        </h4>
                                                        {!!item.priority && (
                                                            <Badge variant="outline" className="text-[10px] h-4 border-white/10">
                                                                {item.priority as string}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {(item.description as string) || (item.body as string) || (item.content as string) || "No additional details available."}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                                        {format(new Date((item.created_at as string) || (item.visited_at as string) || (item.relapse_at as string)), "MMM d, yyyy")}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5 opacity-50">
                                                        {format(new Date((item.created_at as string) || (item.visited_at as string) || (item.relapse_at as string)), "HH:mm")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[10px] px-2 rounded-lg hover:bg-white/10"
                                                    onClick={() => window.open(`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO_NAME}/tree/main/users`, '_blank')}
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1.5" />
                                                    GitHub Storage
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    disabled={restoringIdx === idx}
                                                    onClick={() => handleRestore(idx)}
                                                    className="h-7 text-[10px] px-3 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border-none shadow-none font-bold"
                                                >
                                                    {restoringIdx === idx ? (
                                                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                                    ) : (
                                                        <RefreshCw className="h-3 w-3 mr-1.5" />
                                                    )}
                                                    Restore to App
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
