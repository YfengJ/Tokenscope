import { useMemo, useState } from "react";
import { filterEventsForRange } from "../lib/analytics";
import { formatCurrency, formatDateTime, formatLongTokens, toTitle } from "../lib/format";
import { useAppStore } from "../store/useAppStore";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Table, Td, Th } from "../components/ui/Table";
import { SourceMetaBadge } from "../components/ui/SourceMetaBadge";
import type { TimeRangeId } from "../lib/types";

type Density = "compact" | "comfortable";

export function Sessions() {
  const events = useAppStore((state) => state.events);
  const range = useAppStore((state) => state.range);
  const query = useAppStore((state) => state.query);
  const selectedSource = useAppStore((state) => state.selectedSource);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const setSelectedSource = useAppStore((state) => state.setSelectedSource);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);
  const [dateRange, setDateRange] = useState<TimeRangeId>(range);
  const [density, setDensity] = useState<Density>("comfortable");

  const sources = useMemo(() => Array.from(new Set(events.map((event) => event.source))).sort(), [events]);
  const models = useMemo(() => Array.from(new Set(events.map((event) => event.model))).sort(), [events]);
  const filtered = useMemo(() => {
    const scoped = filterEventsForRange(events, dateRange);
    const q = query.toLowerCase();
    return scoped.filter((event) => {
      const matchesQuery =
        !q ||
        [event.model, event.source, event.project_name, event.session_id].some((value) =>
          (value ?? "").toLowerCase().includes(q),
        );
      const matchesSource = selectedSource === "all" || event.source === selectedSource;
      const matchesModel = selectedModel === "all" || event.model === selectedModel;
      return matchesQuery && matchesSource && matchesModel;
    });
  }, [dateRange, events, query, selectedModel, selectedSource]);

  const cellDensity = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-semibold">Sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Search and filter individual usage events.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onChange={(event) => setDateRange(event.target.value as TimeRangeId)}>
            <option value="today">Today</option>
            <option value="3d">Last 3 days</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
          <Select value={selectedSource ?? "all"} onChange={(event) => setSelectedSource(event.target.value as typeof selectedSource)}>
            <option value="all">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {toTitle(source)}
              </option>
            ))}
          </Select>
          <Select value={selectedModel ?? "all"} onChange={(event) => setSelectedModel(event.target.value)}>
            <option value="all">All models</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </Select>
          <div className="flex rounded-md border border-border bg-background p-0.5">
            <Button size="sm" variant={density === "compact" ? "primary" : "ghost"} onClick={() => setDensity("compact")}>
              Compact
            </Button>
            <Button size="sm" variant={density === "comfortable" ? "primary" : "ghost"} onClick={() => setDensity("comfortable")}>
              Comfortable
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usage Events</CardTitle>
          <Badge>{filtered.length.toLocaleString()} rows</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length ? (
            <div className="max-h-[64vh] overflow-auto">
              <Table>
                <thead>
                  <tr>
                    <Th className="sticky top-0 z-10 bg-panel">Timestamp</Th>
                    <Th className="sticky top-0 z-10 bg-panel">Source</Th>
                    <Th className="sticky top-0 z-10 bg-panel">Model</Th>
                    <Th className="sticky top-0 z-10 bg-panel">Project</Th>
                    <Th className="sticky top-0 z-10 bg-panel">Session</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">Input</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">Output</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">Cached</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">Reasoning</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">Total</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">Cost</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id} className="transition hover:bg-muted/30">
                      <Td className={cellDensity}>{formatDateTime(event.timestamp)}</Td>
                      <Td className={cellDensity}>
                        <div className="font-medium">{toTitle(event.source)}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <SourceMetaBadge kind="sourceType" value={event.source_type} />
                          <SourceMetaBadge kind="accuracy" value={event.accuracy} />
                        </div>
                      </Td>
                      <Td className={cellDensity}>{event.model}</Td>
                      <Td className={cellDensity}>{event.project_name ?? "Unknown"}</Td>
                      <Td className={`max-w-48 truncate font-mono text-xs text-muted-foreground ${cellDensity}`}>
                        {event.session_id ?? event.id}
                      </Td>
                      <Td className={`text-right font-mono tabular-nums ${cellDensity}`}>{formatLongTokens(event.input_tokens)}</Td>
                      <Td className={`text-right font-mono tabular-nums ${cellDensity}`}>{formatLongTokens(event.output_tokens)}</Td>
                      <Td className={`text-right font-mono tabular-nums ${cellDensity}`}>
                        {formatLongTokens(event.cache_read_tokens + event.cache_write_tokens)}
                      </Td>
                      <Td className={`text-right font-mono tabular-nums ${cellDensity}`}>{formatLongTokens(event.reasoning_tokens)}</Td>
                      <Td className={`text-right font-mono tabular-nums ${cellDensity}`}>{formatLongTokens(event.total_tokens)}</Td>
                      <Td className={`text-right font-mono tabular-nums ${cellDensity}`}>{formatCurrency(event.estimated_cost_usd)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No sessions match these filters"
                body="Try widening the date range, clearing search, or choosing all sources and models."
                action={
                  <Button
                    onClick={() => {
                      setDateRange("30d");
                      setSelectedSource("all");
                      setSelectedModel("all");
                    }}
                  >
                    Reset filters
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
