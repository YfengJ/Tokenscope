import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BreakdownPoint } from "../../lib/types";
import { formatTokens } from "../../lib/format";

export function ModelBarChart({ data }: { data: BreakdownPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <XAxis type="number" tickFormatter={formatTokens} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={124}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
          contentStyle={{
            background: "hsl(var(--panel))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: number) => [formatTokens(value), "Total tokens"]}
        />
        <Bar dataKey="value" name="Tokens" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
