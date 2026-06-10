import { Badge } from "./Badge";
import type { Accuracy, SourceType } from "../../lib/types";
import { normalizeLanguage, type Language } from "../../lib/i18n";

const sourceTypeLabels: Record<SourceType, string> = {
  official_api: "Official API",
  local_log: "Local Log",
  telemetry: "Telemetry",
  csv_import: "CSV Import",
  manual: "Manual",
  demo: "Demo",
  experimental: "Experimental",
};

const zhSourceTypeLabels: Record<SourceType, string> = {
  official_api: "官方 API",
  local_log: "本地日志",
  telemetry: "遥测",
  csv_import: "CSV 导入",
  manual: "手动",
  demo: "演示",
  experimental: "实验性",
};

const accuracyLabels: Record<Accuracy, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  experimental: "Experimental",
};

const zhAccuracyLabels: Record<Accuracy, string> = {
  high: "高",
  medium: "中",
  low: "低",
  experimental: "实验性",
};

const sourceTypeTones: Record<SourceType, "neutral" | "green" | "amber" | "cyan"> = {
  official_api: "green",
  local_log: "cyan",
  telemetry: "neutral",
  csv_import: "amber",
  manual: "neutral",
  demo: "green",
  experimental: "cyan",
};

const accuracyTones: Record<Accuracy, "neutral" | "green" | "amber" | "cyan"> = {
  high: "green",
  medium: "amber",
  low: "neutral",
  experimental: "cyan",
};

export function getSourceTypeLabel(value: SourceType) {
  return sourceTypeLabels[value];
}

export function getAccuracyLabel(value: Accuracy) {
  return accuracyLabels[value];
}

type SourceMetaBadgeProps =
  | { kind: "sourceType"; value: SourceType; language?: Language }
  | { kind: "accuracy"; value: Accuracy; language?: Language };

export function SourceMetaBadge(props: SourceMetaBadgeProps) {
  const language = normalizeLanguage(props.language);
  if (props.kind === "sourceType") {
    const labels = language === "zh" ? zhSourceTypeLabels : sourceTypeLabels;
    return <Badge tone={sourceTypeTones[props.value]}>{labels[props.value]}</Badge>;
  }
  const labels = language === "zh" ? zhAccuracyLabels : accuracyLabels;
  return <Badge tone={accuracyTones[props.value]}>{labels[props.value]}</Badge>;
}
