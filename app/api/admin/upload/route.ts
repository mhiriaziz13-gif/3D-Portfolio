import { randomUUID } from "crypto";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { requireAdminApi, writeAdminAudit } from "@/lib/security/admin-auth";
import { jsonError, jsonOk } from "@/lib/security/http";

export const dynamic = "force-dynamic";

const allowedBuckets = ["public-assets", "project-images", "resumes", "uploads"] as const;
const bucketSchema = z.enum(allowedBuckets);

const allowedMimeByExt: Record<string, string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

const publicBuckets = new Set(["public-assets", "project-images", "resumes"]);
const maxFileSize = 10 * 1024 * 1024;
const uploadFields = "id,bucket,path,public_url,mime_type,size_bytes,original_name,uploaded_by,created_at";

const uploadListSchema = z.object({
  bucket: bucketSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
}).strict();

const uploadDeleteSchema = z.object({
  id: z.string().uuid(),
}).strict();

const extensionFor = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const hasMagicBytes = (buffer: Buffer, mime: string) => {
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return buffer[0] === 0x50 && buffer[1] === 0x4b;
  return false;
};

export async function GET(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true, sameOrigin: false });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) {
    return jsonError("CMS server configuration is incomplete.", 500, "server_error");
  }

  const url = new URL(request.url);
  const parsed = uploadListSchema.safeParse({
    bucket: url.searchParams.get("bucket") || undefined,
    limit: url.searchParams.get("limit") || undefined,
  });
  if (!parsed.success) {
    return jsonError("Invalid upload filters.", 400, "validation_error");
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("uploads")
    .select(uploadFields)
    .order("created_at", { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.bucket) {
    query = query.eq("bucket", parsed.data.bucket);
  }

  const { data, error } = await query;
  if (error) return jsonError("Could not load uploads.", 500, "server_error");
  return jsonOk({ uploads: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("CMS server configuration is incomplete.", 500, "server_error");

  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError("Invalid upload request.", 400, "validation_error");
  const bucketParsed = bucketSchema.safeParse(String(formData.get("bucket") ?? "uploads"));
  if (!bucketParsed.success) return jsonError("Invalid upload bucket.", 400, "validation_error");

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) return jsonError("File is required.", 400, "validation_error");

  const ext = extensionFor(fileValue.name);
  const allowedMimes = allowedMimeByExt[ext];
  if (!allowedMimes || !allowedMimes.includes(fileValue.type) || ext === "svg") {
    return jsonError("File type is not allowed.", 400, "validation_error");
  }

  if (fileValue.size <= 0 || fileValue.size > maxFileSize) {
    return jsonError("File size is not allowed.", 400, "validation_error");
  }

  const buffer = Buffer.from(await fileValue.arrayBuffer());
  if (!hasMagicBytes(buffer, fileValue.type)) {
    return jsonError("File signature is invalid.", 400, "validation_error");
  }

  const bucket = bucketParsed.data;
  const path = `${admin.user.id}/${randomUUID()}.${ext}`;
  const supabase = createSupabaseAdminClient();
  const uploaded = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: fileValue.type,
    upsert: false,
  });

  if (uploaded.error) {
    return jsonError("Upload failed.", 500, "server_error");
  }

  const publicUrl = publicBuckets.has(bucket)
    ? supabase.storage.from(bucket).getPublicUrl(uploaded.data.path).data.publicUrl
    : null;

  const { data, error } = await supabase
    .from("uploads")
    .insert({
      bucket,
      path: uploaded.data.path,
      public_url: publicUrl,
      mime_type: fileValue.type,
      size_bytes: fileValue.size,
      original_name: fileValue.name,
      uploaded_by: admin.user.id,
    })
    .select(uploadFields)
    .single();

  if (error) {
    await supabase.storage.from(bucket).remove([uploaded.data.path]);
    return jsonError("Upload metadata could not be saved.", 500, "server_error");
  }

  await writeAdminAudit({ actorUserId: admin.user.id, action: "upload_created", entityType: "uploads", entityId: data.id, request });
  return jsonOk({ upload: data, publicUrl });
}

export async function DELETE(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) {
    return jsonError("CMS server configuration is incomplete.", 500, "server_error");
  }

  const parsed = uploadDeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("Invalid upload deletion.", 400, "validation_error");
  }

  const supabase = createSupabaseAdminClient();
  const existing = await supabase
    .from("uploads")
    .select("id, bucket, path")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (existing.error) {
    return jsonError("Could not load the upload.", 500, "server_error");
  }
  if (!existing.data) {
    return jsonError("Upload not found.", 404, "not_found");
  }

  const bucketParsed = bucketSchema.safeParse(existing.data.bucket);
  if (!bucketParsed.success || !existing.data.path) {
    return jsonError("Stored upload metadata is invalid.", 500, "server_error");
  }

  const removed = await supabase.storage
    .from(bucketParsed.data)
    .remove([existing.data.path]);
  if (removed.error) {
    return jsonError("Could not delete the stored file.", 500, "server_error");
  }

  const deleted = await supabase
    .from("uploads")
    .delete()
    .eq("id", existing.data.id)
    .select("id")
    .maybeSingle();
  if (deleted.error || !deleted.data) {
    return jsonError("Could not delete upload metadata.", 500, "server_error");
  }

  await writeAdminAudit({
    actorUserId: admin.user.id,
    action: "upload_deleted",
    entityType: "uploads",
    entityId: existing.data.id,
    metadata: { bucket: bucketParsed.data },
    request,
  });

  return jsonOk({ id: existing.data.id, message: "Deleted." });
}
