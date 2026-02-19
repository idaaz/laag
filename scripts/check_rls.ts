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

async function checkRLS() {
    console.log("Checking RLS status...");
    const { data, error } = await supabase.rpc('check_rls_status', {}); // Custom RPC needed? Or just query pg_tables

    // Since I can't easily create an RPC without migrations, I'll try to insert with ANON key.
    // Test with ANON key:
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!ANON_KEY) return;

    const anonClient = createClient(SUPABASE_URL as string, ANON_KEY);
    console.log("Testing insert with ANON key...");
    const { error: anonError } = await anonClient.from("habits").insert({
        user_id: "27161a3b-9776-4484-b614-6ca6c18f2403",
        name: "Anon Test " + Date.now(),
    });

    if (anonError) {
        console.error("ANON insert failed (RLS likely still ON):", anonError);
    } else {
        console.log("ANON insert success (RLS is OFF)");
    }
}

checkRLS();
