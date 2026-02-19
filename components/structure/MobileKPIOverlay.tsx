"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useMobileKPI } from "@/lib/context/MobileKPIContext";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 240; // Desktop-ish width or percentage
const TRIGGER_WIDTH = 12;

export function MobileKPIOverlay() {
    const { kpis } = useMobileKPI();
    const [isOpen, setIsOpen] = useState(false);
    const controls = useAnimation();
    const panelRef = useRef<HTMLDivElement>(null);

    // Height adapts to KPI count (min height to look okay)
    const barHeight = Math.max(kpis.length * 30, 60);

    useEffect(() => {
        if (kpis.length === 0 && isOpen) {
            setIsOpen(false);
            controls.start({ x: PANEL_WIDTH });
        }
    }, [kpis, isOpen, controls]);

    if (kpis.length === 0) return null;

    const handleDragEnd = (event: any, info: PanInfo) => {
        // If swiped left beyond threshold or velocity is high enough
        if (info.offset.x < -50 || info.velocity.x < -500) {
            setIsOpen(true);
            controls.start({ x: 0 });
        } else if (info.offset.x > 50 || info.velocity.x > 500) {
            setIsOpen(false);
            controls.start({ x: PANEL_WIDTH });
        } else {
            // Snap back
            controls.start({ x: isOpen ? 0 : PANEL_WIDTH });
        }
    };

    const close = () => {
        setIsOpen(false);
        controls.start({ x: PANEL_WIDTH });
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={close}
                    className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px] lg:hidden"
                />
            )}

            {/* Trigger Bar Indicator (always slightly visible) */}
            {!isOpen && (
                <motion.div
                    className="fixed right-0 top-1/2 z-[91] -translate-y-1/2 lg:hidden cursor-grab active:cursor-grabbing"
                    style={{ height: barHeight }}
                    drag="x"
                    dragConstraints={{ left: -PANEL_WIDTH, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                >
                    <div className="h-full w-[12px] rounded-l-full bg-primary/30 border-l border-y border-primary/20 shadow-[-2px_0_10px_rgba(var(--primary),0.2)] flex items-center justify-center overflow-hidden">
                        <div className="w-1 h-1/2 rounded-full bg-white/40" />
                    </div>
                </motion.div>
            )}

            {/* Actual Panel */}
            <motion.div
                ref={panelRef}
                className="fixed top-0 right-0 bottom-0 z-[100] w-[240px] bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl p-6 lg:hidden"
                initial={{ x: PANEL_WIDTH }}
                animate={controls}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
                <div className="h-full flex flex-col justify-center space-y-8">
                    {kpis.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 20 }}
                            transition={{ delay: idx * 0.1 }}
                            className="space-y-1"
                        >
                            <p className={cn(
                                "text-4xl font-bold tracking-tight tabular-nums",
                                item.color === "success" && "text-[var(--k-green)]",
                                item.color === "danger" && "text-[var(--k-red)]",
                                item.color === "warning" && "text-[var(--k-orange)]",
                                item.color === "info" && "text-[var(--k-blue)]",
                                item.color === "focus" && "text-[var(--k-teal)]",
                                item.color === "score" && "text-[var(--k-indigo)]",
                                item.color === "achievement" && "text-[var(--k-gold)]",
                                item.color === "calibration" && "text-[var(--k-purple)]",
                            )}>
                                {item.value}
                            </p>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                                {item.label}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Subtle Close handle inside panel */}
                <div
                    onClick={close}
                    className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-pointer opacity-20 hover:opacity-100 transition-opacity"
                >
                    <div className="w-1 h-16 rounded-full bg-foreground/20" />
                </div>
            </motion.div>
        </>
    );
}
