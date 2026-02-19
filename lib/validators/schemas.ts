import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  deadline_at: z.string().nullable().optional()
});

export const habitSchema = z.object({
  name: z.string().min(2).max(80),
  frequency_per_week: z.number().int().min(1).max(7),
  xp_per_completion: z.number().int().min(1).max(100)
});

export const dailyLogSchema = z.object({
  log_date: z.string(),
  study_minutes: z.number().int().min(0).max(1440),
  workout_minutes: z.number().int().min(0).max(600),
  sleep_hours: z.number().min(0).max(24),
  screen_minutes: z.number().int().min(0).max(1440),
  mood: z.number().int().min(1).max(10),
  productivity: z.number().int().min(1).max(10),
  edit_reason: z.string().max(500).optional()
});

export const pinSchema = z.object({
  pin: z.string().regex(/^[0-9]{4,8}$/)
});
