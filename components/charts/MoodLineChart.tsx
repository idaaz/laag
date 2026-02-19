"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function MoodLineChart({
  data
}: {
  data: Array<{ date: string; mood: number; productivity: number }>;
}) {
  return (
    <div className="h-72 w-full" aria-label="Mood and productivity line chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Line type="monotone" dataKey="mood" stroke="hsl(var(--accent))" strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="productivity"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
