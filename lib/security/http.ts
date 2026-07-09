import { NextResponse } from "next/server";

import { getAllowedOrigins } from "@/lib/supabase/config";
import { jsonHeaders } from "@/lib/security/headers";
export { jsonHeaders } from "@/lib/security/headers";

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return value.trim().replace(/\/+$/, "").toLowerCase();
  }
};

export const clientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
};

export const userAgent = (request: Request) => request.headers.get("user-agent") || "unknown";

export const isSameOrigin = (request: Request) => {
  const requestOrigin = normalizeOrigin(new URL(request.url).origin);
  const allowedOrigins = new Set([
    requestOrigin,
    ...getAllowedOrigins().map(normalizeOrigin),
  ]);
  const origin = request.headers.get("origin");

  if (origin) {
    return allowedOrigins.has(normalizeOrigin(origin));
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    return allowedOrigins.has(normalizeOrigin(new URL(referer).origin));
  } catch {
    return false;
  }
};

export const assertSameOrigin = (request: Request) => {
  if (!isSameOrigin(request)) {
    throw new Error("Request origin is not allowed.");
  }
};

export const jsonError = (message = "Request failed.", status = 400, code?: string) =>
  NextResponse.json(
    { ok: false, error: message, ...(code ? { code } : {}) },
    { status, headers: jsonHeaders },
  );

export const jsonOk = <T>(data: T, status = 200) =>
  NextResponse.json({ ok: true, ...data }, { status, headers: jsonHeaders });
