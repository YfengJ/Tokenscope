import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Database, FileUp, PlugZap, Settings, Terminal, X } from "lucide-react";
import { importCsv, previewCsv, scanClaude, scanCodex } from "../lib/api";
import { formatCurrency, formatDateTime, formatLongTokens, toTitle } from "../lib/format";
import { useAppStore } from "../store/useAppStore";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { SourceMetaBadge } from "../components/ui/SourceMetaBadge";
import { SourceStatusBadge } from "../components/ui/SourceStatusBadge";
import { Table, Td, Th } from "../components/ui/Table";
import type { SourceStatus, UsageEvent } from "../lib/types";
import { normalizeLanguage } from "../lib/i18n";

function SourceIcon({ source }: { source: SourceStatus["source"] }) {
  if (source === "codex" || source === "claude_code" || source === "gemini_cli") return <Terminal className="h-5 w-5" />;
  if (source === "manual_import") return <FileUp className="h-5 w-5" />;
  if (source === "demo") return <Database className="h-5 w-5" />;
  return <PlugZap className="h-5 w-5" />;
}

export function Sources() {
  const statuses = useAppStore((state) => state.sourceStatuses);
  const settings = useAppStore((state) => state.settings);
  const reloadEvents = useAppStore((state) => state.reloadEvents);
  const [csvPreview, setCsvPreview] = useState<{ path: string; rows: UsageEvent[] } | null>(null);
  const language = normalizeLanguage(settings?.language);
  const isZh = language === "zh";

  function actionLabel(action: SourceStatus["action"]) {
    if (!isZh) return action;
    if (action === "Configure") return "配置";
    if (action === "Scan") return "扫描";
    if (action === "Import") return "导入";
    return "即将推出";
  }

  function sourceDescription(source: SourceStatus) {
    if (!isZh) return source.description;
    const descriptions: Partial<Record<SourceStatus["source"], string>> = {
      codex: "扫描本地 JSONL 会话，不导入 prompt 内容。",
      claude_code: "解析 Claude Code message usage metadata，并按 message id 去重。",
      openai_api: "0.1.0 只有配置界面；真实网络同步尚未实现。",
      anthropic_api: "0.1.0 只有配置界面；真实网络同步尚未实现。",
      openrouter: "连接器接口预留给后续版本。",
      litellm: "Proxy 日志摄取计划在本地解析器稳定后加入。",
      cursor: "遥测可用性取决于本地导出支持。",
      copilot: "预留给未来的官方或本地遥测路径。",
      gemini_cli: "首个 MVP 尚未包含本地解析器。",
      manual_import: "从通用 CSV 文件导入 metadata 列。",
      demo: "用于首次体验的确定性本地样本数据。",
    };
    return descriptions[source.source] ?? source.description;
  }

  async function chooseCsvPath() {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (Array.isArray(selected)) return selected[0] ?? null;
      return selected;
    } catch {
      return window.prompt(isZh ? "CSV 文件路径" : "CSV file path");
    }
  }

  async function runAction(source: SourceStatus) {
    if (source.source === "codex") await scanCodex(settings?.codex_home_path);
    if (source.source === "claude_code") await scanClaude(settings?.claude_home_path);
    if (source.source === "manual_import") {
      const path = await chooseCsvPath();
      if (!path) return;
      const rows = await previewCsv(path);
      setCsvPreview({ path, rows });
      return;
    }
    await reloadEvents();
  }

  async function confirmCsvImport() {
    if (!csvPreview) return;
    await importCsv(csvPreview.path);
    setCsvPreview(null);
    await reloadEvents();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{isZh ? "数据源" : "Sources"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isZh
            ? "查看连接器状态、同步时间、来源类型和解析准确性。"
            : "Connector readiness, sync freshness, source type, and parser accuracy."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statuses.map((source) => (
          <Card key={source.source}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-accent">
                    <SourceIcon source={source.source} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{source.label}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{sourceDescription(source)}</p>
                  </div>
                </div>
                <SourceStatusBadge status={source.status} language={language} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">{isZh ? "类型" : "Type"}</div>
                  <div className="mt-1">
                    <SourceMetaBadge kind="sourceType" value={source.source_type} language={language} />
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">{isZh ? "准确性" : "Accuracy"}</div>
                  <div className="mt-1">
                    <SourceMetaBadge kind="accuracy" value={source.accuracy} language={language} />
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">{isZh ? "最近同步" : "Last sync"}</div>
                  <div className="mt-1">{formatDateTime(source.last_sync)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">{isZh ? "事件数" : "Events"}</div>
                  <div className="mt-1 font-mono">{source.event_count.toLocaleString()}</div>
                </div>
              </div>

              <Button
                className="mt-5 w-full"
                variant={source.action === "Coming soon" ? "ghost" : "secondary"}
                disabled={source.action === "Coming soon"}
                onClick={() => void runAction(source)}
              >
                {source.action === "Configure" ? <Settings className="h-4 w-4" /> : null}
                {actionLabel(source.action)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {csvPreview ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <Card className="max-h-[82vh] w-full max-w-5xl overflow-hidden shadow-glow">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{isZh ? "CSV 预览" : "CSV Preview"}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{csvPreview.path}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCsvPreview(null)} title={isZh ? "关闭预览" : "Close preview"}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-[52vh] overflow-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>{isZh ? "时间" : "Timestamp"}</Th>
                      <Th>{isZh ? "来源" : "Source"}</Th>
                      <Th>{isZh ? "模型" : "Model"}</Th>
                      <Th>{isZh ? "会话" : "Session"}</Th>
                      <Th className="text-right">Total</Th>
                      <Th className="text-right">{isZh ? "费用" : "Cost"}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.map((row) => (
                      <tr key={row.id}>
                        <Td>{formatDateTime(row.timestamp)}</Td>
                        <Td>{toTitle(row.source)}</Td>
                        <Td>{row.model}</Td>
                        <Td className="max-w-56 truncate font-mono text-xs text-muted-foreground">
                          {row.session_id ?? row.id}
                        </Td>
                        <Td className="text-right font-mono">{formatLongTokens(row.total_tokens)}</Td>
                        <Td className="text-right font-mono">{formatCurrency(row.estimated_cost_usd)}</Td>
                      </tr>
                    ))}
                    {!csvPreview.rows.length ? (
                      <tr>
                        <Td colSpan={6} className="py-10 text-center text-muted-foreground">
                          {isZh ? "没有找到可导入的 usage 行。" : "No importable usage rows found."}
                        </Td>
                      </tr>
                    ) : null}
                  </tbody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <Button variant="ghost" onClick={() => setCsvPreview(null)}>
                  {isZh ? "取消" : "Cancel"}
                </Button>
                <Button variant="primary" disabled={!csvPreview.rows.length} onClick={() => void confirmCsvImport()}>
                  {isZh ? `导入 ${csvPreview.rows.length} 行预览数据` : `Import ${csvPreview.rows.length} previewed rows`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
