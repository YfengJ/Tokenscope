import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceStatusBadge, getSourceStatusLabel } from "../components/ui/SourceStatusBadge";

describe("SourceStatusBadge", () => {
  it("renders a human-readable status", () => {
    render(<SourceStatusBadge status="experimental" />);
    expect(screen.getByText("Experimental")).toBeInTheDocument();
    expect(getSourceStatusLabel("needs_config")).toBe("Needs config");
  });
});
