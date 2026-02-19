import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Use the existing ADMIN_ID found in other scripts
const ADMIN_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomBoolean = () => Math.random() > 0.5;

async function seedHabits() {
    console.log("Seeding Habits...");
    const habits = [];
    for (let i = 0; i < 100; i++) {
        habits.push({
            user_id: ADMIN_ID,
            name: `Habit ${i + 1} - ${randomChoice(['Read', 'Run', 'Code', 'Meditate', 'Journal'])}`,
            frequency_per_week: randomInt(1, 7),
            xp_per_completion: randomInt(5, 50),
            current_streak: randomInt(0, 50),
            longest_streak: randomInt(0, 100),
            relapse_count: randomInt(0, 10),
            is_active: randomBoolean()
        });
    }

    // Insert in chunks to avoid request size limits if any
    const { error } = await supabase.from("habits").insert(habits);
    if (error) console.error("Error inserting habits:", error);
    else console.log(`Inserted ${habits.length} habits.`);
}

async function seedTasks() {
    console.log("Seeding Tasks...");
    const tasks = [];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['todo', 'in_progress', 'completed', 'archived'];

    for (let i = 0; i < 100; i++) {
        // Random date in the next 30 days or past 30 days
        const dateOffset = randomInt(-30, 30);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + dateOffset);

        tasks.push({
            user_id: ADMIN_ID,
            title: `Task ${i + 1} - ${randomChoice(['Fix Bug', 'Write Docs', 'Refactor', 'Design UI'])}`,
            description: `Auto-generated description for task ${i + 1}`,
            priority: randomChoice(priorities),
            status: randomChoice(statuses),
            deadline_at: deadline.toISOString(),
            xp_base: randomInt(10, 100),
            is_flagged: randomBoolean()
        });
    }

    const { error } = await supabase.from("tasks").insert(tasks);
    if (error) console.error("Error inserting tasks:", error);
    else console.log(`Inserted ${tasks.length} tasks.`);
}

async function seedLogs() {
    console.log("Seeding Daily Logs...");
    const logs = [];
    const today = new Date();

    // Generate logs for the last 100 days
    for (let i = 0; i < 100; i++) {
        const logDate = new Date(today);
        logDate.setDate(today.getDate() - i);
        const dateStr = logDate.toISOString().split('T')[0];

        // Since we're generating logs for past dates, all need edit_reason per trigger
        logs.push({
            user_id: ADMIN_ID,
            log_date: dateStr,
            study_minutes: randomInt(0, 480),
            workout_minutes: randomInt(0, 120),
            sleep_hours: Number(randomFloat(4, 10).toFixed(2)),
            screen_minutes: randomInt(60, 600),
            mood: randomInt(1, 10),
            productivity: randomInt(1, 10),
            daily_log_completion: Number(randomFloat(0.5, 1).toFixed(2)),
            journal_ciphertext: "dummy_encrypted_content",
            edit_reason: "Dummy data seeding for testing"
        });
    }

    // Upsert to handle potential conflicts if ran multiple times or if logs exist
    const { error } = await supabase.from("daily_logs").upsert(logs, { onConflict: 'user_id, log_date' });
    if (error) console.error("Error inserting logs:", error);
    else console.log(`Inserted ${logs.length} daily logs.`);
}

async function seedTracking() {
    console.log("Seeding Visited URLs...");
    const urls = [];
    const domains = ['google.com', 'youtube.com', 'github.com', 'stackoverflow.com', 'localhost'];

    for (let i = 0; i < 100; i++) {
        const domain = randomChoice(domains);
        const isVideo = domain === 'youtube.com';
        const watchTime = isVideo ? randomInt(60, 3600) : 0;

        urls.push({
            user_id: ADMIN_ID,
            url: `https://${domain}/page/${i}`,
            title: `Page Title ${i}`,
            watch_time_seconds: watchTime,
            video_start_time: isVideo ? 0 : null,
            video_end_time: isVideo ? watchTime : null,
            visited_at: new Date(Date.now() - randomInt(0, 10000000)).toISOString()
        });
    }

    const { error } = await supabase.from("visited_urls").insert(urls);
    if (error) console.error("Error inserting visited_urls:", error);
    else console.log(`Inserted ${urls.length} visited URLs.`);
}

async function run() {
    console.log("Starting Dummy Data Generation...");
    await seedHabits();
    await seedTasks();
    await seedLogs();
    await seedTracking();
    console.log("Done.");
}

run();
