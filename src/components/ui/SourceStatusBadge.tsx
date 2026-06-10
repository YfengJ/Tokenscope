import { Badge } from "./Badge";
import type { SourceStatusValue } from "../../lib/types";
import { normalizeLanguage, type Language } from "../../lib/i18n";

const labels: Record<SourceStatusValue, string> = {
  connected: "Connected",
  not_found: "Not found",
  needs_config: "Needs config",
  experimental: "Experimental",
  coming_soon: "Coming soon",
};

const zhLabels: Record<SourceStatusValue, string> = {
  connected: "已连接",
  not_found: "未找到",
  needs_config: "需配置",
  experimental: "实验性",
  coming_soon: "即将推出",
};

const tones: Record<SourceStatusValue, "neutral" | "green" | "amber" | "cyan"> = {
  connected: "green",
  not_found: "neutral",
  needs_config: "amber",
  experimental: "cyan",
  coming_soon: "neutral",
};

export function getSourceStatusLabel(status: SourceStatusValue) {
  return labels[status];
}

export function SourceStatusBadge({ status, language }: { status: SourceStatusValue; language?: Language }) {
  const labelSet = normalizeLanguage(language) === "zh" ? zhLabels : labels;
  return <Badge tone={tones[status]}>{labelSet[status]}</Badge>;
}
