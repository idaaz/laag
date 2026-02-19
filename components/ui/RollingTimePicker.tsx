"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RollingTimePickerProps {
    value: string; // "HH:mm" format
    onChange: (value: string) => void;
    className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

export function RollingTimePicker({ value, onChange, className }: RollingTimePickerProps) {
    const [h, m] = value.split(":");
    const currentHour = h || "00";
    const currentMinute = m || "00";

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    const scrollToValue = (ref: React.RefObject<HTMLDivElement | null>, val: string, items: string[]) => {
        if (!ref.current) return;
        const index = items.indexOf(val);
        const itemHeight = 32; // height of each item in px
        ref.current.scrollTop = index * itemHeight;
    };

    useEffect(() => {
        scrollToValue(hourRef, currentHour, HOURS);
        scrollToValue(minuteRef, currentMinute, MINUTES);
    }, [currentHour, currentMinute]);

    const handleScroll = (
        type: "h" | "m",
        ref: React.RefObject<HTMLDivElement | null>,
        items: string[]
    ) => {
        if (!ref.current) return;
        const itemHeight = 32;
        const index = Math.round(ref.current.scrollTop / itemHeight);
        const newVal = items[index];

        if (newVal !== undefined) {
            if (type === "h" && newVal !== currentHour) {
                onChange(`${newVal}:${currentMinute}`);
            } else if (type === "m" && newVal !== currentMinute) {
                onChange(`${currentHour}:${newVal}`);
            }
        }
    };

    const renderColumn = (
        ref: React.RefObject<HTMLDivElement | null>,
        items: string[],
        current: string,
        type: "h" | "m"
    ) => (
        <div
            ref={ref}
            onScroll={() => handleScroll(type, ref, items)}
            className="h-32 overflow-y-scroll snap-y snap-mandatory scrollbar-hide py-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {items.map((item) => (
                <div
                    key={item}
                    onClick={() => {
                        const itemHeight = 32;
                        const index = items.indexOf(item);
                        if (ref.current) ref.current.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
                    }}
                    className={cn(
                        "h-8 flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                        item === current ? "text-primary font-bold scale-110" : "text-muted-foreground opacity-40 hover:opacity-100"
                    )}
                >
                    {item}
                </div>
            ))}
        </div>
    );

    return (
        <div className={cn("flex items-center justify-center gap-4 bg-secondary/20 rounded-lg border border-border/50 p-2 relative overflow-hidden", className)}>
            {/* Selection Highlight Overlays */}
            <div className="absolute inset-x-0 top-[calc(50%-16px)] h-8 pointer-events-none border-y border-primary/20 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.05)]" />

            <div className="flex items-center gap-1">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Hrs</span>
                    {renderColumn(hourRef, HOURS, currentHour, "h")}
                </div>

                <span className="text-xl font-bold text-primary/50 mt-4">:</span>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Min</span>
                    {renderColumn(minuteRef, MINUTES, currentMinute, "m")}
                </div>
            </div>
        </div>
    );
}
