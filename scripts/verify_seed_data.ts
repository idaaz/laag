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

const ADMIN_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

async function verifyCounts() {
    console.log("Verifying data counts for user:", ADMIN_ID);
    console.log("=".repeat(50));

    const tables = [
        { name: "habits", column: "user_id" },
        { name: "tasks", column: "user_id" },
        { name: "daily_logs", column: "user_id" },
        { name: "visited_urls", column: "user_id" }
    ];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table.name)
            .select("*", { count: "exact", head: true })
            .eq(table.column, ADMIN_ID);

        if (error) {
            console.error(`Error counting ${table.name}:`, error);
        } else {
            console.log(`${table.name.padEnd(20)}: ${count} records`);
        }
    }
}

verifyCounts();
