import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

const USER_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

// GET /api/tracking/custom-rules
export async function GET() {
    try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from("tracking_custom_rules")
            .select("*")
            .eq("user_id", USER_ID)
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data: data ?? [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/tracking/custom-rules
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url_prefix, name } = body;

        if (!url_prefix || !name) {
            return NextResponse.json({ error: "url_prefix and name are required" }, { status: 400 });
        }

        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from("tracking_custom_rules")
            .insert([{ user_id: USER_ID, url_prefix, name }])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE /api/tracking/custom-rules?id=<ruleId>
export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const supabase = getAdminClient();
        const { error } = await supabase
            .from("tracking_custom_rules")
            .delete()
            .eq("id", id)
            .eq("user_id", USER_ID);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
