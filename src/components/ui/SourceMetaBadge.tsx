import { Badge } from "./Badge";
import type { Accuracy, SourceType } from "../../lib/types";

const sourceTypeLabels: Record<SourceType, string> = {
  official_api: "Official API",
  local_log: "Local Log",
  telemetry: "Telemetry",
  csv_import: "CSV Import",
  manual: "Manual",
  demo: "Demo",
  experimental: "Experimental",
};

const accuracyLabels: Record<Accuracy, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  experimental: "Experimental",
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
  | { kind: "sourceType"; value: SourceType }
  | { kind: "accuracy"; value: Accuracy };

export function SourceMetaBadge(props: SourceMetaBadgeProps) {
  if (props.kind === "sourceType") {
    return <Badge tone={sourceTypeTones[props.value]}>{sourceTypeLabels[props.value]}</Badge>;
  }
  return <Badge tone={accuracyTones[props.value]}>{accuracyLabels[props.value]}</Badge>;
}
