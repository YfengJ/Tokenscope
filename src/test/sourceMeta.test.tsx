import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceMetaBadge, getAccuracyLabel, getSourceTypeLabel } from "../components/ui/SourceMetaBadge";

describe("SourceMetaBadge", () => {
  it("renders readable source type labels", () => {
    expect(getSourceTypeLabel("official_api")).toBe("Official API");
    expect(getSourceTypeLabel("local_log")).toBe("Local Log");
    expect(getSourceTypeLabel("csv_import")).toBe("CSV Import");
  });

  it("renders readable accuracy labels", () => {
    expect(getAccuracyLabel("experimental")).toBe("Experimental");
    render(<SourceMetaBadge kind="accuracy" value="experimental" />);
    expect(screen.getByText("Experimental")).toBeInTheDocument();
  });
});
