import { NextResponse } from "next/server";

import { getAdminMembership, getMfaContext, writeAdminAudit } from "@/lib/security/admin-auth";
import { safeRedirect } from "@/lib/security/redirects";
import { requireAdminMfa } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const loginError = (origin: string, code: string) =>
  NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(code)}`, origin));

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const providerError = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = safeRedirect(requestUrl.searchParams.get("next"), "/admin");
  if (providerError) {
    return loginError(requestUrl.origin, "github_oauth_failed");
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return loginError(requestUrl.origin, "supabase_config");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return loginError(
        requestUrl.origin,
        next.startsWith("/admin/reset-password") ? "recovery" : "callback",
      );
    }
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
    const membership = user ? await getAdminMembership(user.id) : null;

    if (!user || !membership || membership.status !== "admin") {
      await supabase.auth.signOut();
      const reason = membership?.status === "server_error" ? "server" : "unauthorized";
      await writeAdminAudit({ actorUserId: user?.id ?? null, action: "oauth_login_failure", metadata: { reason }, request });
      return NextResponse.redirect(new URL(`/admin/login?error=${reason}`, requestUrl.origin));
    }

    const mfa = requireAdminMfa()
      ? await getMfaContext(supabase, user.id, request)
      : {
          mfaRequired: false,
          mfaSatisfied: true,
          verifiedFactors: [] as unknown[],
        };
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
