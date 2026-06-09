import type { TrendPoint } from "../../lib/types";
import { cn } from "../../lib/cn";
import { formatDay, formatTokens } from "../../lib/format";

interface CalendarHeatmapProps {
  data: TrendPoint[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function CalendarHeatmap({ data, selectedDate, onSelectDate }: CalendarHeatmapProps) {
  const max = Math.max(...data.map((point) => point.total_tokens), 1);
  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((point) => {
        const intensity = point.total_tokens / max;
        return (
          <button
            key={point.date}
            type="button"
            title={`${formatDay(point.date)}: ${formatTokens(point.total_tokens)} tokens`}
            className={cn(
              "aspect-square rounded-md border border-border text-[10px] text-transparent transition hover:border-accent hover:text-foreground",
              selectedDate === point.date && "border-accent text-foreground ring-2 ring-accent/30",
            )}
            style={{
              background: `rgba(45, 212, 191, ${0.08 + intensity * 0.72})`,
            }}
            onClick={() => onSelectDate(point.date)}
          >
            {new Date(`${point.date}T12:00:00`).getDate()}
          </button>
        );
      })}
    </div>
  );
}
