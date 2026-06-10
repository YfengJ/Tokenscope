import { useMemo } from "react";
import { filterEventsForRange, getDailyTrend } from "../lib/analytics";
import { formatCurrency, formatDateTime, formatLongTokens, toTitle } from "../lib/format";
import { useAppStore } from "../store/useAppStore";
import { CalendarHeatmap } from "../components/charts/CalendarHeatmap";
import { TokenTrendChart } from "../components/charts/TokenTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Table, Td, Th } from "../components/ui/Table";
import { normalizeLanguage } from "../lib/i18n";

export function Timeline() {
  const events = useAppStore((state) => state.events);
  const settings = useAppStore((state) => state.settings);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);
  const isZh = normalizeLanguage(settings?.language) === "zh";
  const trend = useMemo(() => getDailyTrend(events, "30d"), [events]);
  const scoped = useMemo(() => {
    const last30 = filterEventsForRange(events, "30d");
    return selectedDate ? last30.filter((event) => event.timestamp.startsWith(selectedDate)) : last30;
  }, [events, selectedDate]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{isZh ? "时间线" : "Timeline"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isZh ? "每日密度、近期趋势和按日期筛选的会话。" : "Daily density, recent trend, and date-filtered sessions."}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{isZh ? "日历热力图" : "Calendar Heatmap"}</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap data={trend} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isZh ? "最近 30 天" : "Last 30 Days"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TokenTrendChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDate ? (isZh ? `${selectedDate} 的会话` : `Sessions on ${selectedDate}`) : isZh ? "最近会话" : "Recent Sessions"}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <Th>{isZh ? "时间" : "Time"}</Th>
                <Th>{isZh ? "来源" : "Source"}</Th>
                <Th>{isZh ? "模型" : "Model"}</Th>
                <Th>{isZh ? "项目" : "Project"}</Th>
                <Th className="text-right">Tokens</Th>
                <Th className="text-right">{isZh ? "费用" : "Cost"}</Th>
              </tr>
            </thead>
            <tbody>
              {scoped.slice(0, 80).map((event) => (
                <tr key={event.id}>
                  <Td>{formatDateTime(event.timestamp)}</Td>
                  <Td>{toTitle(event.source)}</Td>
                  <Td>{event.model}</Td>
                  <Td>{event.project_name ?? (isZh ? "未知" : "Unknown")}</Td>
                  <Td className="text-right font-mono">{formatLongTokens(event.total_tokens)}</Td>
                  <Td className="text-right font-mono">{formatCurrency(event.estimated_cost_usd)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
