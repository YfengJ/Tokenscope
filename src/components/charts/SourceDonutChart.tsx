import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BreakdownPoint } from "../../lib/types";
import { formatTokens, toTitle } from "../../lib/format";

const COLORS = ["#2dd4bf", "#38bdf8", "#f59e0b", "#a3e635", "#fb7185", "#c084fc", "#94a3b8"];

function formatShare(value: number, total: number) {
  if (total <= 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function SourceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: BreakdownPoint; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const value = payload[0].value ?? point?.value ?? 0;
  if (!point) return null;

  return (
    <div className="rounded-md border border-border bg-panel px-3 py-2 text-sm shadow-glow">
      <div className="font-medium text-foreground">{toTitle(point.name)}</div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">{formatTokens(value)}</div>
    </div>
  );
}

export function SourceDonutChart({ data }: { data: BreakdownPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex min-h-64 flex-col gap-4 lg:flex-row lg:items-center">
      <div className="h-64 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={data.length > 1 ? 3 : 0}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<SourceTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 self-stretch lg:w-56 lg:self-center">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="min-w-0">
                <span className="block truncate text-foreground">{toTitle(item.name)}</span>
                <span className="block font-mono text-xs text-muted-foreground">{formatShare(item.value, total)}</span>
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs">{formatTokens(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
