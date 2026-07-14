import { NextResponse } from "next/server";

import {
  clearRememberDeviceCookie,
  getAuthenticatedAdmin,
  writeAdminAudit,
} from "@/lib/security/admin-auth";
import { isSameOrigin, jsonError } from "@/lib/security/http";
import { safeRedirect } from "@/lib/security/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError("Request origin is not allowed.", 403, "origin_not_allowed");
  }

  const admin = await getAuthenticatedAdmin(request);
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  if (admin?.user) {
    await writeAdminAudit({
      actorUserId: admin.user.id,
      action: "logout",
      request,
    });
  }

  const url = new URL(request.url);

  const next = safeRedirect(
    url.searchParams.get("next"),
    "/admin/login",
  );

  const response = NextResponse.redirect(
    new URL(next, url.origin),
    303,
  );

  clearRememberDeviceCookie(response);

  return response;
}
