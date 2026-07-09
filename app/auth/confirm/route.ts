import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callback = new URL("/auth/callback", url.origin);
  url.searchParams.forEach((value, key) => callback.searchParams.set(key, value));
  if (!callback.searchParams.has("next")) {
    callback.searchParams.set("next", "/admin/reset-password");
  }
  return NextResponse.redirect(callback);
}
