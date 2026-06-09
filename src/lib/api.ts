import { invoke } from "@tauri-apps/api/core";
import { buildDashboardSummary, filterEventsForRange, getModelStats } from "./analytics";
import { createDemoSourceStatuses, createDemoUsageEvents, defaultSettings } from "./demoData";
import type {
  AppSettings,
  DashboardSummary,
  ModelStat,
  SourceStatus,
  TimeRangeId,
  UsageEvent,
  UsageFilters,
} from "./types";

const demoEvents = createDemoUsageEvents();
const demoStatuses = createDemoSourceStatuses();
let localSettings: AppSettings = { ...defaultSettings };
let localEvents: UsageEvent[] = localSettings.demo_data_enabled ? demoEvents : [];

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) throw new Error("Not running inside Tauri");
  return invoke<T>(command, args);
}

export async function getSettings(): Promise<AppSettings> {
  try {
    return await tauriInvoke<AppSettings>("get_settings");
  } catch {
    return localSettings;
  }
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  try {
    return await tauriInvoke<AppSettings>("update_settings", { settings });
  } catch {
    localSettings = settings;
    localEvents = settings.demo_data_enabled ? demoEvents : [];
    return localSettings;
  }
}

export async function toggleDemoData(enabled: boolean): Promise<UsageEvent[]> {
  try {
    return await tauriInvoke<UsageEvent[]>("toggle_demo_data", { enabled });
  } catch {
    localSettings = { ...localSettings, demo_data_enabled: enabled };
    localEvents = enabled ? demoEvents : [];
    return localEvents;
  }
}

export async function listUsageEvents(filters?: Partial<UsageFilters>): Promise<UsageEvent[]> {
  try {
    return await tauriInvoke<UsageEvent[]>("list_usage_events", { filters: filters ?? {} });
  } catch {
    let events = [...localEvents];
    if (filters?.range) {
      events = filterEventsForRange(events, filters.range);
    }
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      events = events.filter((event) =>
        [event.model, event.source, event.project_name, event.session_id].some((value) =>
          (value ?? "").toLowerCase().includes(query),
        ),
      );
    }
    if (filters?.source && filters.source !== "all") {
      events = events.filter((event) => event.source === filters.source);
    }
    if (filters?.model && filters.model !== "all") {
      events = events.filter((event) => event.model === filters.model);
    }
    return events;
  }
}

export async function getDashboardSummary(range: TimeRangeId): Promise<DashboardSummary> {
  try {
    return await tauriInvoke<DashboardSummary>("get_dashboard_summary", { range });
  } catch {
    return buildDashboardSummary(localEvents, range);
  }
}

export async function listModelStats(range: TimeRangeId): Promise<ModelStat[]> {
  try {
    return await tauriInvoke<ModelStat[]>("list_model_stats", { range });
  } catch {
    return getModelStats(filterEventsForRange(localEvents, range));
  }
}

export async function listSourceStatus(): Promise<SourceStatus[]> {
  try {
    return await tauriInvoke<SourceStatus[]>("list_source_status");
  } catch {
    return demoStatuses.map((status) => {
      const sourceEvents = localEvents.filter((event) => event.source === status.source);
      const lastSync = sourceEvents
        .map((event) => event.timestamp)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
      return {
        ...status,
        event_count: sourceEvents.length,
        last_sync: lastSync,
      };
    });
  }
}

export async function scanCodex(path?: string): Promise<UsageEvent[]> {
  try {
    return await tauriInvoke<UsageEvent[]>("scan_codex", { path });
  } catch {
    return [];
  }
}

export async function scanClaude(path?: string): Promise<UsageEvent[]> {
  try {
    return await tauriInvoke<UsageEvent[]>("scan_claude", { path });
  } catch {
    return [];
  }
}

export async function importCsv(path: string): Promise<UsageEvent[]> {
  try {
    return await tauriInvoke<UsageEvent[]>("import_csv", { path });
  } catch {
    return [];
  }
}

export async function previewCsv(path: string): Promise<UsageEvent[]> {
  try {
    return await tauriInvoke<UsageEvent[]>("preview_csv", { path });
  } catch {
    return [];
  }
}
