import { requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";
import { mfaRemoveSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: false });
  if (!admin.ok) return admin.response;

  const parsed = mfaRemoveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid MFA request.", 400);
  }

  const mfa = await admin.supabase.auth.mfa.listFactors();
  const factorIsVerified = Boolean(mfa.data?.totp?.some((factor) => factor.id === parsed.data.factorId));

  if (factorIsVerified && !parsed.data.code) {
    return jsonError("Current authenticator code is required to remove MFA.", 400);
  }

  if (factorIsVerified && parsed.data.code) {
    const verified = await admin.supabase.auth.mfa.challengeAndVerify({
      factorId: parsed.data.factorId,
      code: parsed.data.code,
    });

    if (verified.error) {
      await writeAdminAudit({ actorUserId: admin.user.id, action: "mfa_verify_failure", entityId: parsed.data.factorId, request });
      return jsonError("Invalid authenticator code.", 401);
    }
  }

  const { error } = await admin.supabase.auth.mfa.unenroll({ factorId: parsed.data.factorId });
  if (error) {
    return jsonError("Could not remove MFA factor.", 500);
  }

  await writeAdminAudit({ actorUserId: admin.user.id, action: "mfa_factor_removed", entityId: parsed.data.factorId, request });
  return jsonOk({ message: "MFA factor removed." });
}