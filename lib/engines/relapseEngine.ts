import { clamp } from "@/lib/utils";

export interface RelapseRiskInput {
  missedHabitsLast3Days: number;
  avgSleepHours7d: number;
  avgScreenMinutes7d: number;
  disciplineScore: number;
  currentStreak: number;
}

export interface RelapseRiskResult {
  riskScore: number;
  tier: "low" | "medium" | "high";
  reasons: string[];
  interventions: string[];
}

export function detectRelapseRisk(input: RelapseRiskInput): RelapseRiskResult {
  const reasons: string[] = [];
  let score = 0;

  if (input.missedHabitsLast3Days >= 3) {
    score += 30;
    reasons.push("Multiple habit misses in the last 72 hours.");
  } else if (input.missedHabitsLast3Days > 0) {
    score += 12;
  }

  if (input.avgSleepHours7d < 6) {
    score += 22;
    reasons.push("Sleep debt detected.");
  }

  if (input.avgScreenMinutes7d > 300) {
    score += 20;
    reasons.push("Screen time is above configured threshold.");
  }

  if (input.disciplineScore < 45) {
    score += 22;
    reasons.push("Discipline score below recovery threshold.");
  }

  if (input.currentStreak <= 1) {
    score += 10;
  }

  score = clamp(score, 0, 100);
  const tier = score < 35 ? "low" : score < 70 ? "medium" : "high";

  const interventions =
    tier === "high"
      ? [
          "Enable Comeback Mode immediately.",
          "Lock next day to 3 micro-wins only.",
          "Trigger mother-tone reminders every 4 hours."
        ]
      : tier === "medium"
        ? [
            "Reduce task load by 20%.",
            "Schedule one deep-work timer before noon."
          ]
        : ["Maintain routine and avoid late-night screen spikes."];

  return {
    riskScore: score,
    tier,
    reasons,
    interventions
  };
}
