import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { hashNullable } from "@/lib/security/crypto";
import { assertSameOrigin, clientIp, jsonError, jsonOk, userAgent } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { contactSchema } from "@/lib/security/validation";
import { writeAdminAudit } from "@/lib/security/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const ip = clientIp(request);
    const limited = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 });
    if (!limited.allowed) {
      return jsonError("Please wait before sending another message.", 429);
    }

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError("Please check the contact form fields.", 400);
    }

    if (parsed.data.company) {
      return jsonOk({ message: "Message received." });
    }

    if (!isSupabaseAdminConfigured()) {
      return jsonOk({ message: "Message prepared locally.", fallback: true }, 202);
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      source: "portfolio_contact_form",
      ip_hash: hashNullable(ip),
      user_agent_hash: hashNullable(userAgent(request)),
    });

    if (error) {
      return jsonError("Message could not be sent right now.", 500);
    }

    await writeAdminAudit({
      action: "contact_message_created",
      entityType: "contact_messages",
      request,
    });

    return jsonOk({ message: "Message sent. Thank you." });
  } catch {
    return jsonError("Message could not be sent right now.", 400);
  }
}