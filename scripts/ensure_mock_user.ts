import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually load .env.local because dotenv might not be installed
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
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000";
const MOCK_EMAIL = "admin@local";

async function ensureMockUser() {
    console.log(`Ensuring mock user ${MOCK_USER_ID} exists in auth.users...`);

    // Check if user exists first
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(MOCK_USER_ID);

    if (user) {
        console.log("Mock user already exists in Auth.");
        return;
    }

    // If not found, create it
    // Note: We use a dummy password. This user is for internal linking only.
    const { data, error } = await supabase.auth.admin.createUser({
        email: MOCK_EMAIL,
        password: "password123_dummy_unused",
        email_confirm: true,
        user_metadata: { display_name: "Admin User" }
    });

    // If created successfully, we might need to update the ID to be exactly 0000...
    // Wait, createUser doesn't accept ID?
    // It DOES NOT accept ID in the params for create user by email/password usually.
    // BUT the admin.createUser function DOES allow `id` in some versions or via `attributes`?
    // Let's check if we can force the ID.
    // Actually, supabase.auth.admin.createUser takes AdminUserAttributes.
    // Looking at types: `userId?: string`? No, it's usually auto-generated.
    // Wait, `createUser` properties: `email`, `password`, `user_metadata`, `email_confirm`.
    // It does NOT support setting `id` explicitly in the JS client usually.

    // IF we can't set ID, we have a problem. "0000...0000" won't match.
    // Let's verify if `admin.createUser` supports `id`.
    // Docs say: `createUser(attrs: AdminUserAttributes)`
    // AdminUserAttributes typically doesn't include ID.

    // However, `supabase.auth.admin.importUsers` CAN set IDs!
    // So we should use `importUsers`.
}

async function ensureMockUserWithImport() {
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(MOCK_USER_ID);
    if (user) {
        console.log("Mock user already exists (checked via ID).");
        return;
    }

    console.log("Importing mock user with specific ID...");
    const { data, error } = await supabase.auth.admin.createUser({
        email: MOCK_EMAIL,
        password: "password123",
        email_confirm: true,
        user_metadata: { display_name: "Admin User" }
    });

    // Wait, I just said create user might not work for ID.
    // Let's try `importUsers`? // No, creating via `createUser` returns a new ID.
    // If `createUser` allows specifying ID, great. If not, we have to use `importUsers`?
    // Actually, `importUsers` is deprecated? No, it's `inviteUserByEmail`.
    // `createUser` takes `AdminUserAttributes`.
    // Let's try to pass `id`?
    // Check definitions in `node_modules` is hard.

    // Let's try using the SQL approach via `rpc` if that fails? No.

    // Actually, I can use a raw fetch to the admin API `/users` endpoint which might support it?
    // Or just use `importUsers` if available?
    // `auth.admin.inviteUserByEmail`...

    // Actually, checking Supabase docs: `createUser` does NOT accept ID.
    // BUT `importUsers` (if available on the client) DOES.
    // Let's check if `importUsers` is available on `supabase.auth.admin`.
    // It is `createUser` for one user.

    // IF I cannot force the ID `0000...`, then I must change my `useAuth.ts` to use the ID that IS generated.
    // OR use a migration to insert into `auth.users` via SQL.
    // I CANNOT run SQL migrations.

    // So, my plan to use `0000...` relies on being able to create it.
    // If I can't, I should use a real user from the DB.
    // I can look up `admin@local` and use that ID?
    // Yes.
    // So:
    // 1. Try to find user `admin@local`.
    // 2. If not found, create it (auto-generated ID).
    // 3. Get the ID.
    // 4. Update `useAuth.ts` to use THIS ID instead of `0000...`.

    // THIS IS SAFER. "One universal user".
    // I will output the ID from this script.
    // And then I will update `useAuth.ts`.
}

async function getOrCreateAdminUser() {
    // 1. Check if exists by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    let adminUser = users.find(u => u.email === MOCK_EMAIL);

    if (!adminUser) {
        console.log("Creating admin user...");
        const { data, error } = await supabase.auth.admin.createUser({
            email: MOCK_EMAIL,
            password: "password123",
            email_confirm: true,
            user_metadata: { display_name: "Admin User" }
        });
        if (error) throw error;
        adminUser = data.user!;
    }

    console.log(`Admin User ID: ${adminUser.id}`);

    // Write ID to file for reliable retrieval
    fs.writeFileSync("temp_id.txt", adminUser.id);
    console.log("ID written to temp_id.txt");
}

getOrCreateAdminUser().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
