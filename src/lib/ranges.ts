import type { RangeWindow, TimeRangeId } from "./types";

const LABELS: Record<TimeRangeId, string> = {
  today: "Today",
  "3d": "Last 3 days",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  custom: "Custom",
};

export function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function getRangeWindow(id: TimeRangeId, now = new Date()): RangeWindow {
  const end = now;
  const todayStart = startOfLocalDay(now);
  const days = id === "today" ? 1 : id === "3d" ? 3 : id === "7d" ? 7 : id === "30d" ? 30 : 7;
  const start = id === "today" ? todayStart : addDays(todayStart, -(days - 1));
  const previousEnd = new Date(start);
  const previousStart = addDays(previousEnd, -days);

  return {
    id,
    label: LABELS[id],
    start,
    end,
    previousStart,
    previousEnd,
  };
}

export function isWithinRange(timestamp: string, window: Pick<RangeWindow, "start" | "end">) {
  const value = new Date(timestamp).getTime();
  return value >= window.start.getTime() && value <= window.end.getTime();
}

export function dayKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function enumerateDays(start: Date, end: Date) {
  const days: string[] = [];
  let cursor = startOfLocalDay(start);
  const last = startOfLocalDay(end);
  while (cursor.getTime() <= last.getTime()) {
    days.push(dayKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}
