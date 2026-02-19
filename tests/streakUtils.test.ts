import { describe, expect, it } from "vitest";
import { computeTaskStreak } from "@/lib/engines/streakUtils";

describe("streakUtils", () => {
  it("computes contiguous current and longest streak", () => {
    const reference = new Date("2026-02-12T12:00:00Z");
    const result = computeTaskStreak(
      ["2026-02-10T10:00:00Z", "2026-02-11T09:00:00Z", "2026-02-12T07:00:00Z"],
      "UTC",
      reference
    );
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("handles broken streak and retains longest run", () => {
    const reference = new Date("2026-02-12T12:00:00Z");
    const result = computeTaskStreak(
      ["2026-02-01", "2026-02-02", "2026-02-05", "2026-02-06"],
      "UTC",
      reference
    );
    expect(result.longestStreak).toBe(2);
    expect(result.currentStreak).toBe(0);
  });

  it("normalizes timezone-sensitive dates near midnight", () => {
    const reference = new Date("2026-02-12T18:00:00Z");
    const result = computeTaskStreak(
      ["2026-02-12T01:00:00Z", "2026-02-13T03:00:00Z"],
      "America/Los_Angeles",
      reference
    );
    expect(result.longestStreak).toBeGreaterThanOrEqual(1);
  });

  it("returns zero streak for empty inputs", () => {
    const result = computeTaskStreak([], "UTC", new Date("2026-02-12T00:00:00Z"));
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.nextBreakDeadline).toBeNull();
  });
});
