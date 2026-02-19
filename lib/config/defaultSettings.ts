import { defaultXPRules } from "@/lib/config/xpRules";

export const defaultSettings = {
  xp_rules: defaultXPRules,
  discipline_rules: {
    recoveryThreshold: 45,
    recoveryDaysRequired: 2,
    strictnessTiers: [
      { minLevel: 0, penaltyMultiplier: 0.85, requiredDailyLogs: 0.6 },
      { minLevel: 5, penaltyMultiplier: 1, requiredDailyLogs: 0.75 },
      { minLevel: 12, penaltyMultiplier: 1.2, requiredDailyLogs: 0.9 }
    ]
  },
  notification_prefs: {
    browser: true,
    inApp: true,
    deadlineLeadHours: 4,
    streakLeadHours: 6
  },
  lock_mode: {
    enabled: false,
    pinHash: null,
    salt: null,
    iterations: 210000,
    timeoutMinutes: 15
  },
  brutal_truth_mode: true,
  recovery_threshold: 45,
  strictness_profile: { mode: "adaptive" }
} as const;
