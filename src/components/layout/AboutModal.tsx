import { useState } from "react";
import { Github, Info, ShieldCheck, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";
import { normalizeLanguage } from "../../lib/i18n";
import { useAppStore } from "../../store/useAppStore";

const supportedSources = [
  "Codex CLI",
  "Claude Code",
  "Manual CSV",
  "Demo data",
  "OpenAI API config",
  "Anthropic API config",
];

export function AboutModal() {
  const [open, setOpen] = useState(false);
  const language = normalizeLanguage(useAppStore((state) => state.settings?.language));
  const isZh = language === "zh";

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title={isZh ? "关于 TokenScope" : "About TokenScope"}
        aria-label="About TokenScope"
        onClick={() => setOpen(true)}
      >
        <Info className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/72 p-4 backdrop-blur-md">
          <Card className="w-full max-w-2xl overflow-hidden shadow-glow">
            <CardContent className="p-0">
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{isZh ? "关于 TokenScope" : "About TokenScope"}</h2>
                    <Badge tone="cyan">Version 0.1.0</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isZh ? "面向 AI 编程工具的本地优先 token 分析。" : "Local-first token analytics for AI coding tools."}
                  </p>
                </div>
                <Button variant="ghost" size="icon" title={isZh ? "关闭" : "Close"} onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    {isZh ? "数据隐私声明" : "Data privacy statement"}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {isZh
                      ? "TokenScope 默认不存储 prompt 或 response 内容。它只在本地保存 token 元数据、时间戳、模型、来源名称和安全会话引用。"
                      : "TokenScope does not store prompt or response content by default. It keeps token metadata, timestamps, models, source names, and safe session references locally."}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-sm font-medium">{isZh ? "开源信息" : "Open source"}</div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div>MIT License</div>
                    <a className="inline-flex items-center gap-2 text-accent hover:underline" href="https://github.com/YfengJ/Tokenscope/releases" target="_blank" rel="noreferrer">
                      <Github className="h-4 w-4" />
                      GitHub Releases
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                  <div className="text-sm font-medium">{isZh ? "支持的数据源" : "Supported sources"}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {supportedSources.map((source) => (
                      <Badge key={source}>{source}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
