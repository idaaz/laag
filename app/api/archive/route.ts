import { NextRequest, NextResponse } from "next/server";
import { archiveToGitHub, ArchiveType } from "@/lib/github/archive";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MOCK_USER_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

export async function POST(req: NextRequest) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Fallback to mock user for Open Access if real session is missing
        const userId = user?.id || MOCK_USER_ID;

        const body = (await req.json()) as { type: ArchiveType; filename: string; payload: unknown; subfolder?: string };
        const { type, filename, payload, subfolder } = body;

        if (!type || !filename || !payload) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const success = await archiveToGitHub(userId, type, filename, payload, subfolder);
        if (!success) {
            return NextResponse.json({ error: "Failed to archive to GitHub" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await getSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Fallback to mock user for Open Access if real session is missing
        const userId = user?.id || MOCK_USER_ID;

        const type = req.nextUrl.searchParams.get("type") as ArchiveType;
        if (!type) {
            return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });
        }

        const { fetchArchivedFromGitHub } = await import("@/lib/github/archive");
        const data = await fetchArchivedFromGitHub(userId, type);

        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
