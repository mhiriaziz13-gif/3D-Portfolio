import { NextResponse } from "next/server";

import { getMfaContext, isAdminUser, writeAdminAudit } from "@/lib/security/admin-auth";
import { safeRedirect } from "@/lib/security/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const loginError = (origin: string, code: string) =>
  NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(code)}`, origin));

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = safeRedirect(requestUrl.searchParams.get("next"), "/admin");
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return loginError(requestUrl.origin, "callback");
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
    });
    if (error) return loginError(requestUrl.origin, type === "recovery" ? "recovery" : "callback");
  } else {
    return loginError(requestUrl.origin, "callback");
  }

  if (next.startsWith("/admin/reset-password")) {
    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
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
