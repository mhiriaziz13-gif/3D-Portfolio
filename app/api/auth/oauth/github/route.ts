import { NextResponse } from "next/server";

import { safeRedirect } from "@/lib/security/redirects";
import { getAppUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const next = safeRedirect(url.searchParams.get("next"), "/admin");
    const supabase = await createSupabaseServerClient();
    const redirectTo = `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo } });
    if (error || !data.url) throw new Error("OAuth URL unavailable");
    return NextResponse.redirect(data.url);
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=github", url.origin));
  }
}