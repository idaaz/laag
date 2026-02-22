"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { TimeBlockRow } from "@/lib/supabase/types";
import { Brain, GraduationCap, Sword, Dumbbell, PlayCircle, PauseCircle, Trash2, Music, ClipboardList, Ghost, Clock } from "lucide-react";

interface LogTimelineProps {
    blocks: TimeBlockRow[];
    onFillGhost: (startTime: string) => void;
    onEditBlock: (block: TimeBlockRow) => void;
}

const CATEGORY_MAP = {
    "Deep Work": { color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30", icon: Brain },
    "Education": { color: "bg-blue-500/20 text-blue-500 border-blue-500/30", icon: GraduationCap },
    "Skill": { color: "bg-amber-500/20 text-amber-500 border-amber-500/30", icon: Sword },
    "Musical Work": { color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: Music },
    "Daily Work": { color: "bg-cyan-500/20 text-cyan-500 border-cyan-500/30", icon: ClipboardList },
    "Health": { color: "bg-orange-500/20 text-orange-500 border-orange-500/30", icon: Dumbbell },
    "Entertainment": { color: "bg-pink-500/20 text-pink-500 border-pink-500/30", icon: PlayCircle },
    "Break": { color: "bg-slate-500/20 text-slate-500 border-slate-500/30", icon: PauseCircle },
    "Wasted": { color: "bg-rose-500/20 text-rose-500 border-rose-500/30", icon: Trash2 },
};

export function LogTimeline({ blocks, onFillGhost, onEditBlock }: LogTimelineProps) {
    // Generate the timeline for the day (e.g., from 6 AM to Now + 1 block)
    const timeline = useMemo(() => {
        const slots = [];
        const startHour = 6; // Start showing timeline from 6 AM
        const now = new Date();
        const currentHour = now.getHours();
        const currentMins = now.getMinutes();



        for (let h = startHour; h <= currentHour || (h === currentHour && currentMins >= 0); h++) {
            // Slot 1: HH:00 - HH:30
            slots.push({ hour: h, mins: 0 });
            // Slot 2: HH:30 - (HH+1):00
            if (h < currentHour || (h === currentHour && currentMins >= 30)) {
                slots.push({ hour: h, mins: 30 });
            }
        }

        return slots.reverse(); // Show newest at top
    }, []);

    const getBlockForSlot = (hour: number, mins: number) => {
        return blocks.find(b => {
            const start = new Date(b.start_time);
            return start.getHours() === hour && start.getMinutes() === mins;
        });
    };

    return (
        <div className="relative pl-8 space-y-4">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />

            {timeline.map((slot, idx) => {
                const block = getBlockForSlot(slot.hour, slot.mins);
                const timeStr = `${slot.hour.toString().padStart(2, '0')}:${slot.mins.toString().padStart(2, '0')}`;
                const isCurrent = idx === 0;

                if (block) {
                    const config = CATEGORY_MAP[block.category as keyof typeof CATEGORY_MAP];
                    const Icon = config.icon;

                    return (
                        <div key={timeStr} className="relative group animate-in fade-in slide-in-from-left-4 duration-500">
                            {/* Dot on Line */}
                            <div className={cn(
                                "absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-background z-10",
                                config.color.split(' ')[1].replace('text-', 'bg-')
                            )} />

                            <button
                                onClick={() => onEditBlock(block)}
                                className={cn(
                                    "flex flex-col w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.01] hover:shadow-lg",
                                    config.color
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-3 h-3" />
                                        <span className="text-[10px] font-mono tracking-tighter uppercase opacity-80">{timeStr} — Logged</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {block.energy_level >= 4 && <span className="text-[10px]">🔥</span>}
                                        <span className="text-[8px] opacity-40 uppercase font-mono">Edit</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold tracking-tight">{block.activity}</span>
                                    {!block.is_planned && <span className="text-[10px] bg-rose-500/20 px-1 rounded text-rose-300">Unplanned</span>}
                                </div>
                                {block.output_notes && (
                                    <p className="text-[10px] mt-1 opacity-60 line-clamp-1 italic">&quot;{block.output_notes}&quot;</p>
                                )}
                            </button>
                        </div>
                    );
                }

                // Ghost Block / Missing Log
                return (
                    <div key={timeStr} className="relative group">
                        <div className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-background bg-secondary z-10 group-hover:bg-primary transition-colors" />

                        <button
                            onClick={() => onFillGhost(timeStr)}
                            className={cn(
                                "w-full flex items-center justify-between p-3 rounded-lg border border-dashed border-border/50 bg-secondary/5 text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5",
                                isCurrent ? "animate-pulse border-primary/30" : "opacity-40 hover:opacity-100"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-mono">{timeStr}</span>
                                <span className="text-xs italic">Missing Log — Click to Fill</span>
                            </div>
                            <Ghost className="w-3 h-3 opacity-20" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
