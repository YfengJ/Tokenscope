import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../components/layout/AppShell";
import { Dashboard } from "../routes/Dashboard";
import { Settings } from "../routes/Settings";
import { createDemoUsageEvents, createDemoSourceStatuses, defaultSettings } from "../lib/demoData";
import { useAppStore } from "../store/useAppStore";

const initialState = useAppStore.getState();

describe("Chinese localization smoke", () => {
  afterEach(() => {
    act(() => {
      useAppStore.setState(initialState, true);
    });
  });

  it("keeps shell, dashboard, settings, and about copy in Chinese", () => {
    useAppStore.setState({
      events: createDemoUsageEvents(new Date("2026-06-10T12:00:00Z")),
      sourceStatuses: createDemoSourceStatuses(),
      settings: { ...defaultSettings, language: "zh" },
      range: "7d",
      query: "",
      loading: false,
      updateSettings: vi.fn(async () => undefined),
    });

    const { rerender } = render(
      <AppShell activeRoute="dashboard" onRouteChange={() => undefined}>
        <Dashboard />
      </AppShell>,
    );

    expect(screen.getByRole("button", { name: "仪表盘" })).toBeInTheDocument();
    expect(screen.getByText("查看每个 AI 编程工具的 token 使用情况。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "About TokenScope" }));
    expect(screen.getByRole("dialog", { name: "关于 TokenScope" })).toBeInTheDocument();

    rerender(
      <AppShell activeRoute="settings" onRouteChange={() => undefined}>
        <Settings />
      </AppShell>,
    );

    expect(screen.getByRole("heading", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByText("隐私")).toBeInTheDocument();
    expect(screen.getByText("TokenScope 默认不存储 prompt 或 response 内容。")).toBeInTheDocument();
  });
});
