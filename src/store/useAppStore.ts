import { create } from "zustand";
import {
  getSettings,
  listSourceStatus,
  listUsageEvents,
  toggleDemoData as toggleDemoDataApi,
  updateSettings as updateSettingsApi,
} from "../lib/api";
import type { AppSettings, SourceStatus, TimeRangeId, UsageEvent, UsageFilters } from "../lib/types";

interface AppState {
  events: UsageEvent[];
  sourceStatuses: SourceStatus[];
  settings: AppSettings | null;
  range: TimeRangeId;
  query: string;
  selectedSource: UsageFilters["source"];
  selectedModel: UsageFilters["model"];
  selectedDate: string | null;
  loading: boolean;
  load: () => Promise<void>;
  reloadEvents: () => Promise<void>;
  setRange: (range: TimeRangeId) => void;
  setQuery: (query: string) => void;
  setSelectedSource: (source: UsageFilters["source"]) => void;
  setSelectedModel: (model: UsageFilters["model"]) => void;
  setSelectedDate: (date: string | null) => void;
  updateSettings: (settings: AppSettings) => Promise<void>;
  toggleDemoData: (enabled: boolean) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  events: [],
  sourceStatuses: [],
  settings: null,
  range: "7d",
  query: "",
  selectedSource: "all",
  selectedModel: "all",
  selectedDate: null,
  loading: false,
  async load() {
    set({ loading: true });
    const [settings, events, sourceStatuses] = await Promise.all([
      getSettings(),
      listUsageEvents(),
      listSourceStatus(),
    ]);
    set({ settings, events, sourceStatuses, loading: false });
  },
  async reloadEvents() {
    const state = get();
    const events = await listUsageEvents({
      range: state.range,
      query: state.query,
      source: state.selectedSource,
      model: state.selectedModel,
    });
    const sourceStatuses = await listSourceStatus();
    set({ events, sourceStatuses });
  },
  setRange(range) {
    set({ range });
  },
  setQuery(query) {
    set({ query });
  },
  setSelectedSource(source) {
    set({ selectedSource: source });
  },
  setSelectedModel(model) {
    set({ selectedModel: model });
  },
  setSelectedDate(date) {
    set({ selectedDate: date });
  },
  async updateSettings(settings) {
    const saved = await updateSettingsApi(settings);
    set({ settings: saved });
    await get().reloadEvents();
  },
  async toggleDemoData(enabled) {
    const events = await toggleDemoDataApi(enabled);
    const settings = get().settings;
    const sourceStatuses = await listSourceStatus();
    set({
      events,
      sourceStatuses,
      settings: settings ? { ...settings, demo_data_enabled: enabled } : settings,
    });
  },
}));
