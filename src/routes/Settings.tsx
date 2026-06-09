import { useEffect, useState } from "react";
import { Code2, Database, KeyRound, Languages, Lock, Monitor, Save, ShieldCheck } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { AppSettings } from "../lib/types";
import { languageLabels, normalizeLanguage, type Language } from "../lib/i18n";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Switch } from "../components/ui/Switch";
import { Badge } from "../components/ui/Badge";

function SettingRow({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
      <div className="max-w-xl">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">{body}</div>
      </div>
      <div className="w-full md:w-80">{children}</div>
    </div>
  );
}

function SettingsSection({
  title,
  body,
  icon: Icon,
  children,
}: {
  title: string;
  body: string;
  icon: typeof Database;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-accent">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-0">{children}</CardContent>
    </Card>
  );
}

export function Settings() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [draft, setDraft] = useState<AppSettings | null>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  if (!draft) return null;
  const language = normalizeLanguage(draft.language);
  const isZh = language === "zh";

  function patch(next: Partial<AppSettings>) {
    setDraft((current) => (current ? { ...current, ...next } : current));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-semibold">{isZh ? "设置" : "Settings"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isZh ? "本地路径、隐私控制和连接器配置。" : "Local paths, privacy controls, and connector configuration."}
          </p>
        </div>
        <Button variant="primary" onClick={() => void updateSettings(draft)}>
          <Save className="h-4 w-4" />
          {isZh ? "保存" : "Save"}
        </Button>
      </div>

      <SettingsSection title={isZh ? "数据" : "Data"} body={isZh ? "本地数据库位置和演示数据控制。" : "Local database location and demo data controls."} icon={Database}>
          <SettingRow title={isZh ? "数据目录" : "Data directory"} body={isZh ? "SQLite 数据库和应用元数据保存在这里。" : "SQLite database and app metadata live here."}>
            <Input value={draft.data_dir} onChange={(event) => patch({ data_dir: event.target.value })} />
          </SettingRow>
          <SettingRow title={isZh ? "启用演示数据" : "Enable demo data"} body={isZh ? "仅在你主动启用时加载确定性的样本事件。" : "Load deterministic sample events only when you explicitly enable them."}>
            <div className="flex justify-end">
              <Switch checked={draft.demo_data_enabled} onCheckedChange={(value) => patch({ demo_data_enabled: value })} label={isZh ? "启用演示数据" : "Enable demo data"} />
            </div>
          </SettingRow>
      </SettingsSection>

      <SettingsSection title={isZh ? "数据源" : "Sources"} body={isZh ? "本地日志路径和供应商配置占位。" : "Local log paths and provider configuration stubs."} icon={KeyRound}>
          <SettingRow title="Codex home path" body={isZh ? "macOS/Linux 默认是 ~/.codex，Windows 默认是 %USERPROFILE%\\.codex。" : "Default is ~/.codex on macOS/Linux and %USERPROFILE%\\.codex on Windows."}>
            <Input value={draft.codex_home_path} onChange={(event) => patch({ codex_home_path: event.target.value })} />
          </SettingRow>
          <SettingRow title="Claude home path" body={isZh ? "macOS/Linux 默认是 ~/.claude，Windows 默认是 %USERPROFILE%\\.claude。" : "Default is ~/.claude on macOS/Linux and %USERPROFILE%\\.claude on Windows."}>
            <Input value={draft.claude_home_path} onChange={(event) => patch({ claude_home_path: event.target.value })} />
          </SettingRow>
          <SettingRow title="OpenAI API" body={isZh ? "0.1.0 只有配置界面；真实网络同步尚未实现。" : "Configuration UI is present; real network sync is mocked in this MVP."}>
            <div className="flex items-center gap-2">
              <Input type="password" placeholder="sk-... secure storage later" disabled />
              <Badge>{draft.openai_configured ? "Configured" : "Mock"}</Badge>
            </div>
          </SettingRow>
          <SettingRow title="Anthropic API" body={isZh ? "0.1.0 只有配置界面；真实网络同步尚未实现。" : "Configuration UI is present; real network sync is mocked in this MVP."}>
            <div className="flex items-center gap-2">
              <Input type="password" placeholder="sk-ant-... secure storage later" disabled />
              <Badge>{draft.anthropic_configured ? "Configured" : "Mock"}</Badge>
            </div>
          </SettingRow>
      </SettingsSection>

      <SettingsSection title={isZh ? "隐私" : "Privacy"} body={isZh ? "项目可见性和原始引用存储控制。" : "Controls for project visibility and raw reference storage."} icon={ShieldCheck}>
          <div className="border-b border-border py-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-accent" />
              {isZh ? "TokenScope 默认不存储 prompt 或 response 内容。" : "TokenScope does not store prompt or response content by default."}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {isZh
                ? "解析器只保留 token 元数据、模型、来源、时间戳、项目/会话 ID 和安全引用。"
                : "Parsers are designed to keep token metadata, model, source, timestamp, project/session ids, and safe references only."}
            </p>
          </div>
          <SettingRow title={isZh ? "隐藏项目名称" : "Hide project names"} body={isZh ? "在 UI 表格和会话摘要中隐藏项目标签。" : "Mask project labels in UI tables and session summaries."}>
            <div className="flex justify-end">
              <Switch checked={draft.hide_project_names} onCheckedChange={(value) => patch({ hide_project_names: value })} label={isZh ? "隐藏项目名称" : "Hide project names"} />
            </div>
          </SettingRow>
          <SettingRow title={isZh ? "保存原始引用" : "Save raw references"} body={isZh ? "启用后仅保存文件/消息引用；prompt 内容仍会排除。" : "Store file/message references only when enabled; prompt content remains excluded."}>
            <div className="flex justify-end">
              <Switch checked={draft.save_raw_references} onCheckedChange={(value) => patch({ save_raw_references: value })} label={isZh ? "保存原始引用" : "Save raw references"} />
            </div>
          </SettingRow>
      </SettingsSection>

      <SettingsSection title={isZh ? "外观" : "Appearance"} body={isZh ? "桌面工作区显示偏好。" : "Display preferences for the desktop workspace."} icon={Monitor}>
          <SettingRow title={isZh ? "界面语言" : "Interface language"} body={isZh ? "切换应用外壳和设置页语言。" : "Switch the app shell and Settings page language."}>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Select value={language} onChange={(event) => patch({ language: event.target.value as Language })}>
                <option value="en">{languageLabels.en}</option>
                <option value="zh">{languageLabels.zh}</option>
              </Select>
            </div>
          </SettingRow>
          <SettingRow title={isZh ? "主题" : "Theme"} body={isZh ? "使用顶部栏按钮切换深色和浅色模式。" : "Use the top bar toggle to switch between dark and light modes."}>
            <Badge tone="cyan">Dark first</Badge>
          </SettingRow>
          <SettingRow title={isZh ? "数字样式" : "Numeric style"} body={isZh ? "Token 数和费用使用等宽数字，方便扫描表格。" : "Token counts and costs use tabular numerals for scan-friendly tables."}>
            <Badge>Tabular nums</Badge>
          </SettingRow>
      </SettingsSection>

      <SettingsSection title={isZh ? "开发者" : "Developer"} body={isZh ? "MVP 实现说明和实验性解析器标记。" : "MVP implementation notes and experimental parser flags."} icon={Code2}>
          <SettingRow title={isZh ? "本地解析器状态" : "Local parser status"} body={isZh ? "Codex 和 Claude Code 解析器仍是实验性能力，需要持续增加 fixture。" : "Codex and Claude Code parsers are experimental and should be extended with fixtures."}>
            <Badge tone="cyan">Experimental</Badge>
          </SettingRow>
          <SettingRow title={isZh ? "安全存储抽象" : "Secure storage abstraction"} body={isZh ? "API key UI 只是脚手架；真实 key 持久化刻意延后。" : "API key UI is scaffolded; real key persistence is intentionally deferred."}>
            <Badge tone="amber">Not storing keys</Badge>
          </SettingRow>
      </SettingsSection>
    </div>
  );
}
