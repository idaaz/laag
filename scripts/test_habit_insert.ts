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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ADMIN_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

async function testInsert() {
    console.log("Testing habit insert for ADMIN_ID...");
    const { data, error } = await supabase.from("habits").insert({
        user_id: ADMIN_ID,
        name: "Test Habit " + Date.now(),
        frequency_per_week: 5,
        xp_per_completion: 12,
        current_streak: 0,
        longest_streak: 0,
        relapse_count: 0,
        is_active: true
    }).select();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert success:", data);
    }
}

testInsert();
