import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(url, key);
const HARDCODED_USER_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

const TABLES = [
    "tasks",
    "habits",
    "daily_logs",
    "time_blocks",
    "xp_events",
    "vision_notes",
    "notifications",
    "achievements",
    "user_kpis"
];

async function clearAll() {
    console.log(`Starting cleanup for user ${HARDCODED_USER_ID}...`);

    for (const table of TABLES) {
        const { error, count } = await supabase
            .from(table)
            .delete()
            .eq("user_id", HARDCODED_USER_ID);

        if (error) {
            console.error(`Error clearing ${table}:`, error.message);
        } else {
            console.log(`Cleared table: ${table}`);
        }
    }

    console.log("Cleanup complete! 🚀");
}

clearAll();
