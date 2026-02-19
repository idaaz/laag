import Papa from "papaparse";
import { TABLE_EXPORT_ORDER } from "@/lib/constants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ExportPayload = Record<string, unknown[]>;

export async function estimateExportSizeBytes(userId: string) {
  const supabase = getSupabaseBrowserClient();
  let totalRows = 0;

  for (const table of TABLE_EXPORT_ORDER) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(table === "users" ? "id" : "user_id", userId);
    totalRows += count ?? 0;
  }

  return totalRows * 280;
}

export async function exportUserDataAsCsv(userId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const payload: ExportPayload = {};

  for (const table of TABLE_EXPORT_ORDER) {
    const query = supabase
      .from(table)
      .select("*")
      .eq(table === "users" ? "id" : "user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    payload[table] = data ?? [];
  }

  const chunks: string[] = [];
  chunks.push(`# LAAG export generated at ${new Date().toISOString()}`);

  for (const table of TABLE_EXPORT_ORDER) {
    chunks.push("");
    chunks.push(`## ${table}`);
    chunks.push(Papa.unparse(payload[table] ?? []));
  }

  chunks.push("");
  chunks.push(`# End of export. timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  return chunks.join("\n");
}
