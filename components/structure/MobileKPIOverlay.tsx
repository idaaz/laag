"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { } from "lucide-react";
import { useMobileKPI } from "@/lib/context/MobileKPIContext";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 240; // Desktop-ish width or percentage

export function MobileKPIOverlay() {
    const { kpis, isOpen, setIsOpen } = useMobileKPI();
    const controls = useAnimation();
    const panelRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // const isRightAlignedKPI = ["/dashboard", "/achievements", "/analytics"].includes(pathname);

    useEffect(() => {
        if (isOpen) {
            controls.start({ x: 0 });
        } else {
            controls.start({ x: PANEL_WIDTH });
        }
    }, [isOpen, controls]);

    useEffect(() => {
        if (kpis.length === 0 && isOpen) {
            setIsOpen(false);
        }
    }, [kpis, isOpen, setIsOpen]);



    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Only handle closing swipe (right)
        if (info.offset.x > 50 || info.velocity.x > 500) {
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

            {/* Actual Panel (SWIPE RIGHT TO CLOSE) */}
            <motion.div
                ref={panelRef}
                className="fixed top-0 right-0 bottom-0 z-[100] w-[240px] bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl p-6 lg:hidden"
                initial={{ x: PANEL_WIDTH }}
                animate={controls}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                drag="x"
                dragConstraints={{ left: 0, right: PANEL_WIDTH }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
            >
                <div className="h-full flex flex-col justify-center space-y-8">
                    {kpis.length > 0 ? kpis.map((item, idx) => (
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
                    )) : (
                        <div className="text-center space-y-2 opacity-60">
                            <p className="text-2xl font-bold tracking-tight">--</p>
                            <p className="text-[10px] uppercase tracking-widest font-semibold">No metrics for this page</p>
                        </div>
                    )}
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
