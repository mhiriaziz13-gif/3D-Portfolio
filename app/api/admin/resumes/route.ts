import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";
import { contentMutationSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true, sameOrigin: false });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("CMS server configuration is incomplete.", 500, "server_error");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("resumes").select("*").order("sort_order", { ascending: true });
  if (error) return jsonError("Could not load resumes.", 500, "server_error");
  return jsonOk({ resumes: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("CMS server configuration is incomplete.", 500, "server_error");

  const parsed = contentMutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.values) return jsonError("Invalid resume mutation.", 400, "validation_error");

  const supabase = createSupabaseAdminClient();
  const row = parsed.data.values;
  const { data, error } = await supabase.from("resumes").upsert(row).select("*").single();
  if (error) return jsonError("Could not save resume.", 500, "server_error");

  await writeAdminAudit({ actorUserId: admin.user.id, action: "cms_content_updated", entityType: "resumes", entityId: String(row.id ?? data?.id ?? ""), request });
  return jsonOk({ resume: data });
}
