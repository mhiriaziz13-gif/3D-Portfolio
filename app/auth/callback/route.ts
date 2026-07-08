import { NextResponse } from "next/server";

import { getMfaContext, isAdminUser, writeAdminAudit } from "@/lib/security/admin-auth";
import { safeRedirect } from "@/lib/security/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirect(requestUrl.searchParams.get("next"), "/admin");

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=callback", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/admin/login?error=callback", requestUrl.origin));
  }

  if (next.startsWith("/admin/reset-password")) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  if (next.startsWith("/admin")) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    const admin = user ? await isAdminUser(user.id) : false;

    if (!user || !admin) {
      await supabase.auth.signOut();
      await writeAdminAudit({ actorUserId: user?.id ?? null, action: "oauth_login_failure", metadata: { reason: "non_admin" }, request });
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", requestUrl.origin));
    }

    const mfa = await getMfaContext(supabase, user.id, request);
    if (mfa.mfaRequired && !mfa.mfaSatisfied) {
      await writeAdminAudit({ actorUserId: user.id, action: "mfa_challenge_required", request });
      if (!mfa.verifiedFactors.length) {
        return NextResponse.redirect(new URL("/admin/security?setup=mfa", requestUrl.origin));
      }
      return NextResponse.redirect(new URL(`/admin/login?mfa=required&next=${encodeURIComponent(next)}`, requestUrl.origin));
    }

    await writeAdminAudit({ actorUserId: user.id, action: "oauth_login_success", request });
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}