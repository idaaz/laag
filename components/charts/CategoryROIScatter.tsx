"use client";

import { useMemo } from "react";
import { Scatter, ScatterChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

interface CategoryROI {
    category: string;
    timeSpentMinutes: number;
    tasksCompleted: number;
    roiScore: number;
    color: string;
}

export function CategoryROIScatter({ data }: { data: CategoryROI[] }) {
    const formattedData = useMemo(() => {
        return data.map((d) => ({
            ...d,
            timeHrs: Number((d.timeSpentMinutes / 60).toFixed(1)),
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="flex h-full items-center justify-center text-sm text-muted-foreground font-medium">No ROI Data Available.</div>;
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        type="number"
                        dataKey="timeHrs"
                        name="Time Invested (hrs)"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    />
                    <YAxis
                        type="number"
                        dataKey="tasksCompleted"
                        name="Tasks Completed"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="rounded-lg border border-white/10 bg-[#0c0d10] p-3 shadow-xl z-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                                            <p className="text-sm font-bold text-foreground capitalize">{data.category}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 text-xs">
                                            <div className="flex justify-between gap-4 text-muted-foreground">
                                                <span>Time:</span>
                                                <span className="font-semibold text-foreground">{data.timeHrs}h</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-muted-foreground">
                                                <span>Output:</span>
                                                <span className="font-semibold text-foreground">{data.tasksCompleted} tasks</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-muted-foreground">
                                                <span>ROI:</span>
                                                <span className="font-semibold text-[var(--k-green)]">{data.roiScore} t/h</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter name="ROI" data={formattedData} fill="#8884d8">
                        {formattedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
