export type UsageSource =
  | "codex"
  | "claude_code"
  | "openai_api"
  | "anthropic_api"
  | "openrouter"
  | "litellm"
  | "cursor"
  | "copilot"
  | "gemini_cli"
  | "manual_import"
  | "demo";

export type SourceType =
  | "official_api"
  | "local_log"
  | "telemetry"
  | "csv_import"
  | "manual"
  | "demo"
  | "experimental";

export type Accuracy = "high" | "medium" | "low" | "experimental";

export type SourceStatusValue =
  | "connected"
  | "not_found"
  | "needs_config"
  | "experimental"
  | "coming_soon";

export interface UsageEvent {
  id: string;
  source: UsageSource;
  source_type: SourceType;
  timestamp: string;
  project_name?: string | null;
  session_id?: string | null;
  model: string;
  provider?: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
  estimated_cost_usd?: number | null;
  duration_ms?: number | null;
  raw_ref?: string | null;
  accuracy: Accuracy;
}

export interface SourceStatus {
  source: UsageSource;
  label: string;
  source_type: SourceType;
  status: SourceStatusValue;
  accuracy: Accuracy;
  last_sync?: string | null;
  event_count: number;
  action: "Configure" | "Scan" | "Import" | "Coming soon";
  description: string;
}

export type TimeRangeId = "today" | "3d" | "7d" | "30d" | "custom";

export interface RangeWindow {
  id: TimeRangeId;
  label: string;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

export interface UsageFilters {
  range: TimeRangeId;
  query?: string;
  source?: UsageSource | "all";
  model?: string | "all";
  customStart?: string;
  customEnd?: string;
}

export interface SummaryCardData {
  label: string;
  total_tokens: number;
  estimated_cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  comparison_delta: number;
}

export interface TrendPoint {
  date: string;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
}

export interface BreakdownPoint {
  name: string;
  value: number;
}

export interface ModelStat {
  model: string;
  provider?: string | null;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  estimated_cost_usd: number;
  sessions_count: number;
  last_used: string;
}

export interface SessionStat {
  session_id: string;
  project_name?: string | null;
  source: UsageSource;
  model: string;
  total_tokens: number;
  estimated_cost_usd: number;
  started_at: string;
  events_count: number;
}

export interface TokenSpike {
  date: string;
  source: UsageSource;
  model: string;
  total_tokens: number;
  delta_vs_previous_day: number;
}

export interface DashboardSummary {
  cards: SummaryCardData[];
  daily_trend: TrendPoint[];
  tokens_by_source: BreakdownPoint[];
  tokens_by_model: BreakdownPoint[];
  top_expensive_sessions: SessionStat[];
  spikes: TokenSpike[];
}

export interface AppSettings {
  data_dir: string;
  codex_home_path: string;
  claude_home_path: string;
  demo_data_enabled: boolean;
  hide_project_names: boolean;
  save_raw_references: boolean;
  openai_configured: boolean;
  anthropic_configured: boolean;
  language: "en" | "zh";
}
