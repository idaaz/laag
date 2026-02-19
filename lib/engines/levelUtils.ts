export function calculateLevel(totalXP: number, levelDivisor = 100): number {
  if (levelDivisor <= 0) return 0;
  return Math.max(0, Math.floor(totalXP / levelDivisor));
}

export function levelPenaltyMultiplier(level: number): number {
  if (level < 5) return 0.85;
  if (level < 12) return 1;
  return 1.25;
}
