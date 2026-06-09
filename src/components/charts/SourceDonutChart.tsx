import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BreakdownPoint } from "../../lib/types";
import { formatTokens, toTitle } from "../../lib/format";

const COLORS = ["#2dd4bf", "#38bdf8", "#f59e0b", "#a3e635", "#fb7185", "#c084fc", "#94a3b8"];

export function SourceDonutChart({ data }: { data: BreakdownPoint[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem]">
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--panel))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => [formatTokens(value), "Total tokens"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 self-center">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="truncate">{toTitle(item.name)}</span>
            </span>
            <span className="font-mono text-xs">{formatTokens(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
