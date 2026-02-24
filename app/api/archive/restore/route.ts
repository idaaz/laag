import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { deleteFileFromGitHub, ArchiveType } from "@/lib/github/archive";

const MOCK_USER_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

export async function POST(req: NextRequest) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || MOCK_USER_ID;

        const { type, item, githubMeta } = await req.json() as {
            type: ArchiveType,
            item: Record<string, unknown>,
            githubMeta: { path: string, sha: string }
        };

        if (!type || !item) {
            return NextResponse.json({ error: "Missing restoration data" }, { status: 400 });
        }

        // 1. Identify table and prep data
        const itemObj = item as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { archived: _archived, ...rest } = itemObj;

        const insertData: Record<string, unknown> = {
            ...rest,
            user_id: userId,
            ...(type === "habits" ? { is_active: true } : {})
        };

        const tableMap: Record<string, string> = {
            tasks: "tasks",
            habits: "habits",
            notes: "vision_notes"
        };
        const table = tableMap[type];

        if (!table) {
            return NextResponse.json({ error: "Restoration for this type is not yet supported" }, { status: 400 });
        }

        // 2. Insert into Supabase (using upsert to avoid duplicate IDs if they exist)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: dbError } = await (supabase.from(table) as any)
            .upsert(insertData);

        if (dbError) {
            console.error(`Restoration DB Error (${table}):`, dbError);
            return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
        }

        // 3. Clean up GitHub (only if it was an individual archival, not a batch sync)
        // Batch sync paths usually contain "sync" or specific date patterns. 
        // For individual archivals, they are usually in the format .../filename.json
        // We'll attempt deletion only if the path isn't a batch file.
        const isBatch = githubMeta.path.includes("_sync_") || /\d{4}-\d{2}/.test(githubMeta.path);

        if (!isBatch && githubMeta.path && githubMeta.sha) {
            await deleteFileFromGitHub(githubMeta.path, githubMeta.sha);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
