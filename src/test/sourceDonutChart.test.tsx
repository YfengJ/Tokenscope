import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceDonutChart } from "../components/charts/SourceDonutChart";

describe("SourceDonutChart", () => {
  it("shows each source with token count and percentage", () => {
    render(
      <SourceDonutChart
        data={[
          { name: "codex", value: 166_000_000 },
          { name: "manual_import", value: 34_000_000 },
        ]}
      />,
    );

    expect(screen.getByText("Codex")).toBeInTheDocument();
    expect(screen.getByText("166M")).toBeInTheDocument();
    expect(screen.getByText("83.0%")).toBeInTheDocument();
    expect(screen.getByText("Manual Import")).toBeInTheDocument();
    expect(screen.getByText("34M")).toBeInTheDocument();
    expect(screen.getByText("17.0%")).toBeInTheDocument();
  });
});
