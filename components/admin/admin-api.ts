import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AdminProfileSettings,
  ContactMessage,
  MessageStatus,
  UploadBucket,
  UploadRecord,
} from "@/lib/cms-types";

export type AdminRequest = (url: string, init?: RequestInit) => Promise<Response>;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const readJsonObject = async (response: Response): Promise<Record<string, unknown>> => {
  const value: unknown = await response.json().catch(() => ({}));
  return isRecord(value) ? value : {};
};

const stringOrEmpty = (value: unknown) => typeof value === "string" ? value : "";
const nullableString = (value: unknown) => typeof value === "string" ? value : null;
const safePublicAssetUrl = (value: unknown) => {
  if (typeof value !== "string") return null;
  return (value.startsWith("/") && !value.startsWith("//")) || value.toLowerCase().startsWith("https://")
    ? value
    : null;
};
const messageStatuses = new Set<MessageStatus>(["new", "read", "archived"]);
const uploadBuckets = new Set<UploadBucket>([
  "public-assets",
  "project-images",
  "resumes",
  "uploads",
]);

export const parseContactMessages = (value: unknown): ContactMessage[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = stringOrEmpty(item.id);
    const status = stringOrEmpty(item.status) as MessageStatus;
    if (!id || !messageStatuses.has(status)) return [];

    const createdAt = stringOrEmpty(item.created_at);
    return [{
      id,
      name: stringOrEmpty(item.name),
      email: stringOrEmpty(item.email),
      message: stringOrEmpty(item.message),
      source: nullableString(item.source),
      status,
      created_at: createdAt,
      updated_at: stringOrEmpty(item.updated_at) || createdAt,
      read_at: nullableString(item.read_at),
      archived_at: nullableString(item.archived_at),
    }];
  });
};

export const parseUploads = (value: unknown): UploadRecord[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = stringOrEmpty(item.id);
    const bucket = stringOrEmpty(item.bucket) as UploadBucket;
    const path = stringOrEmpty(item.path);
    if (!id || !path || !uploadBuckets.has(bucket)) return [];

    return [{
      id,
      bucket,
      path,
      public_url: safePublicAssetUrl(item.public_url),
      mime_type: nullableString(item.mime_type),
      size_bytes: typeof item.size_bytes === "number" ? item.size_bytes : null,
      original_name: nullableString(item.original_name),
      uploaded_by: nullableString(item.uploaded_by),
      created_at: stringOrEmpty(item.created_at),
    }];
  });
};

export const parseAdminProfile = (value: unknown): AdminProfileSettings => {
  const profile = isRecord(value) ? value : {};
  return {
    displayName: stringOrEmpty(profile.displayName),
    jobTitle: stringOrEmpty(profile.jobTitle),
    phone: stringOrEmpty(profile.phone),
    avatarUrl: stringOrEmpty(profile.avatarUrl),
    timezone: stringOrEmpty(profile.timezone),
    language: stringOrEmpty(profile.language),
  };
};

export const adminApiError = (value: unknown) => {
  const data = isRecord(value) ? value : {};
  const code = typeof data.code === "string" ? data.code : "";
  const error = typeof data.error === "string" ? data.error : "";

  switch (code) {
    case "not_authenticated":
      return "Your session expired. Please log in again.";
    case "not_admin":
      return "This account is not authorized to change CMS content.";
    case "mfa_required":
      return "MFA verification is required before this action.";
    case "validation_error":
      return error || "Please check the submitted fields.";
    case "origin_not_allowed":
      return "This request was blocked by the site origin check. Refresh and try again.";
    case "server_error":
      return "The server could not complete this CMS action.";
    default:
      return error || "The CMS action could not be completed.";
  }
};

export const adminFetch = async (
  url: string,
  init: RequestInit = {},
  verifiedAccessToken?: string,
) => {
  const headers = new Headers(init.headers);
  let token = verifiedAccessToken;

  try {
    const supabaseClient = createSupabaseBrowserClient();
    const { data } = await supabaseClient.auth.getSession();
    let session = data.session;

    const expiresAt = session?.expires_at ?? 0;
    const expiresSoon = expiresAt > 0 && expiresAt < Math.floor(Date.now() / 1000) + 60;

    if (!session || expiresSoon) {
      const refreshed = await supabaseClient.auth.refreshSession();
      session = refreshed.data.session ?? session;
    }

    token = session?.access_token ?? token;
  } catch {
    // Cookie-based authentication remains available if browser session lookup fails.
  }

  if (token && token !== "undefined" && token !== "null") {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });
};
