"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Mic, FileIcon, Maximize2, Minimize2, Film } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaAttachment {
    url: string;
    type: string;
    name: string;
}

interface MediaGalleryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    media: MediaAttachment[];
    initialIndex?: number;
}

export function MediaGalleryModal({ open, onOpenChange, media, initialIndex = 0 }: MediaGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset index and fullscreen when modal opens
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
            setIsFullscreen(false);
        }
    }, [open, initialIndex]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Listen for native escape/exit fullscreen
    useEffect(() => {
        const handleFsChange = () => {
            if (!document.fullscreenElement) setIsFullscreen(false);
        };
        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    const next = () => setCurrentIndex((prev) => (prev + 1) % (media?.length || 1));
    const prev = () => setCurrentIndex((prev) => (prev - 1 + (media?.length || 1)) % (media?.length || 1));

    // Keyboard navigation - moved up to comply with Rules of Hooks
    useEffect(() => {
        if (!open || !media || media.length === 0) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, media?.length, next, prev]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!media || media.length === 0) return null;

    const currentMedia = media[currentIndex];
    const isImage = currentMedia.type === "image";
    const isAudio = currentMedia.type === "audio";
    const isVideo = currentMedia.type === "video";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-6xl w-full h-[90vh] p-0 bg-black/95 border-white/10 overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl"
            >
                <DialogTitle className="sr-only">Media Gallery: {currentMedia.name}</DialogTitle>

                {/* Toolbar */}
                <div className={cn(
                    "absolute top-0 inset-x-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300",
                    isFullscreen ? "opacity-0 hover:opacity-100" : "opacity-100"
                )}>
                    <div className="flex flex-col">
                        <span className="font-semibold text-white truncate max-w-[200px] md:max-w-md">
                            {currentMedia.name}
                        </span>
                        <span className="text-xs text-white/50">
                            {currentIndex + 1} of {media.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isImage && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleFullscreen}
                                className="text-white hover:bg-white/20 rounded-full"
                                title="Toggle Fullscreen"
                            >
                                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-white hover:bg-white/20 rounded-full"
                            title="Close Gallery (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div
                    ref={containerRef}
                    className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden bg-black"
                    onClick={(e) => {
                        // Click on backdrop to close
                        if (e.target === e.currentTarget) onOpenChange(false);
                    }}
                >
                    {/* Navigation Controls */}
                    {media.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={prev}
                                className="absolute left-4 z-40 text-white hover:bg-white/20 rounded-full h-12 w-12 hidden md:flex"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={next}
                                className="absolute right-4 z-40 text-white hover:bg-white/20 rounded-full h-12 w-12 hidden md:flex"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </Button>
                        </>
                    )}

                    {/* Media Render */}
                    <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                        {isImage ? (
                            <img
                                src={currentMedia.url}
                                alt={currentMedia.name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFullscreen();
                                }}
                                className={cn(
                                    "max-w-full max-h-full object-contain rounded-md transition-all cursor-zoom-in",
                                    isFullscreen ? "scale-100" : "hover:scale-[1.02]"
                                )}
                            />
                        ) : isAudio ? (
                            <div className="flex flex-col items-center justify-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 w-full max-w-md shadow-2xl">
                                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                    <Mic className="w-10 h-10 text-primary" />
                                </div>
                                <audio
                                    controls
                                    src={currentMedia.url}
                                    className="w-full focus:outline-none"
                                    autoPlay
                                />
                            </div>
                        ) : isVideo ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <video
                                    src={currentMedia.url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-full rounded-md shadow-2xl"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-4 text-white/50">
                                <FileIcon className="w-16 h-16" />
                                <p>Unsupported file format</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Thumbnails (if multiple) */}
                {media.length > 1 && !isFullscreen && (
                    <div className="h-24 bg-black/50 border-t border-white/5 flex items-center justify-center gap-2 px-4 overflow-x-auto laag-scroll">
                        {media.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`flex-shrink-0 relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === currentIndex ? "border-primary scale-110 z-10" : "border-transparent opacity-50 hover:opacity-100"
                                    }`}
                            >
                                {item.type === "image" ? (
                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                ) : item.type === "video" ? (
                                    <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center">
                                        <Film className="w-6 h-6 text-indigo-400" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <Mic className="w-6 h-6 text-white/50" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
