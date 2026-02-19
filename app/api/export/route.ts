import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TABLE_EXPORT_ORDER } from "@/lib/constants";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chunks: string[] = [`# LAAG export ${new Date().toISOString()}`];
  for (const table of TABLE_EXPORT_ORDER) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(table === "users" ? "id" : "user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    chunks.push(`\n## ${table}\n${Papa.unparse(data ?? [])}`);
  }

  return new NextResponse(chunks.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=laag-export-${new Date().toISOString().slice(0, 10)}.csv`
    }
  });
}
