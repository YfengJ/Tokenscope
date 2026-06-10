import { describe, expect, it } from "vitest";
import { createDemoSourceStatuses, createDemoUsageEvents, defaultSettings } from "../lib/demoData";

describe("demo data", () => {
  it("creates deterministic usage metadata without prompt fields", () => {
    const events = createDemoUsageEvents(new Date("2026-06-09T12:00:00"));
    expect(events.length).toBeGreaterThan(100);
    expect(events[0].total_tokens).toBeGreaterThan(0);
    expect(JSON.stringify(events)).not.toContain("prompt");
  });

  it("does not label demo events as real connector usage", () => {
    const events = createDemoUsageEvents(new Date("2026-06-09T12:00:00"));
    expect(new Set(events.map((event) => event.source))).toEqual(new Set(["demo"]));
    expect(new Set(events.map((event) => event.source_type))).toEqual(new Set(["demo"]));
    expect(JSON.stringify(events)).not.toContain('"source":"codex"');
    expect(JSON.stringify(events)).not.toContain('"source":"claude_code"');
    expect(JSON.stringify(events)).not.toContain('"source":"openai_api"');
  });

  it("keeps demo data disabled until the user enables it", () => {
    expect(defaultSettings.demo_data_enabled).toBe(false);
  });

  it("includes MVP source status cards", () => {
    const statuses = createDemoSourceStatuses(new Date("2026-06-09T12:00:00"));
    expect(statuses.map((status) => status.source)).toContain("manual_import");
    expect(statuses.find((status) => status.source === "openai_api")?.status).toBe("needs_config");
    expect(statuses.find((status) => status.source === "demo")?.status).toBe("needs_config");
    expect(statuses.find((status) => status.source === "claude_code")?.event_count).toBe(0);
    expect(statuses.find((status) => status.source === "codex")?.event_count).toBe(0);
  });
});
