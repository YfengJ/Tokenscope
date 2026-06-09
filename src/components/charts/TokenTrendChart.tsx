import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "../../lib/types";
import { formatDay, formatLongTokens, formatTokens } from "../../lib/format";

function TokenTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 text-xs shadow-glow">
      <div className="mb-2 font-medium text-foreground">{formatDay(label)}</div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex min-w-44 items-center justify-between gap-4 text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="font-mono text-foreground">{formatLongTokens(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TokenTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatDay} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={formatTokens} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
          content={<TokenTooltip />}
        />
        <Bar dataKey="input_tokens" name="Input" stackId="tokens" fill="#2dd4bf" radius={[0, 0, 4, 4]} />
        <Bar dataKey="output_tokens" name="Output" stackId="tokens" fill="#38bdf8" />
        <Bar dataKey="cache_tokens" name="Cached" stackId="tokens" fill="#f59e0b" />
        <Bar dataKey="reasoning_tokens" name="Reasoning" stackId="tokens" fill="#a3e635" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
