import { FileUp, FolderSearch, PlayCircle, Terminal } from "lucide-react";
import { Button } from "../ui/Button";
import { normalizeLanguage } from "../../lib/i18n";
import { useAppStore } from "../../store/useAppStore";

interface FirstRunGuideProps {
  onEnableDemo: () => void;
}

const enActions = [
  {
    label: "Enable demo data",
    body: "Load deterministic sample usage so every chart and table is populated immediately.",
    cta: "Enable",
    icon: PlayCircle,
  },
  {
    label: "Scan Codex logs",
    body: "Read local JSONL usage metadata from your Codex home directory.",
    cta: "Open Sources",
    icon: Terminal,
  },
  {
    label: "Scan Claude Code logs",
    body: "Parse Claude Code message usage metadata and deduplicate message ids.",
    cta: "Open Sources",
    icon: FolderSearch,
  },
  {
    label: "Import CSV",
    body: "Preview and import a generic token usage CSV with safe metadata columns.",
    cta: "Open Sources",
    icon: FileUp,
  },
];

const zhActions = [
  {
    label: "启用演示数据",
    body: "加载确定性的样本用量，方便检查图表和表格；它不会冒充真实来源。",
    cta: "启用",
    icon: PlayCircle,
  },
  {
    label: "扫描 Codex 日志",
    body: "从你的 Codex home 目录读取本地 JSONL usage metadata。",
    cta: "打开数据源",
    icon: Terminal,
  },
  {
    label: "扫描 Claude Code 日志",
    body: "解析 Claude Code message usage metadata，并按 message id 去重。",
    cta: "打开数据源",
    icon: FolderSearch,
  },
  {
    label: "导入 CSV",
    body: "预览并导入只包含安全 metadata 列的通用 token usage CSV。",
    cta: "打开数据源",
    icon: FileUp,
  },
];

export function FirstRunGuide({ onEnableDemo }: FirstRunGuideProps) {
  const isZh = normalizeLanguage(useAppStore((state) => state.settings?.language)) === "zh";
  const actions = isZh ? zhActions : enActions;

  return (
    <div className="rounded-lg border border-border bg-panel p-6">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold">{isZh ? "开始跟踪真实 token 使用" : "Start tracking token usage"}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isZh
            ? "TokenScope 只存储 usage metadata。默认不会导入或显示 prompt 与 response 内容。"
            : "TokenScope only stores usage metadata. Prompt and response content are never imported or displayed by default."}
        </p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={action.label}
              className="flex min-h-48 flex-col justify-between rounded-lg border border-border bg-background p-4 transition hover:border-accent/50 hover:bg-muted/30"
            >
              <div>
                <Icon className="h-5 w-5 text-accent" />
                <div className="mt-4 text-sm font-medium">{action.label}</div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{action.body}</p>
              </div>
              <Button
                className="mt-4 w-full"
                variant={index === 0 ? "primary" : "secondary"}
                onClick={index === 0 ? onEnableDemo : () => {
                  window.location.hash = "sources";
                }}
              >
                {action.cta}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
