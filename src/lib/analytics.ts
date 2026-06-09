import type {
  BreakdownPoint,
  DashboardSummary,
  ModelStat,
  SessionStat,
  SummaryCardData,
  TimeRangeId,
  TokenSpike,
  TrendPoint,
  UsageEvent,
} from "./types";
import { dayKey, enumerateDays, getRangeWindow, isWithinRange } from "./ranges";

function sum(events: UsageEvent[]) {
  return events.reduce(
    (acc, event) => {
      acc.total += event.total_tokens;
      acc.input += event.input_tokens;
      acc.output += event.output_tokens;
      acc.cost += event.estimated_cost_usd ?? 0;
      return acc;
    },
    { total: 0, input: 0, output: 0, cost: 0 },
  );
}

function comparison(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function filterEventsForRange(events: UsageEvent[], range: TimeRangeId, now = new Date()) {
  const window = getRangeWindow(range, now);
  return events.filter((event) => isWithinRange(event.timestamp, window));
}

export function createSummaryCard(events: UsageEvent[], range: TimeRangeId, now = new Date()): SummaryCardData {
  const window = getRangeWindow(range, now);
  const currentEvents = events.filter((event) => isWithinRange(event.timestamp, window));
  const previousEvents = events.filter((event) =>
    isWithinRange(event.timestamp, { start: window.previousStart, end: window.previousEnd }),
  );
  const current = sum(currentEvents);
  const previous = sum(previousEvents);

  return {
    label: window.label,
    total_tokens: current.total,
    estimated_cost_usd: current.cost,
    input_tokens: current.input,
    output_tokens: current.output,
    comparison_delta: comparison(current.total, previous.total),
  };
}

export function getDailyTrend(events: UsageEvent[], range: TimeRangeId, now = new Date()): TrendPoint[] {
  const window = getRangeWindow(range, now);
  const days = enumerateDays(window.start, window.end);
  const map = new Map<string, TrendPoint>();
  for (const day of days) {
    map.set(day, {
      date: day,
      input_tokens: 0,
      output_tokens: 0,
      cache_tokens: 0,
      reasoning_tokens: 0,
      total_tokens: 0,
    });
  }

  for (const event of events) {
    if (!isWithinRange(event.timestamp, window)) continue;
    const key = dayKey(event.timestamp);
    const point = map.get(key);
    if (!point) continue;
    point.input_tokens += event.input_tokens;
    point.output_tokens += event.output_tokens;
    point.cache_tokens += event.cache_read_tokens + event.cache_write_tokens;
    point.reasoning_tokens += event.reasoning_tokens;
    point.total_tokens += event.total_tokens;
  }

  return Array.from(map.values());
}

function breakdownBy(events: UsageEvent[], field: "source" | "model"): BreakdownPoint[] {
  const totals = new Map<string, number>();
  for (const event of events) {
    const key = event[field];
    totals.set(key, (totals.get(key) ?? 0) + event.total_tokens);
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getModelStats(events: UsageEvent[]): ModelStat[] {
  const stats = new Map<string, ModelStat & { sessions: Set<string> }>();
  for (const event of events) {
    const current =
      stats.get(event.model) ??
      ({
        model: event.model,
        provider: event.provider,
        total_tokens: 0,
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        reasoning_tokens: 0,
        estimated_cost_usd: 0,
        sessions_count: 0,
        last_used: event.timestamp,
        sessions: new Set<string>(),
      } satisfies ModelStat & { sessions: Set<string> });
    current.total_tokens += event.total_tokens;
    current.input_tokens += event.input_tokens;
    current.output_tokens += event.output_tokens;
    current.cached_tokens += event.cache_read_tokens + event.cache_write_tokens;
    current.reasoning_tokens += event.reasoning_tokens;
    current.estimated_cost_usd += event.estimated_cost_usd ?? 0;
    current.last_used = new Date(event.timestamp) > new Date(current.last_used) ? event.timestamp : current.last_used;
    current.sessions.add(event.session_id ?? event.id);
    current.sessions_count = current.sessions.size;
    stats.set(event.model, current);
  }
  return Array.from(stats.values())
    .map(({ sessions: _sessions, ...stat }) => stat)
    .sort((a, b) => b.total_tokens - a.total_tokens);
}

export function getSessionStats(events: UsageEvent[]): SessionStat[] {
  const stats = new Map<string, SessionStat>();
  for (const event of events) {
    const key = event.session_id ?? event.id;
    const current =
      stats.get(key) ??
      ({
        session_id: key,
        project_name: event.project_name,
        source: event.source,
        model: event.model,
        total_tokens: 0,
        estimated_cost_usd: 0,
        started_at: event.timestamp,
        events_count: 0,
      } satisfies SessionStat);
    current.total_tokens += event.total_tokens;
    current.estimated_cost_usd += event.estimated_cost_usd ?? 0;
    current.started_at = new Date(event.timestamp) < new Date(current.started_at) ? event.timestamp : current.started_at;
    current.events_count += 1;
    stats.set(key, current);
  }
  return Array.from(stats.values()).sort((a, b) => b.estimated_cost_usd - a.estimated_cost_usd);
}

export function getTokenSpikes(events: UsageEvent[], now = new Date()): TokenSpike[] {
  const daily = getDailyTrend(events, "30d", now);
  const byDaySource = new Map<string, UsageEvent[]>();
  for (const event of filterEventsForRange(events, "30d", now)) {
    const key = `${dayKey(event.timestamp)}:${event.source}`;
    byDaySource.set(key, [...(byDaySource.get(key) ?? []), event]);
  }

  return daily
    .map((point, index) => {
      const previous = daily[index - 1]?.total_tokens ?? point.total_tokens;
      const candidates = Array.from(byDaySource.entries())
        .filter(([key]) => key.startsWith(`${point.date}:`))
        .map(([, sourceEvents]) => sourceEvents)
        .sort((a, b) => sum(b).total - sum(a).total)[0];
      const top = candidates?.[0];
      return top
        ? {
            date: point.date,
            source: top.source,
            model: top.model,
            total_tokens: point.total_tokens,
            delta_vs_previous_day: point.total_tokens - previous,
          }
        : null;
    })
    .filter((spike): spike is TokenSpike => Boolean(spike))
    .filter((spike) => spike.delta_vs_previous_day > 40_000)
    .sort((a, b) => b.delta_vs_previous_day - a.delta_vs_previous_day)
    .slice(0, 6);
}

export function buildDashboardSummary(events: UsageEvent[], range: TimeRangeId, now = new Date()): DashboardSummary {
  const scoped = filterEventsForRange(events, range, now);
  return {
    cards: [
      createSummaryCard(events, "today", now),
      createSummaryCard(events, "3d", now),
      createSummaryCard(events, "7d", now),
      createSummaryCard(events, "30d", now),
    ],
    daily_trend: getDailyTrend(events, range, now),
    tokens_by_source: breakdownBy(scoped, "source"),
    tokens_by_model: breakdownBy(scoped, "model").slice(0, 8),
    top_expensive_sessions: getSessionStats(scoped).slice(0, 8),
    spikes: getTokenSpikes(events, now),
  };
}
