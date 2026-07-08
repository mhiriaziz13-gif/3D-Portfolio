import { requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: false });
  if (!admin.ok) return admin.response;

  const { data, error } = await admin.supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Ahmed portfolio admin",
  });

  if (error || !data || data.type !== "totp") {
    return jsonError("Could not enroll authenticator.", 500);
  }

  await writeAdminAudit({ actorUserId: admin.user.id, action: "mfa_factor_enrolled", entityId: data.id, request });

  return jsonOk({
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  });
}