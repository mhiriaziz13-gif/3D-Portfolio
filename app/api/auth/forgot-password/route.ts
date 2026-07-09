import { writeAdminAudit } from "@/lib/security/admin-auth";
import { sha256Hex } from "@/lib/security/crypto";
import { assertSameOrigin, clientIp, jsonOk } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/security/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const generic = "If this email is allowed, a recovery message has been sent.";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) return jsonOk({ message: generic });

    const ip = clientIp(request);
    const emailKey = parsed.data.email.toLowerCase();
    const limited = rateLimit({ key: `forgot:${ip}:${emailKey}`, limit: 5, windowMs: 30 * 60 * 1000 });
    if (!limited.allowed) return jsonOk({ message: generic });

    const requestOrigin = new URL(request.url).origin;
    const redirectTo = `${requestOrigin}/auth/callback?next=${encodeURIComponent("/admin/reset-password")}`;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

    await writeAdminAudit({
      action: error ? "password_reset_request_failed" : "password_reset_requested",
      metadata: {
        email_hash: sha256Hex(emailKey),
        error_code: error?.code ?? null,
        redirect_to: redirectTo,
      },
      request,
    });

    return jsonOk({ message: generic });
  } catch {
    return jsonOk({ message: generic });
  }
}
