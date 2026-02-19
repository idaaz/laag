import { describe, expect, it } from "vitest";
import { calculateXP } from "@/lib/engines/xpEngine";
import { defaultXPRules } from "@/lib/config/xpRules";

describe("xpEngine", () => {
  it("awards base + high priority bonus for completed task", () => {
    const result = calculateXP(
      {
        sourceType: "task_complete",
        completed: true,
        priority: "high"
      },
      defaultXPRules,
      { totalXPBefore: 0, dayXPBefore: 0 }
    );

    expect(result.rawXP).toBe(30);
    expect(result.finalXP).toBe(30);
    expect(result.capped).toBe(false);
  });

  it("applies dynamic streak break penalties at high level", () => {
    const result = calculateXP(
      {
        sourceType: "habit_complete",
        customHabitXP: 12,
        brokeStreak: true
      },
      defaultXPRules,
      { totalXPBefore: 1400, dayXPBefore: 0 }
    );

    expect(result.penaltyApplied).toBeGreaterThan(25);
    expect(result.finalXP).toBeLessThan(0);
  });

  it("applies soft cap reduction after daily cap", () => {
    const result = calculateXP(
      {
        sourceType: "study_log",
        studyMinutes: 240
      },
      defaultXPRules,
      { totalXPBefore: 400, dayXPBefore: 290 }
    );

    expect(result.capped).toBe(true);
    expect(result.capReduction).toBeGreaterThan(0);
  });

  it("applies anti-inflation decay for repetitive completions", () => {
    const result = calculateXP(
      {
        sourceType: "habit_complete",
        customHabitXP: 20,
        repetitiveCompletionsInWindow: 30
      },
      defaultXPRules,
      { totalXPBefore: 300, dayXPBefore: 20 }
    );
    expect(result.decayApplied).toBe(true);
    expect(result.rawXP).toBe(Math.round(20 * defaultXPRules.antiInflationDecayMultiplier));
  });
});
