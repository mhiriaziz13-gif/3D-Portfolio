import { NextResponse } from "next/server";

import { safeRedirect } from "@/lib/security/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const loginErrorRedirect = (origin: string, error: string) =>
  NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(error)}`, origin));

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const next = safeRedirect(url.searchParams.get("next"), "/admin");
    const supabase = await createSupabaseServerClient();
    const redirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo },
    });

    if (error || !data.url) {
      const errorCode = error?.code === "validation_failed" ? "github_disabled" : "github";
      return loginErrorRedirect(url.origin, errorCode);
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return loginErrorRedirect(
      url.origin,
      message.includes("environment variables") ? "supabase_config" : "github",
    );
  }
}
