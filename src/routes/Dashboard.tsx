import { ArrowDownRight, ArrowUpRight, Boxes, Clock3, ShieldCheck } from "lucide-react";
import { buildDashboardSummary, getDailyTrend } from "../lib/analytics";
import { formatCurrency, formatLongTokens, formatPercentChange, formatTokens, toTitle } from "../lib/format";
import { useAppStore } from "../store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { TokenTrendChart } from "../components/charts/TokenTrendChart";
import { SourceDonutChart } from "../components/charts/SourceDonutChart";
import { ModelBarChart } from "../components/charts/ModelBarChart";
import { Table, Td, Th } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { FirstRunGuide } from "../components/onboarding/FirstRunGuide";
import { SparklineChart } from "../components/charts/SparklineChart";
import type { TimeRangeId } from "../lib/types";
import { normalizeLanguage } from "../lib/i18n";

const cardRanges: Array<{ label: string; range: TimeRangeId }> = [
  { label: "Today", range: "today" },
  { label: "3 Days", range: "3d" },
  { label: "7 Days", range: "7d" },
  { label: "30 Days", range: "30d" },
];

const zhCardLabels: Record<TimeRangeId, string> = {
  today: "今天",
  "3d": "3 天",
  "7d": "7 天",
  "30d": "30 天",
  custom: "自定义",
};

export function Dashboard() {
  const events = useAppStore((state) => state.events);
  const range = useAppStore((state) => state.range);
  const settings = useAppStore((state) => state.settings);
  const toggleDemoData = useAppStore((state) => state.toggleDemoData);
  const summary = buildDashboardSummary(events, range);
  const sourceCount = new Set(events.map((event) => event.source)).size;
  const sessionCount = new Set(events.map((event) => event.session_id ?? event.id)).size;
  const isZh = normalizeLanguage(settings?.language) === "zh";
  const hasDemoEvents = events.some((event) => event.source === "demo" || event.source_type === "demo");
  const hasRealEvents = events.some((event) => event.source !== "demo" && event.source_type !== "demo");

  if (!events.length) {
    return <FirstRunGuide onEnableDemo={() => void toggleDemoData(true)} />;
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-border bg-panel">
        <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_24rem] md:p-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Badge tone="cyan">{isZh ? "本地优先分析" : "Local-first analytics"}</Badge>
              {settings?.demo_data_enabled || hasDemoEvents ? <Badge>{isZh ? "演示数据" : "Demo data"}</Badge> : null}
              {hasRealEvents ? <Badge>{isZh ? "真实/扫描数据" : "Scanned or imported data"}</Badge> : null}
            </div>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
              {isZh ? "查看每个 AI 编程工具的 token 使用情况。" : "Your AI token usage, across every coding tool."}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {isZh
                ? "监控近期 token 数、模型分布、来源组合、会话和预估费用，同时默认不存储 prompt 或 response 内容。"
                : "Monitor recent token volume, model distribution, source mix, sessions, and estimated cost without storing prompt or response content."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Boxes className="h-3.5 w-3.5 text-accent" />
                {isZh ? "已索引来源" : "Sources indexed"}
              </div>
              <div className="mt-2 font-mono text-xl font-semibold">{sourceCount}</div>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 text-accent" />
                {isZh ? "已跟踪会话" : "Sessions tracked"}
              </div>
              <div className="mt-2 font-mono text-xl font-semibold">{sessionCount.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-border bg-background/80 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                {isZh ? "Prompt 存储" : "Prompt storage"}
              </div>
              <div className="mt-2 text-sm font-medium">{isZh ? "默认关闭" : "Off by default"}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.cards.map((card, index) => {
          const display = cardRanges[index] ?? { label: card.label, range: "7d" as TimeRangeId };
          const positive = card.comparison_delta >= 0;
          const Icon = positive ? ArrowUpRight : ArrowDownRight;
          const sparkline = getDailyTrend(events, display.range);
          return (
            <Card key={display.label} className="transition hover:border-accent/40 hover:bg-panel/90">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {isZh ? zhCardLabels[display.range] : display.label}
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold tracking-normal tabular-nums">
                      {formatTokens(card.total_tokens)}
                    </p>
                  </div>
                  <Badge tone={positive ? "green" : "amber"}>
                    <Icon className="mr-1 h-3 w-3" />
                    {formatPercentChange(card.comparison_delta)}
                  </Badge>
                </div>
                <div className="mt-3">
                  <SparklineChart data={sparkline} positive={positive} />
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  {isZh ? "与上一周期相比" : "Compared with previous period"}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">{isZh ? "费用" : "Cost"}</div>
                    <div className="mt-1 font-mono tabular-nums">{formatCurrency(card.estimated_cost_usd)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{isZh ? "输入" : "Input"}</div>
                    <div className="mt-1 font-mono tabular-nums">{formatTokens(card.input_tokens)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{isZh ? "输出" : "Output"}</div>
                    <div className="mt-1 font-mono tabular-nums">{formatTokens(card.output_tokens)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{isZh ? "每日 Token 趋势" : "Daily Token Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TokenTrendChart data={summary.daily_trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isZh ? "来源分布" : "Source Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceDonutChart data={summary.tokens_by_source} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{isZh ? "模型用量" : "Model Usage"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ModelBarChart data={summary.tokens_by_model} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isZh ? "高费用会话" : "Top Expensive Sessions"}</CardTitle>
            {settings?.hide_project_names ? <Badge>{isZh ? "项目已隐藏" : "Projects hidden"}</Badge> : null}
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead>
                <tr>
                  <Th>{isZh ? "会话" : "Session"}</Th>
                  <Th>{isZh ? "来源" : "Source"}</Th>
                  <Th>{isZh ? "模型" : "Model"}</Th>
                  <Th className="text-right">{isZh ? "Tokens" : "Tokens"}</Th>
                  <Th className="text-right">{isZh ? "费用" : "Cost"}</Th>
                </tr>
              </thead>
              <tbody>
                {summary.top_expensive_sessions.map((session) => (
                  <tr key={session.session_id} className="transition hover:bg-muted/30">
                    <Td>
                      <div className="font-medium">
                        {settings?.hide_project_names ? (isZh ? "私有项目" : "Private project") : session.project_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{session.session_id}</div>
                    </Td>
                    <Td>{toTitle(session.source)}</Td>
                    <Td>{session.model}</Td>
                    <Td className="text-right font-mono tabular-nums">{formatLongTokens(session.total_tokens)}</Td>
                    <Td className="text-right font-mono tabular-nums">{formatCurrency(session.estimated_cost_usd)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
          <CardTitle>{isZh ? "Token 峰值" : "Token Spikes"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {summary.spikes.map((spike) => (
              <div key={`${spike.date}-${spike.source}`} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{spike.date}</div>
                  <Badge tone="amber">+{formatTokens(spike.delta_vs_previous_day)}</Badge>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {toTitle(spike.source)} · {spike.model}
                </div>
                <div className="mt-2 font-mono text-lg">{formatLongTokens(spike.total_tokens)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
