import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { defaultSettings } from "../lib/config/defaultSettings";

function loadLocalEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_EMAIL = process.env.SEED_USER_EMAIL;
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SEED_EMAIL) {
  throw new Error(
    "Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_USER_EMAIL"
  );
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type QueryResult<T> = { data: T | null; error: { message: string } | null };

async function must<T>(query: PromiseLike<QueryResult<T>>): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function resolveUserIdByEmail(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((row) => row.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const generatedPassword =
      SEED_USER_PASSWORD ?? `Laag#${Math.random().toString(36).slice(2, 10)}A1`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { display_name: "LAAG Owner" }
    });
    if (createError || !created.user) {
      throw new Error(createError?.message ?? "Failed to create missing seed auth user.");
    }
    console.log(`Created missing seed auth user for ${email}.`);
    if (!SEED_USER_PASSWORD) {
      console.log(`Temporary seed password: ${generatedPassword}`);
    }
    return created.user.id;
  }
  return user.id;
}

async function clearDomainData(userId: string) {
  const tables = [
    "analytics_cache",
    "discipline_snapshots",
    "unlocks",
    "themes",
    "achievements",
    "notifications",
    "xp_events",
    "timers",
    "screen_logs",
    "relapse_logs",
    "daily_logs",
    "habits",
    "tasks"
  ] as const;
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) throw error;
  }
}

