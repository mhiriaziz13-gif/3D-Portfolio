import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";
import { contentMutationSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true, sameOrigin: false });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("Supabase service role is not configured.", 503);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("resumes").select("*").order("sort_order", { ascending: true });
  if (error) return jsonError("Could not load resumes.", 500);
  return jsonOk({ resumes: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("Supabase service role is not configured.", 503);

  const parsed = contentMutationSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.values) return jsonError("Invalid resume mutation.", 400);

  const supabase = createSupabaseAdminClient();
  const row = parsed.data.values;
  const { data, error } = await supabase.from("resumes").upsert(row).select("*").single();
  if (error) return jsonError("Could not save resume.", 500);

  await writeAdminAudit({ actorUserId: admin.user.id, action: "cms_content_updated", entityType: "resumes", entityId: String(row.id ?? data?.id ?? ""), request });
  return jsonOk({ resume: data });
}