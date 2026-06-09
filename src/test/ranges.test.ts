import { describe, expect, it } from "vitest";
import { dayKey, enumerateDays, getRangeWindow } from "../lib/ranges";

describe("ranges", () => {
  it("calculates inclusive last 7 day windows with previous period", () => {
    const now = new Date("2026-06-09T15:30:00");
    const range = getRangeWindow("7d", now);
    expect(dayKey(range.start)).toBe("2026-06-03");
    expect(dayKey(range.end)).toBe("2026-06-09");
    expect(dayKey(range.previousStart)).toBe("2026-05-27");
    expect(dayKey(range.previousEnd)).toBe("2026-06-03");
  });

  it("enumerates local days inclusively", () => {
    const days = enumerateDays(new Date("2026-06-07T20:00:00"), new Date("2026-06-09T01:00:00"));
    expect(days).toEqual(["2026-06-07", "2026-06-08", "2026-06-09"]);
  });
});
