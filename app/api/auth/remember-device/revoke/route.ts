import { NextResponse } from "next/server";

import {
  clearRememberDeviceCookie,
  requireAdminApi,
  revokeAllRememberedDevices,
  revokeRememberedDevice,
  writeAdminAudit,
} from "@/lib/security/admin-auth";
import { jsonError, jsonHeaders } from "@/lib/security/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid().optional(),
  all: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: false });
  if (!admin.ok) return admin.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid remembered device request.", 400);

  if (parsed.data.all) {
    await revokeAllRememberedDevices(admin.user.id);
    await writeAdminAudit({ actorUserId: admin.user.id, action: "remembered_devices_revoked_all", request });
  } else if (parsed.data.id) {
    await revokeRememberedDevice(admin.user.id, parsed.data.id);
    await writeAdminAudit({ actorUserId: admin.user.id, action: "remembered_device_revoked", entityId: parsed.data.id, request });
  } else {
    return jsonError("Device id is required.", 400);
  }

  const response = NextResponse.json({ ok: true, message: "Remembered device revoked." }, { headers: jsonHeaders });
  clearRememberDeviceCookie(response);
  return response;
}