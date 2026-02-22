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
const supabase = createClient(url!, key!);

async function run() {
    const { data: notes } = await supabase.from("vision_notes").select("*");
    console.log("TOTAL_DATABASE_NOTES_COUNT:", notes?.length || 0);
    if (notes) {
        notes.forEach(n => {
            console.log(`NOTE: id=${n.id} title=${n.title} user=${n.user_id} archived=${n.archived} pinned=${n.pinned}`);
        });
    }

    const { data: anonNotes, error: anonError } = await createClient(url!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).from("vision_notes").select("*");
    console.log("ANON_SELECT_COUNT:", anonNotes?.length || 0);
    if (anonError) console.log("ANON_SELECT_ERROR:", anonError.message);
}

run();