async function seed(userId: string) {
  await must(
    admin.from("users").upsert({
      id: userId,
      email: SEED_EMAIL,
      display_name: "LAAG Owner",
      timezone: "America/Los_Angeles"
    })
  );

  await must(
    admin.from("settings").upsert(
      {
        user_id: userId,
        xp_rules: defaultSettings.xp_rules,
        discipline_rules: defaultSettings.discipline_rules,
        notification_prefs: defaultSettings.notification_prefs,
        lock_mode: defaultSettings.lock_mode,
        brutal_truth_mode: defaultSettings.brutal_truth_mode,
        recovery_threshold: defaultSettings.recovery_threshold,
        strictness_profile: defaultSettings.strictness_profile
      },
      { onConflict: "user_id" }
    )
  );

  await clearDomainData(userId);

  const now = new Date();
  const iso = (offsetDays = 0) =>
    new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();
  const date = (offsetDays = 0) => iso(offsetDays).slice(0, 10);

  const tasks =
    (await must(
    admin
      .from("tasks")
      .insert([
        {
          user_id: userId,
          title: "Deep work sprint",
          description: "Two focused pomodoros on core project.",
          priority: "high",
          status: "todo",
          deadline_at: iso(0),
          xp_base: 10,
          xp_bonus: 20
        },
        {
          user_id: userId,
          title: "Strength training",
          description: "45 minute session.",
          priority: "medium",
          status: "todo",
          deadline_at: iso(1),
          xp_base: 10,
          xp_bonus: 0
        }
      ])
      .select("id")
  )) ?? [];

  await must(
    admin.from("habits").insert([
      {
        user_id: userId,
        name: "Morning deep work",
        frequency_per_week: 5,
        xp_per_completion: 15,
        current_streak: 3,
        longest_streak: 6,
        last_completed_on: date(-1)
      },
      {
        user_id: userId,
        name: "Workout",
        frequency_per_week: 4,
        xp_per_completion: 20,
        current_streak: 2,
        longest_streak: 5,
        last_completed_on: date(0)
      }
    ])
  );

  await must(
    admin.from("daily_logs").insert([
      {
        user_id: userId,
        log_date: date(-2),
        study_minutes: 180,
        workout_minutes: 45,
        sleep_hours: 6.8,
        screen_minutes: 210,
        mood: 6,
        productivity: 7,
        daily_log_completion: 1,
        edit_reason: "Seeded historical baseline log."
      },
      {
        user_id: userId,
        log_date: date(-1),
        study_minutes: 120,
        workout_minutes: 30,
        sleep_hours: 7.3,
        screen_minutes: 260,
        mood: 6,
        productivity: 6,
        daily_log_completion: 1,
        edit_reason: "Seeded historical baseline log."
      },
      {
        user_id: userId,
        log_date: date(0),
        study_minutes: 90,
        workout_minutes: 20,
        sleep_hours: 7.0,
        screen_minutes: 190,
        mood: 7,
        productivity: 7,
        daily_log_completion: 1
      }
    ])
  );

  await must(
    admin.from("screen_logs").insert([
      { user_id: userId, log_date: date(-2), source: "manual", minutes: 210 },
      { user_id: userId, log_date: date(-1), source: "manual", minutes: 260 },
      { user_id: userId, log_date: date(0), source: "manual", minutes: 190 }
    ])
  );

  await must(
    admin.from("timers").insert([
      {
        user_id: userId,
        session_type: "pomodoro",
        started_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date(now.getTime() - 2 * 60 * 60 * 1000 - 35 * 60 * 1000).toISOString(),
        duration_minutes: 25,
        completed: true,
        interruptions: 0,
        xp_awarded: 8
      }
    ])
  );

  await must(
    admin.from("xp_events").insert([
      {
        user_id: userId,
        source_type: "task_complete",
        source_id: (tasks as Array<{ id: string }>)[0]?.id ?? null,
        delta_xp: 30,
        reason: "Completed high priority task",
        tone_used: "motivational"
      },
      {
        user_id: userId,
        source_type: "penalty",
        delta_xp: -15,
        reason: "Screen threshold exceeded",
        tone_used: "brutal"
      }
    ])
  );

  await must(
    admin.from("notifications").insert([
      {
        user_id: userId,
        type: "task_deadline",
        tone: "brutal",
        title: "Deadline in 4 hours",
        body: "Deep work sprint is still open.",
        scheduled_for: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        escalation_level: 1
      },
      {
        user_id: userId,
        type: "daily_log_reminder",
        tone: "mother",
        title: "Daily log pending",
        body: "No excuses. Log your day before sleep.",
        scheduled_for: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        escalation_level: 2
      }
    ])
  );

  await must(
    admin.from("achievements").insert({
      user_id: userId,
      code: "TRUTH_001",
      title: "Truth Initiate",
      description: "Logged first uncomfortable correction.",
      meta: { category: "discipline" }
    })
  );

  await must(
    admin.from("themes").insert({
      user_id: userId,
      theme_key: "ember-steel",
      name: "Ember Steel",
      palette: { background: "#0f1115", primary: "#ef5a29" },
      is_active: true
    })
  );

  await must(
    admin.from("unlocks").insert({
      user_id: userId,
      unlock_type: "title",
      unlock_key: "Truth Apprentice"
    })
  );

  await must(
    admin.from("discipline_snapshots").insert([
      {
        user_id: userId,
        snapshot_date: date(-2),
        score: 61,
        completed_tasks: 2,
        total_tasks: 3,
        habit_consistency: 0.67,
        daily_log_completion: 1,
        burnout_index: 42,
        overconfidence_index: 18
      },
      {
        user_id: userId,
        snapshot_date: date(-1),
        score: 58,
        completed_tasks: 1,
        total_tasks: 3,
        habit_consistency: 0.5,
        daily_log_completion: 1,
        burnout_index: 49,
        overconfidence_index: 24
      },
      {
        user_id: userId,
        snapshot_date: date(0),
        score: 66,
        completed_tasks: 2,
        total_tasks: 3,
        habit_consistency: 0.67,
        daily_log_completion: 1,
        burnout_index: 37,
        overconfidence_index: 20
      }
    ])
  );

  await must(
    admin.from("analytics_cache").insert({
      user_id: userId,
      metric_key: "overview_30d",
      period_start: date(-30),
      period_end: date(0),
      payload: { seeded: true },
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      cache_version: 1
    })
  );
}

async function main() {
  const userId = await resolveUserIdByEmail(SEED_EMAIL!);
  await seed(userId);
  console.log(`Seed complete for ${SEED_EMAIL!} (${userId})`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exit(1);
});
