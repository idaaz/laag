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
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(url, key);

async function debugNotes() {
    console.log("Fetching all vision_notes via service role...");
    const { data, error } = await supabase.from("vision_notes").select("*");
    if (error) {
        console.error("Error fetching notes:", error);
    } else {
        console.log(`Found ${data.length} notes:`);
        data.forEach(n => console.log(`- [${n.id}] ${n.title} (user_id: ${n.user_id}, archived: ${n.archived})`));
    }

    console.log("\nTesting SELECT with ANON key...");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) {
        const anonClient = createClient(url!, anon);
        const { data: anonData, error: anonError } = await anonClient.from("vision_notes").select("*");
        if (anonError) {
            console.error("ANON SELECT failed:", anonError.message);
        } else {
            console.log(`ANON SELECT found ${anonData.length} records.`);
        }
    }
}

debugNotes();
