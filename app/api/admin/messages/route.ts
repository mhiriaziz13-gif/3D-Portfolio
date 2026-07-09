import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.string().min(1).max(40),
});

export async function GET(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true, sameOrigin: false });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("Supabase service role is not configured.", 503);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return jsonError("Could not load messages.", 500);
  return jsonOk({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("Supabase service role is not configured.", 503);

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError("Invalid message update.", 400);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select("*")
    .single();

  if (error) return jsonError("Could not update message.", 500);
  await writeAdminAudit({ actorUserId: admin.user.id, action: "cms_content_updated", entityType: "contact_messages", entityId: parsed.data.id, request });
  return jsonOk({ message: data });
}