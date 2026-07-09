"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { getAuthenticatedAdmin, writeAdminAudit } from "@/lib/security/admin-auth";
import {
  contentMutationSchema,
  isEditableCmsTable,
  validateCmsRow,
} from "@/lib/security/validation";

type SaveCmsContentInput = {
  table: string;
  values: Record<string, unknown>;
};

export const saveCmsContentAction = async (input: SaveCmsContentInput) => {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return {
        ok: false as const,
        code: "not_authenticated",
        error: "Your admin session is not available.",
      };
    }

    if (admin.mfaRequired && !admin.mfaSatisfied) {
      return {
        ok: false as const,
        code: "mfa_required",
        error: "MFA verification is required.",
      };
    }

    if (!isSupabaseAdminConfigured()) {
      return {
        ok: false as const,
        code: "server_error",
        error: "CMS server configuration is incomplete.",
      };
    }

    const parsed = contentMutationSchema.safeParse(input);
    if (
      !parsed.success ||
      !parsed.data.values ||
      !isEditableCmsTable(parsed.data.table)
    ) {
      return {
        ok: false as const,
        code: "validation_error",
        error: "Invalid CMS mutation.",
      };
    }

    const validated = validateCmsRow(parsed.data.table, parsed.data.values);
    if (!validated.success) {
      return {
        ok: false as const,
        code: "validation_error",
        error: validated.error.issues[0]?.message ?? "Invalid CMS fields.",
      };
    }

    const row = validated.data;
    const supabase = createSupabaseAdminClient();
    const query = row.id || row.key
      ? supabase.from(parsed.data.table).upsert(row).select("*").single()
      : supabase.from(parsed.data.table).insert(row).select("*").single();
    const { data, error } = await query;

    if (error) {
      return {
        ok: false as const,
        code: "server_error",
        error: "Could not save CMS content.",
      };
    }

    await writeAdminAudit({
      actorUserId: admin.user.id,
      action: row.id || row.key ? "cms_content_updated" : "cms_content_created",
      entityType: parsed.data.table,
      entityId: String(row.id ?? row.key ?? data?.id ?? ""),
    });

    return { ok: true as const, row: data };
  } catch {
    return {
      ok: false as const,
      code: "server_error",
      error: "The CMS save could not be completed.",
    };
  }
};
