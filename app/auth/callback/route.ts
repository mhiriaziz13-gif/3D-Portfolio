import { NextResponse } from "next/server";

import { getAdminMembership, getMfaContext, writeAdminAudit } from "@/lib/security/admin-auth";
import { noStoreHeaders } from "@/lib/security/headers";
import { safeRedirect } from "@/lib/security/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const redirectTo = (path: string, origin: string) =>
  NextResponse.redirect(new URL(path, origin), { headers: noStoreHeaders });

const loginError = (origin: string, code: string) =>
  redirectTo(`/admin/login?error=${encodeURIComponent(code)}`, origin);

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
      await writeAdminAudit({ action: "oauth_callback_exchange_failure", metadata: { code: error.code ?? null }, request });
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
    return redirectTo(next, requestUrl.origin);
  }

  if (next.startsWith("/admin")) {
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data.user;
    const membership = user ? await getAdminMembership(user.id) : null;

    if (userError || !user || !membership || membership.status !== "admin") {
      await supabase.auth.signOut();
      const reason = membership?.status === "server_error" ? "server" : "unauthorized";
      await writeAdminAudit({ actorUserId: user?.id ?? null, action: "oauth_login_failure", metadata: { reason }, request });
      return loginError(requestUrl.origin, reason);
    }

    const mfa = await getMfaContext(supabase, user.id, request);

    if (mfa.mfaRequired && !mfa.mfaSatisfied) {
      await writeAdminAudit({ actorUserId: user.id, action: "mfa_challenge_required", request });
      if (!mfa.verifiedFactors.length) {
        return redirectTo("/admin/security?setup=mfa", requestUrl.origin);
      }
      return redirectTo(`/admin/login?mfa=required&next=${encodeURIComponent(next)}`, requestUrl.origin);
    }

    await writeAdminAudit({ actorUserId: user.id, action: "oauth_login_success", request });
  }

  return redirectTo(next, requestUrl.origin);
}
