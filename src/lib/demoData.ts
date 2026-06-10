import type { AppSettings, SourceStatus, UsageEvent } from "./types";
import { addDays, dayKey, startOfLocalDay } from "./ranges";

const SOURCE_MODEL_PAIRS: Array<{
  model: string;
  provider: string;
  project: string;
  costPerMTok: number;
}> = [
  {
    model: "gpt-5.5-codex",
    provider: "OpenAI",
    project: "Demo Workspace",
    costPerMTok: 8.5,
  },
  {
    model: "gpt-5-codex",
    provider: "OpenAI",
    project: "Demo Workspace",
    costPerMTok: 8.5,
  },
  {
    model: "claude-sonnet-4.5",
    provider: "Anthropic",
    project: "Demo Workspace",
    costPerMTok: 10,
  },
  {
    model: "openrouter/auto",
    provider: "OpenRouter",
    project: "Demo Workspace",
    costPerMTok: 4.5,
  },
];

export const defaultSettings: AppSettings = {
  data_dir: "app-data/tokenscope",
  codex_home_path: "~/.codex",
  claude_home_path: "~/.claude",
  demo_data_enabled: false,
  hide_project_names: false,
  save_raw_references: false,
  openai_configured: false,
  anthropic_configured: false,
  language: "en",
};

function seeded(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

export function createDemoUsageEvents(now = new Date()): UsageEvent[] {
  const today = startOfLocalDay(now);
  const events: UsageEvent[] = [];

  for (let dayOffset = 0; dayOffset < 34; dayOffset += 1) {
    const date = addDays(today, -dayOffset);
    const dayPulse = dayOffset % 9 === 2 ? 1.85 : dayOffset % 7 === 0 ? 1.25 : 1;
    const dailySessions = dayOffset < 7 ? 5 : dayOffset < 18 ? 4 : 3;

    for (let session = 0; session < dailySessions; session += 1) {
      const pair = SOURCE_MODEL_PAIRS[(dayOffset + session) % SOURCE_MODEL_PAIRS.length];
      const entropy = seeded(dayOffset * 17 + session * 31);
      const input = Math.round((14_000 + entropy * 95_000) * dayPulse);
      const output = Math.round((7_000 + seeded(dayOffset * 19 + session * 13) * 54_000) * dayPulse);
      const cacheRead = Math.round(input * (session % 3 === 0 ? 0.28 : 0.08));
      const cacheWrite = Math.round(input * (session % 4 === 0 ? 0.11 : 0.02));
      const reasoning = pair.model.includes("gpt-5") || pair.model.includes("opus") ? Math.round(output * 0.18) : 0;
      const total = input + output + cacheRead + cacheWrite + reasoning;
      let timestamp = new Date(date);
      if (dayOffset === 0) {
        const elapsedToday = Math.max(1, now.getTime() - today.getTime());
        timestamp = new Date(today.getTime() + Math.floor((elapsedToday * (session + 1)) / dailySessions));
      } else {
        timestamp.setHours(9 + ((session * 3 + dayOffset) % 12), (session * 11) % 60, 0, 0);
      }

      events.push({
        id: `demo-${dayKey(date)}-${session}`,
        source: "demo",
        source_type: "demo",
        timestamp: timestamp.toISOString(),
        project_name: pair.project,
        session_id: `${pair.project.toLowerCase().replace(/\s+/g, "-")}-${dayKey(date)}-${session % 2}`,
        model: pair.model,
        provider: pair.provider,
        input_tokens: input,
        output_tokens: output,
        cache_read_tokens: cacheRead,
        cache_write_tokens: cacheWrite,
        reasoning_tokens: reasoning,
        total_tokens: total,
        estimated_cost_usd: (total / 1_000_000) * pair.costPerMTok,
        duration_ms: Math.round(1000 * (45 + entropy * 480)),
        raw_ref: `demo:${dayKey(date)}:${session}`,
        accuracy: "high",
      });
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function createDemoSourceStatuses(now = new Date()): SourceStatus[] {
  void now;
  return [
    {
      source: "codex",
      label: "Codex CLI local logs",
      source_type: "local_log",
      status: "experimental",
      accuracy: "experimental",
      last_sync: null,
      event_count: 0,
      action: "Scan",
      description: "Scans local JSONL sessions without prompt content.",
    },
    {
      source: "claude_code",
      label: "Claude Code local logs",
      source_type: "local_log",
      status: "experimental",
      accuracy: "experimental",
      last_sync: null,
      event_count: 0,
      action: "Scan",
      description: "Parses message usage metadata and deduplicates message ids.",
    },
    {
      source: "openai_api",
      label: "OpenAI API",
      source_type: "official_api",
      status: "needs_config",
      accuracy: "high",
      last_sync: null,
      event_count: 0,
      action: "Configure",
      description: "Configuration UI is available; network sync is mocked in MVP.",
    },
    {
      source: "anthropic_api",
      label: "Anthropic API",
      source_type: "official_api",
      status: "needs_config",
      accuracy: "high",
      last_sync: null,
      event_count: 0,
      action: "Configure",
      description: "Configuration UI is available; network sync is mocked in MVP.",
    },
    {
      source: "openrouter",
      label: "OpenRouter",
      source_type: "official_api",
      status: "coming_soon",
      accuracy: "medium",
      last_sync: null,
      event_count: 0,
      action: "Coming soon",
      description: "Connector contract is reserved for a later release.",
    },
    {
      source: "litellm",
      label: "LiteLLM",
      source_type: "telemetry",
      status: "coming_soon",
      accuracy: "medium",
      last_sync: null,
      event_count: 0,
      action: "Coming soon",
      description: "Proxy log ingestion is planned after local parsers stabilize.",
    },
    {
      source: "cursor",
      label: "Cursor",
      source_type: "telemetry",
      status: "coming_soon",
      accuracy: "low",
      last_sync: null,
      event_count: 0,
      action: "Coming soon",
      description: "Telemetry availability depends on local export support.",
    },
    {
      source: "copilot",
      label: "GitHub Copilot",
      source_type: "telemetry",
      status: "coming_soon",
      accuracy: "low",
      last_sync: null,
      event_count: 0,
      action: "Coming soon",
      description: "Reserved for future official and local telemetry paths.",
    },
    {
      source: "gemini_cli",
      label: "Gemini CLI",
      source_type: "local_log",
      status: "coming_soon",
      accuracy: "experimental",
      last_sync: null,
      event_count: 0,
      action: "Coming soon",
      description: "Local parser is not included in the first MVP.",
    },
    {
      source: "manual_import",
      label: "Manual CSV import",
      source_type: "csv_import",
      status: "connected",
      accuracy: "medium",
      last_sync: null,
      event_count: 0,
      action: "Import",
      description: "Imports metadata columns from a generic CSV file.",
    },
    {
      source: "demo",
      label: "Demo data",
      source_type: "demo",
      status: "needs_config",
      accuracy: "high",
      last_sync: null,
      event_count: 0,
      action: "Configure",
      description: "Deterministic local sample data for first-run exploration.",
    },
  ];
}
