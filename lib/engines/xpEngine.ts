import { clamp } from "@/lib/utils";
import { calculateLevel, levelPenaltyMultiplier } from "@/lib/engines/levelUtils";
import type { TaskPriority } from "@/lib/supabase/types";

export interface XPConfig {
  levelDivisor: number;
  dailySoftCap: number;
  softCapMultiplier: number;
  antiInflationDecayWindowDays: number;
  antiInflationDecayMultiplier: number;
  penalties: {
    streakBreakBase: number;
    highLevelMultiplier: number;
  };
  rewards: {
    completeTask: number;
    highPriorityBonus: number;
    workout: number;
    studyPerHour: number;
    customHabitDefault: number;
  };
  screenPenaltyThresholdMinutes: number;
  screenPenaltyXP: number;
}

export interface XPEventInput {
  sourceType:
    | "task_complete"
    | "habit_complete"
    | "study_log"
    | "workout_log"
    | "timer_complete"
    | "penalty";
  priority?: TaskPriority;
  completed?: boolean;
  studyMinutes?: number;
  workoutCompleted?: boolean;
  customHabitXP?: number;
  brokeStreak?: boolean;
  screenMinutes?: number;
  repetitiveCompletionsInWindow?: number;
}

export interface XPComputationContext {
  totalXPBefore: number;
  dayXPBefore: number;
}

export interface XPComputationResult {
  rawXP: number;
  finalXP: number;
  capped: boolean;
  capReduction: number;
  decayApplied: boolean;
  penaltyApplied: number;
  resultingTotalXP: number;
  resultingLevel: number;
  flags: string[];
  breakdown: {
    base: number;
    bonus: number;
    penalties: number;
  };
}

function calculateBaseAndBonus(input: XPEventInput, config: XPConfig) {
  let base = 0;
  let bonus = 0;

  switch (input.sourceType) {
    case "task_complete":
      if (input.completed) {
        base += config.rewards.completeTask;
        if (input.priority === "high" || input.priority === "critical") {
          bonus += config.rewards.highPriorityBonus;
        }
      }
      break;
    case "habit_complete":
      base += input.customHabitXP ?? config.rewards.customHabitDefault;
      break;
    case "study_log":
      base += Math.round(((input.studyMinutes ?? 0) / 60) * config.rewards.studyPerHour);
      break;
    case "workout_log":
      if (input.workoutCompleted) {
        base += config.rewards.workout;
      }
      break;
    case "timer_complete":
      base += Math.round(config.rewards.studyPerHour * 0.5);
      break;
    case "penalty":
      break;
  }

  return { base, bonus };
}

export function calculateXP(
  input: XPEventInput,
  config: XPConfig,
  context: XPComputationContext
): XPComputationResult {
  const flags: string[] = [];
  const { base, bonus } = calculateBaseAndBonus(input, config);
  let raw = base + bonus;
  let penalties = 0;
  let capReduction = 0;
  let decayApplied = false;

  const currentLevel = calculateLevel(context.totalXPBefore, config.levelDivisor);

  if (input.brokeStreak) {
    const penaltyScale = levelPenaltyMultiplier(currentLevel);
    const streakPenalty = Math.round(config.penalties.streakBreakBase * penaltyScale);
    penalties += streakPenalty;
    flags.push("streak_break_penalty");
  }

  if (
    typeof input.screenMinutes === "number" &&
    input.screenMinutes > config.screenPenaltyThresholdMinutes
  ) {
    penalties += Math.round(config.screenPenaltyXP * levelPenaltyMultiplier(currentLevel));
    flags.push("screen_time_penalty");
  }

  if ((input.repetitiveCompletionsInWindow ?? 0) > 20 && raw > 0) {
    raw = Math.round(raw * config.antiInflationDecayMultiplier);
    decayApplied = true;
    flags.push("anti_inflation_decay");
  }

  let final = raw - penalties;
  const projectedDayXP = context.dayXPBefore + final;
  if (final > 0 && projectedDayXP > config.dailySoftCap) {
    const overflow = projectedDayXP - config.dailySoftCap;
    const reducedOverflow = Math.round(overflow * config.softCapMultiplier);
    const effectiveOverflow = overflow - reducedOverflow;
    final -= effectiveOverflow;
    capReduction = effectiveOverflow;
    flags.push("daily_soft_cap");
  }

  final = Math.round(final);
  const resultingTotalXP = Math.max(0, context.totalXPBefore + final);

  return {
    rawXP: raw,
    finalXP: final,
    capped: capReduction > 0,
    capReduction,
    decayApplied,
    penaltyApplied: penalties,
    resultingTotalXP,
    resultingLevel: calculateLevel(resultingTotalXP, config.levelDivisor),
    flags,
    breakdown: {
      base,
      bonus,
      penalties
    }
  };
}

export function applyDynamicPenaltyByLevel(
  basePenalty: number,
  level: number,
  highLevelMultiplier: number
): number {
  const scaled = level >= 12 ? basePenalty * highLevelMultiplier : basePenalty;
  return Math.round(clamp(scaled, 0, Number.MAX_SAFE_INTEGER));
}
