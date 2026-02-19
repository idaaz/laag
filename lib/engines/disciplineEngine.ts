import { clamp } from "@/lib/utils";

export interface DisciplineInput {
  completedTasks: number;
  totalTasks: number;
  habitConsistency: number;
  dailyLogCompletion: number;
  level: number;
}

export interface DisciplineResult {
  score: number;
  strictnessTier: "lenient" | "standard" | "strict";
  recommendations: string[];
}

export function calculateDisciplineScore(input: DisciplineInput): number {
  const completedRatio =
    input.totalTasks <= 0 ? 0 : clamp(input.completedTasks / input.totalTasks, 0, 1);
  const habitConsistency = clamp(input.habitConsistency, 0, 1);
  const dailyLogCompletion = clamp(input.dailyLogCompletion, 0, 1);

  return clamp(
    completedRatio * 50 + habitConsistency * 30 + dailyLogCompletion * 20,
    0,
    100
  );
}

export function evaluateDiscipline(input: DisciplineInput): DisciplineResult {
  const score = calculateDisciplineScore(input);
  const strictnessTier =
    input.level < 5 ? "lenient" : input.level < 12 ? "standard" : "strict";
  const recommendations: string[] = [];

  if (score < 45) {
    recommendations.push("Enter recovery mode and finish one micro-task within 15 minutes.");
    recommendations.push("Reduce planned tasks by 30% for tomorrow.");
  } else if (score < 70) {
    recommendations.push("Prioritize deadline tasks and complete daily log before sleep.");
  } else {
    recommendations.push("Maintain consistency and avoid chasing excess XP after the soft cap.");
  }

  return { score, strictnessTier, recommendations };
}
