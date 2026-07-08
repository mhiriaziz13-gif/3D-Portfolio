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
  gif: ["image/gif"],
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

const publicBuckets = new Set(["public-assets", "project-images", "resumes"]);
const maxFileSize = 10 * 1024 * 1024;

const extensionFor = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const hasMagicBytes = (buffer: Buffer, mime: string) => {
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/gif") return buffer.subarray(0, 3).toString("ascii") === "GIF";
  if (mime === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return buffer[0] === 0x50 && buffer[1] === 0x4b;
  return false;
};

export async function POST(request: Request) {
  const admin = await requireAdminApi(request, { requireMfa: true });
  if (!admin.ok) return admin.response;
  if (!isSupabaseAdminConfigured()) return jsonError("Supabase service role is not configured.", 503);

  const formData = await request.formData();
  const bucketParsed = bucketSchema.safeParse(String(formData.get("bucket") ?? "uploads"));
  if (!bucketParsed.success) return jsonError("Invalid upload bucket.", 400);

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) return jsonError("File is required.", 400);

  const ext = extensionFor(fileValue.name);
  const allowedMimes = allowedMimeByExt[ext];
  if (!allowedMimes || !allowedMimes.includes(fileValue.type) || ext === "svg") {
    return jsonError("File type is not allowed.", 400);
  }

  if (fileValue.size <= 0 || fileValue.size > maxFileSize) {
    return jsonError("File size is not allowed.", 400);
  }

  const buffer = Buffer.from(await fileValue.arrayBuffer());
  if (!hasMagicBytes(buffer, fileValue.type)) {
    return jsonError("File signature is invalid.", 400);
  }

  const bucket = bucketParsed.data;
  const path = `${admin.user.id}/${randomUUID()}.${ext}`;
  const supabase = createSupabaseAdminClient();
  const uploaded = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: fileValue.type,
    upsert: false,
  });

  if (uploaded.error) {
    return jsonError("Upload failed.", 500);
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
    .select("*")
    .single();

  if (error) {
    return jsonError("Upload metadata could not be saved.", 500);
  }

  await writeAdminAudit({ actorUserId: admin.user.id, action: "upload_created", entityType: "uploads", entityId: data.id, request });
  return jsonOk({ upload: data, publicUrl });
}