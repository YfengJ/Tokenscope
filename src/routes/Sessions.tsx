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
import { normalizeLanguage } from "../lib/i18n";

type Density = "compact" | "comfortable";

export function Sessions() {
  const events = useAppStore((state) => state.events);
  const range = useAppStore((state) => state.range);
  const query = useAppStore((state) => state.query);
  const selectedSource = useAppStore((state) => state.selectedSource);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const setSelectedSource = useAppStore((state) => state.setSelectedSource);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);
  const settings = useAppStore((state) => state.settings);
  const [dateRange, setDateRange] = useState<TimeRangeId>(range);
  const [density, setDensity] = useState<Density>("comfortable");
  const language = normalizeLanguage(settings?.language);
  const isZh = language === "zh";

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
          <h2 className="text-xl font-semibold">{isZh ? "会话" : "Sessions"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isZh ? "搜索和筛选单条 usage 事件。" : "Search and filter individual usage events."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onChange={(event) => setDateRange(event.target.value as TimeRangeId)}>
            <option value="today">{isZh ? "今天" : "Today"}</option>
            <option value="3d">{isZh ? "最近 3 天" : "Last 3 days"}</option>
            <option value="7d">{isZh ? "最近 7 天" : "Last 7 days"}</option>
            <option value="30d">{isZh ? "最近 30 天" : "Last 30 days"}</option>
          </Select>
          <Select value={selectedSource ?? "all"} onChange={(event) => setSelectedSource(event.target.value as typeof selectedSource)}>
            <option value="all">{isZh ? "全部来源" : "All sources"}</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {toTitle(source)}
              </option>
            ))}
          </Select>
          <Select value={selectedModel ?? "all"} onChange={(event) => setSelectedModel(event.target.value)}>
            <option value="all">{isZh ? "全部模型" : "All models"}</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </Select>
          <div className="flex rounded-md border border-border bg-background p-0.5">
            <Button size="sm" variant={density === "compact" ? "primary" : "ghost"} onClick={() => setDensity("compact")}>
              {isZh ? "紧凑" : "Compact"}
            </Button>
            <Button size="sm" variant={density === "comfortable" ? "primary" : "ghost"} onClick={() => setDensity("comfortable")}>
              {isZh ? "舒适" : "Comfortable"}
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isZh ? "Usage 事件" : "Usage Events"}</CardTitle>
          <Badge>{filtered.length.toLocaleString()} {isZh ? "行" : "rows"}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length ? (
            <div className="max-h-[64vh] overflow-auto">
              <Table>
                <thead>
                  <tr>
                    <Th className="sticky top-0 z-10 bg-panel">{isZh ? "时间" : "Timestamp"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel">{isZh ? "来源" : "Source"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel">{isZh ? "模型" : "Model"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel">{isZh ? "项目" : "Project"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel">{isZh ? "会话" : "Session"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">{isZh ? "输入" : "Input"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">{isZh ? "输出" : "Output"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">{isZh ? "缓存" : "Cached"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">{isZh ? "推理" : "Reasoning"}</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">Total</Th>
                    <Th className="sticky top-0 z-10 bg-panel text-right">{isZh ? "费用" : "Cost"}</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr key={event.id} className="transition hover:bg-muted/30">
                      <Td className={cellDensity}>{formatDateTime(event.timestamp)}</Td>
                      <Td className={cellDensity}>
                        <div className="font-medium">{toTitle(event.source)}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <SourceMetaBadge kind="sourceType" value={event.source_type} language={language} />
                          <SourceMetaBadge kind="accuracy" value={event.accuracy} language={language} />
                        </div>
                      </Td>
                      <Td className={cellDensity}>{event.model}</Td>
                      <Td className={cellDensity}>{event.project_name ?? (isZh ? "未知" : "Unknown")}</Td>
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
                title={isZh ? "没有匹配这些筛选条件的会话" : "No sessions match these filters"}
                body={isZh ? "试着扩大日期范围、清空搜索，或选择全部来源和模型。" : "Try widening the date range, clearing search, or choosing all sources and models."}
                action={
                  <Button
                    onClick={() => {
                      setDateRange("30d");
                      setSelectedSource("all");
                      setSelectedModel("all");
                    }}
                  >
                    {isZh ? "重置筛选" : "Reset filters"}
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
