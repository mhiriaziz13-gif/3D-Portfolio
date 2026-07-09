import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getMfaContext, requireAdminApi } from "@/lib/security/admin-auth";
import { jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminApi(request, { sameOrigin: false });
  if (!admin.ok) return admin.response;

  const mfa = await getMfaContext(admin.supabase, admin.user.id, request);
  let devices: unknown[] = [];

  if (isSupabaseAdminConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("admin_remembered_devices")
      .select("id, user_agent_hash, ip_hash, created_at, last_used_at, expires_at, revoked_at")
      .eq("user_id", admin.user.id)
      .order("created_at", { ascending: false });
    devices = data ?? [];
  }

  return jsonOk({
    email: admin.user.email,
    aal: mfa.aal,
    factors: mfa.factors,
    mfaRequired: mfa.mfaRequired,
    mfaSatisfied: mfa.mfaSatisfied,
    rememberDeviceEnabled: mfa.rememberDeviceEnabled,
    remembered: mfa.remembered,
    devices,
  });
}