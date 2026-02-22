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
    const { data: notes, error } = await supabase.from("vision_notes").select("id, title, user_id");

    if (error) {
        console.error("DUMP_NOTES_ERROR:", error);
    }

    console.log("DUMPING_NOTES_START");
    if (notes) {
        console.log(`FOUND_NOTES_COUNT:${notes.length}`);
        notes.forEach(n => {
            console.log(`JSON_NOTE:${JSON.stringify(n)}`);
        });
    }
    console.log("DUMPING_NOTES_END");
}

run();
