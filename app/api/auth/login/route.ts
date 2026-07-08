import { getMfaContext, isAdminUser, writeAdminAudit } from "@/lib/security/admin-auth";
import { assertSameOrigin, clientIp, jsonError, jsonOk } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { safeRedirect } from "@/lib/security/redirects";
import { loginSchema } from "@/lib/security/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid email or password.", 400);
    }

    const ip = clientIp(request);
    const emailKey = parsed.data.email.toLowerCase();
    const limited = rateLimit({ key: `login:${ip}:${emailKey}`, limit: 8, windowMs: 15 * 60 * 1000 });
    if (!limited.allowed) {
      return jsonError("Invalid email or password.", 429);
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      await writeAdminAudit({ action: "login_failure", metadata: { reason: "auth_failed" }, request });
      return jsonError("Invalid email or password.", 401);
    }

    const admin = await isAdminUser(data.user.id);
    if (!admin) {
      await supabase.auth.signOut();
      await writeAdminAudit({ actorUserId: data.user.id, action: "non_admin_rejected", request });
      return jsonError("Invalid email or password.", 401);
    }

    const mfa = await getMfaContext(supabase, data.user.id, request);
    const next = safeRedirect(parsed.data.next, "/admin");

    if (mfa.mfaRequired && !mfa.mfaSatisfied) {
      await writeAdminAudit({ actorUserId: data.user.id, action: "mfa_challenge_required", request });
      const factor = (mfa.verifiedFactors[0] as { id?: string } | undefined)?.id ?? null;
      return jsonOk({
        mfaRequired: true,
        hasFactor: Boolean(factor),
        factorId: factor,
        redirectTo: factor ? null : "/admin/security?setup=mfa",
        next,
      });
    }

    await writeAdminAudit({ actorUserId: data.user.id, action: "login_success", request });
    return jsonOk({ redirectTo: next });
  } catch {
    return jsonError("Invalid email or password.", 401);
  }
}