import { NextResponse } from "next/server";

import { getAdminAuthState } from "@/lib/security/admin-auth";
import { jsonOk } from "@/lib/security/http";
import { requireAdminMfa } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const state = await getAdminAuthState();
  if (state.status === "authenticated") {
    return jsonOk({
      authenticated: true,
      email: state.user.email ?? null,
      userId: state.user.id,
      isAdmin: true,
      requireMfa: requireAdminMfa(),
    });
  }

  if (state.status === "not_admin") {
    return jsonOk({
      authenticated: true,
      email: state.user.email ?? null,
      userId: state.user.id,
      isAdmin: false,
      requireMfa: requireAdminMfa(),
    });
  }

  return jsonOk({
    authenticated: false,
    email: null,
    userId: null,
    isAdmin: false,
    requireMfa: requireAdminMfa(),
    status: state.status,
  });
}
