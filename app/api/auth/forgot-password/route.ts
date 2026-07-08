import { getAppUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAdminAudit } from "@/lib/security/admin-auth";
import { sha256Hex } from "@/lib/security/crypto";
import { assertSameOrigin, clientIp, jsonOk } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

const generic = "If this email is allowed, a recovery message has been sent.";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonOk({ message: generic });
    }

    const ip = clientIp(request);
    const limited = rateLimit({ key: `forgot:${ip}:${parsed.data.email.toLowerCase()}`, limit: 5, windowMs: 30 * 60 * 1000 });
    if (!limited.allowed) {
      return jsonOk({ message: generic });
    }

    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent("/admin/reset-password")}`,
    });

    await writeAdminAudit({ action: "password_reset_requested", metadata: { email_hash: sha256Hex(parsed.data.email.toLowerCase()) }, request });
    return jsonOk({ message: generic });
  } catch {
    return jsonOk({ message: generic });
  }
}