import type { XPConfig } from "@/lib/engines/xpEngine";

export const defaultXPRules: XPConfig = {
  levelDivisor: 100,
  dailySoftCap: 300,
  softCapMultiplier: 0.25,
  antiInflationDecayWindowDays: 7,
  antiInflationDecayMultiplier: 0.85,
  penalties: {
    streakBreakBase: 25,
    highLevelMultiplier: 1.4
  },
  rewards: {
    completeTask: 10,
    highPriorityBonus: 20,
    workout: 30,
    studyPerHour: 15,
    customHabitDefault: 12
  },
  screenPenaltyThresholdMinutes: 240,
  screenPenaltyXP: 15
};
