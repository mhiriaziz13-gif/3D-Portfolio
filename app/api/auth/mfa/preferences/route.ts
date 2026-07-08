import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, requireAdminMfa } from "@/lib/supabase/config";
import { getMfaContext, requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";
import { mfaPreferenceSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: false });
  if (!admin.ok) return admin.response;

  if (!isSupabaseAdminConfigured()) {
    return jsonError("Supabase service role is not configured.", 503);
  }

  const parsed = mfaPreferenceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid security preferences.", 400);
  }

  const current = await getMfaContext(admin.supabase, admin.user.id, request);
  if (current.mfaRequired && !parsed.data.mfaRequired && !current.mfaSatisfied) {
    return jsonError("Verify MFA before disabling MFA requirement.", 403);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("admin_security_preferences").upsert({
    user_id: admin.user.id,
    mfa_required: requireAdminMfa() ? true : parsed.data.mfaRequired,
    remember_device_enabled: parsed.data.rememberDeviceEnabled,
  });

  if (error) {
    return jsonError("Could not save security preferences.", 500);
  }

  await writeAdminAudit({
    actorUserId: admin.user.id,
    action: parsed.data.mfaRequired ? "mfa_enabled" : "mfa_disabled",
    request,
  });

  return jsonOk({ message: "Security preferences saved." });
}