import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { TrendPoint } from "../../lib/types";

export function SparklineChart({ data, positive }: { data: TrendPoint[]; positive: boolean }) {
  const color = positive ? "#2dd4bf" : "#f59e0b";

  return (
    <ResponsiveContainer width="100%" height={42}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${positive ? "up" : "down"}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="total_tokens"
          stroke={color}
          strokeWidth={1.6}
          fill={`url(#spark-${positive ? "up" : "down"})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
