"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function ScreenStudyArea({
  data
}: {
  data: Array<{ date: string; studyHours: number; screenHours: number }>;
}) {
  return (
    <div className="h-72 w-full" aria-label="Screen time versus study time area chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="studyHours"
            stackId="1"
            stroke="hsl(var(--success))"
            fill="hsl(var(--success) / 0.35)"
          />
          <Area
            type="monotone"
            dataKey="screenHours"
            stackId="1"
            stroke="hsl(var(--destructive))"
            fill="hsl(var(--destructive) / 0.35)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
