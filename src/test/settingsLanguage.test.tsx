import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Settings } from "../routes/Settings";
import { defaultSettings } from "../lib/demoData";
import { useAppStore } from "../store/useAppStore";
import type { AppSettings } from "../lib/types";

const initialState = useAppStore.getState();

describe("Settings language switch", () => {
  afterEach(() => {
    act(() => {
      useAppStore.setState(initialState, true);
    });
  });

  it("saves language changes immediately so navigation stays localized", async () => {
    const updateSettings = vi.fn(async (_settings: AppSettings) => undefined);
    useAppStore.setState({
      settings: { ...defaultSettings, language: "en" },
      events: [],
      sourceStatuses: [],
      updateSettings,
    });

    await act(async () => {
      render(<Settings />);
    });
    await act(async () => {
      fireEvent.change(screen.getByDisplayValue("English"), { target: { value: "zh" } });
    });

    await waitFor(() => {
      expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ language: "zh" }));
    });
  });
});
