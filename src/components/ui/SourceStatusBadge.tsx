import { Badge } from "./Badge";
import type { SourceStatusValue } from "../../lib/types";

const labels: Record<SourceStatusValue, string> = {
  connected: "Connected",
  not_found: "Not found",
  needs_config: "Needs config",
  experimental: "Experimental",
  coming_soon: "Coming soon",
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

export function SourceStatusBadge({ status }: { status: SourceStatusValue }) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
