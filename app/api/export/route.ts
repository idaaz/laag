import { NextResponse } from "next/server";
import Papa from "papaparse";
import { getAdminClient, withRetry } from "@/lib/supabase/admin";
import { TABLE_EXPORT_ORDER } from "@/lib/constants";

// Open Access: hardcoded admin user ID
const OPEN_ACCESS_USER_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

export async function GET() {
  const supabase = getAdminClient();

  const chunks: string[] = [`# LAAG export ${new Date().toISOString()}`];
  for (const table of TABLE_EXPORT_ORDER) {
    const { data, error } = await withRetry(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from(table)
        .select("*")
        .eq(table === "users" ? "id" : "user_id", OPEN_ACCESS_USER_ID)
    );

    if (error) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ error: message }, { status: 400 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunks.push(`\n## ${table}\n${Papa.unparse((data as any[]) ?? [])}`);
  }

  return new NextResponse(chunks.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=laag-export-${new Date().toISOString().slice(0, 10)}.csv`
    }
  });
}
