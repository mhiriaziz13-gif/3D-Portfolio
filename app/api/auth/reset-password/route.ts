import { NextResponse } from "next/server";

import { clearRememberDeviceCookie, revokeAllRememberedDevices, writeAdminAudit } from "@/lib/security/admin-auth";
import { assertSameOrigin, jsonError, jsonHeaders } from "@/lib/security/http";
import { resetPasswordSchema } from "@/lib/security/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = resetPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Choose a stronger password.", 400);
    }

    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      return jsonError("Recovery session is missing.", 401);
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return jsonError("Password could not be updated.", 400);
    }

    await revokeAllRememberedDevices(user.id);
    await writeAdminAudit({ actorUserId: user.id, action: "password_reset_completed", request });
    await supabase.auth.signOut({ scope: "global" });

    const response = NextResponse.json(
      { ok: true, redirectTo: "/admin/login?reset=success" },
      { headers: jsonHeaders },
    );
    clearRememberDeviceCookie(response);
    return response;
  } catch {
    return jsonError("Password could not be updated.", 400);
  }
}