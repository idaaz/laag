"use client";

import { X, Maximize2, Minimize2, ExternalLink, GripHorizontal, Move, LayoutPanelLeft, Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function IframeViewer({ url, onClose }: { url: string | null; onClose: () => void }) {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isDocked, setIsDocked] = useState(false);
    const [size, setSize] = useState({ width: "90%", height: "80vh" });
    const dragConstraintsRef = useRef(null);

    // Sync size on toggle
    useEffect(() => {
        if (isMaximized) {
            setSize({ width: "100%", height: "100%" });
        } else if (isDocked) {
            setSize({ width: "380px", height: "100%" });
        } else {
            setSize({ width: "90%", height: "80vh" });
        }
    }, [isMaximized, isDocked]);

    // Helper to transform YouTube links to embed format
    const getEmbedUrl = (rawUrl: string) => {
        if (!rawUrl) return "";
        try {
            const urlObj = new URL(rawUrl);
            if (urlObj.hostname.includes("youtube.com") && urlObj.pathname === "/watch") {
                const videoId = urlObj.searchParams.get("v");
                if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            }
            if (urlObj.hostname.includes("youtu.be")) {
                const videoId = urlObj.pathname.slice(1);
                if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            }
        } catch (e) {
            console.error("Invalid URL in IframeViewer:", e);
        }
        return rawUrl;
    };

    // Helper to detect sites that block iframing
    const isBlockedDomain = (rawUrl: string) => {
        if (!rawUrl) return false;
        const blocked = [
            "github.com",
            "google.com",
            "stackoverflow.com",
            "linkedin.com",
            "facebook.com",
            "twitter.com",
            "x.com",
            "notion.so"
        ];
        return blocked.some(domain => rawUrl.toLowerCase().includes(domain));
    };

    const displayUrl = getEmbedUrl(url || "");
    const isRestricted = isBlockedDomain(url || "");

    if (!url) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] pointer-events-none p-0 md:p-4" ref={dragConstraintsRef}>
                <motion.div
                    drag={!isMaximized && !isDocked}
                    dragConstraints={dragConstraintsRef}
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        width: size.width,
                        height: size.height,
                        x: isDocked ? "calc(100vw - 380px)" : 0,
                        right: isDocked ? 0 : "auto",
                        left: isDocked ? "auto" : (isMaximized ? 0 : "50%"),
                        top: isMaximized || isDocked ? 0 : "10%",
                        translateX: (isMaximized || isDocked) ? 0 : "-50%",
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={cn(
                        "pointer-events-auto bg-background/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col",
                        isMaximized || isDocked ? "fixed rounded-none" : "relative rounded-2xl md:max-w-5xl"
                    )}
                    style={{ touchAction: "none" }}
                >
                    {/* Glass Header */}
                    <div className="h-14 border-b border-white/5 bg-white/5 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing select-none shrink-0 group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex gap-1.5 shrink-0">
                                <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors" />
                                <button onClick={() => { setIsDocked(false); setIsMaximized(false); }} className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors" />
                                <button onClick={() => setIsMaximized(!isMaximized)} className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors" />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground bg-white/5 border border-white/5 px-3 py-1.5 rounded-full truncate max-w-sm">
                                <Move className="w-3 h-3 opacity-50" />
                                <span className="truncate opacity-80">{url}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsDocked(!isDocked)}
                                className={cn(
                                    "p-2 hover:bg-white/10 rounded-xl transition-all",
                                    isDocked ? "text-primary bg-primary/10" : "text-muted-foreground"
                                )}
                                title="Dock to Side"
                            >
                                <LayoutPanelLeft className="w-4.5 h-4.5" />
                            </button>

                            <div className="w-px h-4 bg-white/10 mx-1" />

                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all"
                                title="External Link"
                                onPointerDownCapture={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="w-4.5 h-4.5" />
                            </a>

                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-2 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all hidden sm:flex"
                                onPointerDownCapture={(e) => e.stopPropagation()}
                            >
                                {isMaximized ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-xl transition-all ml-1"
                                onPointerDownCapture={(e) => e.stopPropagation()}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Browser Content */}
                    <div className="flex-1 bg-white relative">
                        <iframe
                            src={displayUrl}
                            className="w-full h-full border-none"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            title="Internal Browser"
                        />

                        {isRestricted && (
                            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-3 p-3 bg-card/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                        <Globe className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        <span className="font-bold text-foreground">Anti-Frame Detection:</span> This site may require the LAAG Extension to load correctly.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => window.open(url, "_blank")}
                                    className="h-8 text-[10px] bg-primary/20 hover:bg-primary/30 text-primary border-none shadow-none font-bold"
                                >
                                    Open External
                                </Button>
                            </div>
                        )}

                        {/* Loading State Overlay (Subtle) */}
                        <div className="absolute inset-0 pointer-events-none bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Resize Handle (Bottom Right) */}
                    {!isMaximized && !isDocked && (
                        <div className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripHorizontal className="w-4 h-4 text-white/20 rotate-45" />
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
