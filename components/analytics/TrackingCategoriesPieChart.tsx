"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type CategoryData = {
    category: string;
    count: number;
    percentage: number;
    color: string;
};

export function TrackingCategoriesPieChart({ data, onCategoryClick }: { data: CategoryData[], onCategoryClick?: (cat: string) => void }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-background/20 rounded-xl border border-border/40 backdrop-blur-sm">
                No category data available
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[250px] relative group">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="category"
                        stroke="none"
                        onClick={(entry) => onCategoryClick?.(entry.category)}
                        className="cursor-pointer"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color || "hsl(var(--muted-foreground))"}
                                className="transition-all duration-300 hover:opacity-80 hover:scale-105"
                                style={{ outline: 'none' }}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: number, name: string, item: any) => [
                            `${value} visits (${Math.round(item.payload.percentage)}%)`,
                            name
                        ]}
                        contentStyle={{
                            backgroundColor: "rgba(23, 23, 23, 0.8)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            fontSize: "11px",
                            padding: "8px 12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                        }}
                        itemStyle={{ color: "#fff" }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
