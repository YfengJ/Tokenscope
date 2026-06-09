import { describe, expect, it } from "vitest";
import { formatCurrency, formatPercentChange, formatTokens, toTitle } from "../lib/format";

describe("format", () => {
  it("formats compact token counts", () => {
    expect(formatTokens(1500)).toBe("1.5K");
    expect(formatTokens(32_100)).toBe("32.1K");
    expect(formatTokens(950_000)).toBe("950K");
    expect(formatTokens(2_400_000)).toBe("2.4M");
  });

  it("formats costs and deltas", () => {
    expect(formatCurrency(1.234)).toBe("$1.23");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(0.002345)).toBe("$0.0023");
    expect(formatCurrency(120)).toBe("$120.00");
    expect(formatPercentChange(12.345)).toBe("+12.3%");
  });

  it("title cases source ids", () => {
    expect(toTitle("claude_code")).toBe("Claude Code");
  });
});
