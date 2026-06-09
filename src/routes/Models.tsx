import { useMemo, useState } from "react";
import { getModelStats } from "../lib/analytics";
import { formatCurrency, formatDateTime, formatLongTokens } from "../lib/format";
import { useAppStore } from "../store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Table, Td, Th } from "../components/ui/Table";
import { Button } from "../components/ui/Button";
import { filterEventsForRange } from "../lib/analytics";

type SortKey = "tokens" | "cost";

export function Models() {
  const events = useAppStore((state) => state.events);
  const range = useAppStore((state) => state.range);
  const [sort, setSort] = useState<SortKey>("tokens");

  const stats = useMemo(() => {
    const modelStats = getModelStats(filterEventsForRange(events, range));
    return [...modelStats].sort((a, b) =>
      sort === "tokens" ? b.total_tokens - a.total_tokens : b.estimated_cost_usd - a.estimated_cost_usd,
    );
  }, [events, range, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-semibold">Models</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Model-level token mix, cached usage, reasoning tokens, and estimated spend.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={sort === "tokens" ? "primary" : "secondary"} onClick={() => setSort("tokens")}>
            Sort by tokens
          </Button>
          <Button variant={sort === "cost" ? "primary" : "secondary"} onClick={() => setSort("cost")}>
            Sort by cost
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Usage</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr>
                <Th>Model</Th>
                <Th>Provider</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Input</Th>
                <Th className="text-right">Output</Th>
                <Th className="text-right">Cached</Th>
                <Th className="text-right">Reasoning</Th>
                <Th className="text-right">Cost</Th>
                <Th className="text-right">Sessions</Th>
                <Th>Last used</Th>
              </tr>
            </thead>
            <tbody>
              {stats.map((model) => (
                <tr key={model.model}>
                  <Td className="font-medium">{model.model}</Td>
                  <Td>{model.provider ?? "Unknown"}</Td>
                  <Td className="text-right font-mono">{formatLongTokens(model.total_tokens)}</Td>
                  <Td className="text-right font-mono">{formatLongTokens(model.input_tokens)}</Td>
                  <Td className="text-right font-mono">{formatLongTokens(model.output_tokens)}</Td>
                  <Td className="text-right font-mono">{formatLongTokens(model.cached_tokens)}</Td>
                  <Td className="text-right font-mono">{formatLongTokens(model.reasoning_tokens)}</Td>
                  <Td className="text-right font-mono">{formatCurrency(model.estimated_cost_usd)}</Td>
                  <Td className="text-right font-mono">{model.sessions_count}</Td>
                  <Td>{formatDateTime(model.last_used)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
