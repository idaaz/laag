"use client";

import { useState, useEffect } from "react";
import { ListTodo, Zap, NotebookPen, Flame, Smartphone, type LucideIcon } from "lucide-react";
import { Pie, PieChart, Cell, Tooltip as RechartsTooltip } from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { HabitRow } from "@/lib/supabase/types";

export function StatCard({ title, children, icon: Icon, color }: { title: string; children: React.ReactNode; icon?: LucideIcon; color?: string }) {
    return (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-white/2 min-w-[130px] flex-1">
            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="h-3 w-3 opacity-60" style={{ color }} />}
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{title}</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
                {children}
            </div>
        </div>
    );
}

export function StatDonut({ data, centerText, centerSubtext }: { data: Array<{ value: number; color: string; name: string }>, centerText?: string, centerSubtext?: string }) {
    const activeData = data.filter(d => d.value > 0);
    // Prevent SSR/hydration mismatch — Recharts generates auto-incremented clipPathIds
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="relative h-16 w-16 mx-auto">
            {mounted ? (
                <PieChart width={64} height={64}>
                    <Pie
                        data={activeData.length > 0 ? activeData : [{ value: 1, color: "rgba(255,255,255,0.05)", name: "Empty" }]}
                        innerRadius={20}
                        outerRadius={30}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        cx={28}
                        cy={28}
                    >
                        {(activeData.length > 0 ? activeData : [{ color: "rgba(255,255,255,0.05)" }]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <RechartsTooltip
                        cursor={false}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                if (data.name === "Empty") return null;
                                return (
                                    <div className="rounded border border-white/10 bg-[#0c0d10] px-2 py-1 shadow-xl text-[10px] flex items-center gap-1.5 z-50">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
                                        <span className="text-muted-foreground whitespace-nowrap">{data.name}:</span>
                                        <span className="font-bold text-foreground">{data.value}</span>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </PieChart>
            ) : (
                <div className="h-16 w-16 rounded-full border-2 border-white/5" />
            )}
            {centerText && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold tabular-nums leading-none">{centerText}</span>
                    {centerSubtext && <span className="text-[7px] text-muted-foreground mt-0.5">{centerSubtext}</span>}
                </div>
            )}
        </div>
    );
}

export function TasksGraph({ pending, completed, overdue }: { pending: number; completed: number; overdue: number }) {
    const total = pending + completed + overdue;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const data = [
        { name: "Completed", value: completed, color: "var(--k-green)" },
        { name: "Pending", value: pending, color: "var(--k-blue)" },
        { name: "Overdue", value: overdue, color: "var(--k-red)" },
    ];

    return (
        <StatCard title="Tasks" icon={ListTodo} color="var(--k-blue)">
            <StatDonut data={data} centerText={`${successRate}%`} />
        </StatCard>
    );
}

export function HabitStatCard({ h, onSelect, habits }: { h: HabitRow | null, onSelect: (id: string) => void, habits: HabitRow[] }) {
    const data = h ? [
        { name: "Streak", value: h.current_streak, color: "var(--k-gold)" },
        { name: "Missed", value: h.relapse_count, color: "var(--k-red)" },
        { name: "Best", value: h.longest_streak, color: "var(--primary)" },
    ] : [];

    return (
        <StatCard title="Habit" icon={Zap} color="var(--k-gold)">
            <div className="flex flex-col gap-2 items-center">
                <div className="w-full">
                    <Select value={h?.id ?? ""} onValueChange={onSelect}>
                        <SelectTrigger className="h-5 px-1.5 py-0 text-[10px] bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                            <SelectValue placeholder="Select habit" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0c0d10] border-white/10">
                            {habits.map(habit => (
                                <SelectItem key={habit.id} value={habit.id} className="text-[10px] focus:bg-white/10">
                                    {habit.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full">
                    {h ? (
                        <StatDonut data={data} centerText={`${h.current_streak}d`} centerSubtext="streak" />
                    ) : (
                        <div className="h-16 w-16 mx-auto flex items-center justify-center text-[9px] text-muted-foreground">Select</div>
                    )}
                </div>
            </div>
        </StatCard>
    );
}

export function LogStatCard({ logged, missed, accountability, energy }: { logged: number, missed: number, accountability: number, energy: number }) {
    const data = [
        { name: "Logged", value: logged, color: "var(--k-teal)" },
        { name: "Missed", value: missed, color: "var(--k-red)" },
        { name: "Accountability", value: accountability, color: "var(--k-green)" },
        { name: "Energy", value: energy, color: "var(--k-blue)" }
    ];
    return (
        <StatCard title="Logs" icon={NotebookPen} color="var(--k-teal)">
            <StatDonut data={data} centerText={logged.toString()} centerSubtext="logged" />
        </StatCard>
    );
}

export function NoteStatCard({ completed, pending, pinned }: { completed: number, pending: number, pinned: number }) {
    const data = [
        { name: "Done", value: completed, color: "var(--k-indigo)" },
        { name: "Todo", value: pending, color: "var(--foreground)" },
        { name: "Pinned", value: pinned, color: "var(--k-gold)" },
    ];
    return (
        <StatCard title="Notes" icon={Flame} color="var(--k-indigo)">
            <StatDonut data={data} centerText={(completed + pending).toString()} centerSubtext="total" />
        </StatCard>
    );
}

export function TrackStatCard({ total, top }: { total: number, top: { name: string, count: number } }) {
    const others = Math.max(0, total - top.count);
    const data = [
        { name: top.name || "Top", value: top.count, color: "var(--k-orange)" },
        { name: "Other", value: others, color: "var(--foreground)" }
    ];
    return (
        <StatCard title="Track" icon={Smartphone} color="var(--k-orange)">
            <StatDonut data={data} centerText={total.toString()} centerSubtext="visits" />
        </StatCard>
    );
}
