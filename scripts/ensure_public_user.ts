import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually load .env.local
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
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

async function ensurePublicUserRecord() {
    console.log("Ensuring public.users record exists...");

    const { error } = await supabase.from("users").upsert({
        id: ADMIN_ID,
        email: "admin@local",
        display_name: "Admin User",
        timezone: "America/Los_Angeles"
    });

    if (error) {
        console.error("Failed:", error);
        process.exit(1);
    }

    console.log("✓ User record ensured in public.users");
}

ensurePublicUserRecord();
