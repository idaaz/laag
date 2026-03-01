"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface ExecutionGapPoint {
    date: string;
    plannedMinutes: number;
    actualMinutes: number;
    gapMinutes: number;
}

export function ExecutionGapBar({ data }: { data: ExecutionGapPoint[] }) {
    const formattedData = useMemo(() => {
        return data.map((d) => ({
            ...d,
            displayDate: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            plannedHrs: Number((d.plannedMinutes / 60).toFixed(1)),
            actualHrs: Number((d.actualMinutes / 60).toFixed(1)),
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="flex h-full items-center justify-center text-sm text-muted-foreground font-medium">No Execution Data Available.</div>;
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="displayDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                        dy={10}
                        minTickGap={20}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border border-white/10 bg-[#0c0d10] p-3 shadow-xl z-50">
                                        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-2 w-2 rounded-full bg-border" />
                                                    <span className="text-xs font-medium text-muted-foreground">Planned</span>
                                                </div>
                                                <span className="text-sm font-bold">{payload[0].value}h</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-2 w-2 rounded-full bg-[var(--k-gold)]" />
                                                    <span className="text-xs font-medium text-foreground">Executed</span>
                                                </div>
                                                <span className="text-xs font-bold text-[var(--k-gold)]">{payload[1]?.value}h</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    />
                    <Bar dataKey="plannedHrs" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="actualHrs" fill="var(--k-gold)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
