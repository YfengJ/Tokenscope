import { useMemo } from "react";
import { filterEventsForRange, getDailyTrend } from "../lib/analytics";
import { formatCurrency, formatDateTime, formatLongTokens, toTitle } from "../lib/format";
import { useAppStore } from "../store/useAppStore";
import { CalendarHeatmap } from "../components/charts/CalendarHeatmap";
import { TokenTrendChart } from "../components/charts/TokenTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Table, Td, Th } from "../components/ui/Table";

export function Timeline() {
  const events = useAppStore((state) => state.events);
  const selectedDate = useAppStore((state) => state.selectedDate);
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);
  const trend = useMemo(() => getDailyTrend(events, "30d"), [events]);
  const scoped = useMemo(() => {
    const last30 = filterEventsForRange(events, "30d");
    return selectedDate ? last30.filter((event) => event.timestamp.startsWith(selectedDate)) : last30;
  }, [events, selectedDate]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Timeline</h2>
        <p className="mt-1 text-sm text-muted-foreground">Daily density, recent trend, and date-filtered sessions.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap data={trend} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <TokenTrendChart data={trend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDate ? `Sessions on ${selectedDate}` : "Recent Sessions"}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Source</Th>
                <Th>Model</Th>
                <Th>Project</Th>
                <Th className="text-right">Tokens</Th>
                <Th className="text-right">Cost</Th>
              </tr>
            </thead>
            <tbody>
              {scoped.slice(0, 80).map((event) => (
                <tr key={event.id}>
                  <Td>{formatDateTime(event.timestamp)}</Td>
                  <Td>{toTitle(event.source)}</Td>
                  <Td>{event.model}</Td>
                  <Td>{event.project_name ?? "Unknown"}</Td>
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
