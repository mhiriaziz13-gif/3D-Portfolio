import { NextResponse } from "next/server";

import { getAllowedOrigins } from "@/lib/supabase/config";
import { jsonHeaders } from "@/lib/security/headers";
export { jsonHeaders } from "@/lib/security/headers";

export const clientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
};

export const userAgent = (request: Request) => request.headers.get("user-agent") || "unknown";

export const isSameOrigin = (request: Request) => {
  const allowedOrigins = getAllowedOrigins();
  const origin = request.headers.get("origin");

  if (origin) {
    return allowedOrigins.includes(origin.replace(/\/+$/, ""));
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    const refererOrigin = new URL(referer).origin.replace(/\/+$/, "");
    return allowedOrigins.includes(refererOrigin);
  } catch {
    return false;
  }
};

export const assertSameOrigin = (request: Request) => {
  if (!isSameOrigin(request)) {
    throw new Error("Request origin is not allowed.");
  }
};

export const jsonError = (message = "Request failed.", status = 400) =>
  NextResponse.json({ ok: false, error: message }, { status, headers: jsonHeaders });

export const jsonOk = <T>(data: T, status = 200) =>
  NextResponse.json({ ok: true, ...data }, { status, headers: jsonHeaders });