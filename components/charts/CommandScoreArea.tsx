"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface CommandTrendPoint {
    date: string;
    commandScore: number;
    disciplineScore: number;
}

export function CommandScoreArea({ data }: { data: CommandTrendPoint[] }) {
    const formattedData = useMemo(() => {
        return data.map((d) => ({
            ...d,
            displayDate: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="flex h-full items-center justify-center text-sm text-muted-foreground font-medium">No Command data available.</div>;
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCommand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDiscipline" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--k-blue)" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="var(--k-blue)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
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
                        domain={[0, 100]}
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
                                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                                    <span className="text-xs font-medium text-foreground">Command</span>
                                                </div>
                                                <span className="text-sm font-bold">{payload[0].value}%</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-2 w-2 rounded-full bg-[var(--k-blue)]" />
                                                    <span className="text-xs font-medium text-muted-foreground">Discipline</span>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">{payload[1]?.value}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="commandScore"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCommand)"
                        activeDot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="disciplineScore"
                        stroke="var(--k-blue)"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorDiscipline)"
                        activeDot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
