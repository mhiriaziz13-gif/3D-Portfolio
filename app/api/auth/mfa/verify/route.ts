import { NextResponse } from "next/server";

import {
  createRememberedDevice,
  setRememberDeviceCookie,
  requireAdminApi,
  writeAdminAudit,
} from "@/lib/security/admin-auth";
import { jsonError, jsonHeaders } from "@/lib/security/http";
import { mfaVerifySchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: false });
  if (!admin.ok) return admin.response;

  const parsed = mfaVerifySchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError("Invalid authenticator code.", 400);
  }

  const { data, error } = await admin.supabase.auth.mfa.challengeAndVerify({
    factorId: parsed.data.factorId,
    code: parsed.data.code,
  });

  if (error || !data) {
    await writeAdminAudit({ actorUserId: admin.user.id, action: "mfa_verify_failure", entityId: parsed.data.factorId, request });
    return jsonError("Invalid authenticator code.", 401);
  }

  const response = NextResponse.json(
    { ok: true, redirectTo: "/admin" },
    { headers: jsonHeaders },
  );

  if (parsed.data.rememberDevice) {
    const remembered = await createRememberedDevice(admin.user.id, request);
    if (remembered) {
      setRememberDeviceCookie(response, remembered.token, remembered.expiresAt);
      await writeAdminAudit({ actorUserId: admin.user.id, action: "remembered_device_created", request });
    }
  }

  await writeAdminAudit({ actorUserId: admin.user.id, action: "mfa_verify_success", entityId: parsed.data.factorId, request });
  return response;
}