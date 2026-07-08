import { NextResponse } from "next/server";

import { clearRememberDeviceCookie, getAuthenticatedAdmin, writeAdminAudit } from "@/lib/security/admin-auth";
import { safeRedirect } from "@/lib/security/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const logout = async (request: Request) => {
  const admin = await getAuthenticatedAdmin(request);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  if (admin?.user) {
    await writeAdminAudit({ actorUserId: admin.user.id, action: "logout", request });
  }

  const url = new URL(request.url);
  const next = safeRedirect(url.searchParams.get("next"), "/admin/login");
  const response = NextResponse.redirect(new URL(next, url.origin));
  clearRememberDeviceCookie(response);
  return response;
};

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}