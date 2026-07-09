import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getAdminContentSnapshot, isCmsTableName } from "@/lib/cms";
import { requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";
import { contentMutationSchema, isEditableCmsTable, validateCmsRow } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true, sameOrigin: false });
  if (!admin.ok) return admin.response;

  if (!isSupabaseAdminConfigured()) {
    return jsonError("CMS server configuration is incomplete.", 500, "server_error");
  }

  const url = new URL(request.url);
  const table = url.searchParams.get("table");

  if (table) {
    if (!isCmsTableName(table)) return jsonError("Unknown CMS table.", 400, "validation_error");
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from(table).select("*").limit(500);
    if (error) return jsonError("Could not load CMS content.", 500, "server_error");
    return jsonOk({ table, rows: data ?? [] });
  }

  const snapshot = await getAdminContentSnapshot();
  return jsonOk({ content: snapshot });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;

  if (!isSupabaseAdminConfigured()) {
    return jsonError("CMS server configuration is incomplete.", 500, "server_error");
  }

  const parsed = contentMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.values || !isEditableCmsTable(parsed.data.table)) {
    return jsonError("Invalid CMS mutation.", 400, "validation_error");
  }

  const validated = validateCmsRow(parsed.data.table, parsed.data.values);
  if (!validated.success) return jsonError(validated.error.issues[0]?.message ?? "Invalid CMS fields.", 400, "validation_error");
  const row = validated.data;
  const supabase = createSupabaseAdminClient();
  const query = row.id || row.key
    ? supabase.from(parsed.data.table).upsert(row).select("*").single()
    : supabase.from(parsed.data.table).insert(row).select("*").single();

  const { data, error } = await query;
  if (error) return jsonError("Could not save CMS content.", 500, "server_error");

  await writeAdminAudit({
    actorUserId: admin.user.id,
    action: row.id || row.key ? "cms_content_updated" : "cms_content_created",
    entityType: parsed.data.table,
    entityId: String(row.id ?? row.key ?? data?.id ?? ""),
    request,
  });

  return jsonOk({ row: data });
}

export async function PUT(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;

  if (!isSupabaseAdminConfigured()) {
    return jsonError("CMS server configuration is incomplete.", 500, "server_error");
  }

  const parsed = contentMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.rows || !isEditableCmsTable(parsed.data.table)) {
    return jsonError("Invalid CMS bulk mutation.", 400, "validation_error");
  }

  const table = parsed.data.table;
  const validatedRows = parsed.data.rows.map((row: Record<string, unknown>) => validateCmsRow(table, row));
  const invalid = validatedRows.find((row) => !row.success);
  if (invalid && !invalid.success) return jsonError(invalid.error.issues[0]?.message ?? "Invalid CMS fields.", 400, "validation_error");
  const rows = validatedRows.flatMap((row) => row.success ? [row.data] : []);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(table).upsert(rows).select("*");
  if (error) return jsonError("Could not save CMS content.", 500, "server_error");

  await writeAdminAudit({
    actorUserId: admin.user.id,
    action: "cms_content_updated",
    entityType: table,
    metadata: { count: rows.length },
    request,
  });

  return jsonOk({ rows: data ?? [] });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;

  if (!isSupabaseAdminConfigured()) {
    return jsonError("CMS server configuration is incomplete.", 500, "server_error");
  }

  const parsed = contentMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.id || !isEditableCmsTable(parsed.data.table)) {
    return jsonError("Invalid CMS delete.", 400, "validation_error");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(parsed.data.table).delete().eq("id", parsed.data.id);
  if (error) return jsonError("Could not delete CMS content.", 500, "server_error");

  await writeAdminAudit({
    actorUserId: admin.user.id,
    action: "cms_content_deleted",
    entityType: parsed.data.table,
    entityId: parsed.data.id,
    request,
  });

  return jsonOk({ message: "Deleted." });
}
