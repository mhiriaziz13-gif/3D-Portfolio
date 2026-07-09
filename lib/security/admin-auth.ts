import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  adminMfaRememberDays,
  isSupabaseAdminConfigured,
  requireAdminMfa,
} from "@/lib/supabase/config";
import { hashNullable, randomToken, sha256Hex } from "@/lib/security/crypto";
import { assertSameOrigin, clientIp, jsonError, userAgent } from "@/lib/security/http";
import { safeRedirect } from "@/lib/security/redirects";

export const REMEMBER_DEVICE_COOKIE = "aam_admin_mfa_device";

type AuthenticatedAdmin = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  mfaRequired: boolean;
  mfaSatisfied: boolean;
  verifiedFactors: unknown[];
};

const cookieHeaderValue = (request: Request, name: string) => {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

const rememberCookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
  expires,
});

export const isAdminUser = async (userId: string) => {
  if (!isSupabaseAdminConfigured()) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data?.user_id);
};

export const getAdminSecurityPreference = async (userId: string) => {
  if (!isSupabaseAdminConfigured()) {
    return {
      mfa_required: requireAdminMfa(),
      remember_device_enabled: true,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("admin_security_preferences")
    .select("mfa_required, remember_device_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    mfa_required: requireAdminMfa() || Boolean(data?.mfa_required),
    remember_device_enabled: data?.remember_device_enabled ?? true,
  };
};

export const validateRememberedDeviceToken = async (userId: string, token: string | null) => {
  if (!token || !isSupabaseAdminConfigured()) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const tokenHash = sha256Hex(token);
  const { data, error } = await supabase
    .from("admin_remembered_devices")
    .select("id, expires_at, revoked_at")
    .eq("user_id", userId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  await supabase
    .from("admin_remembered_devices")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
};

export const validateRememberedDeviceFromRequest = async (userId: string, request: Request) =>
  validateRememberedDeviceToken(userId, cookieHeaderValue(request, REMEMBER_DEVICE_COOKIE));

export const validateRememberedDeviceFromCookies = async (userId: string) => {
  const cookieStore = await cookies();
  return validateRememberedDeviceToken(userId, cookieStore.get(REMEMBER_DEVICE_COOKIE)?.value ?? null);
};

export const createRememberedDevice = async (userId: string, request: Request) => {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const preference = await getAdminSecurityPreference(userId);
  if (!preference.remember_device_enabled) {
    return null;
  }

  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + adminMfaRememberDays() * 24 * 60 * 60 * 1000);
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("admin_remembered_devices").insert({
    user_id: userId,
    token_hash: sha256Hex(token),
    user_agent_hash: hashNullable(userAgent(request)),
    ip_hash: hashNullable(clientIp(request)),
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return null;
  }

  return { token, expiresAt };
};

export const setRememberDeviceCookie = (response: NextResponse, token: string, expiresAt: Date) => {
  response.cookies.set(REMEMBER_DEVICE_COOKIE, token, rememberCookieOptions(expiresAt));
};

export const clearRememberDeviceCookie = (response: NextResponse) => {
  response.cookies.set(REMEMBER_DEVICE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
};

export const revokeRememberedDevice = async (userId: string, id: string) => {
  if (!isSupabaseAdminConfigured()) return;
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("admin_remembered_devices")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
};

export const revokeAllRememberedDevices = async (userId: string) => {
  if (!isSupabaseAdminConfigured()) return;
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("admin_remembered_devices")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
};

export const getMfaContext = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  request?: Request,
) => {
  const preference = await getAdminSecurityPreference(userId);
  const factors = await supabase.auth.mfa.listFactors();
  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const verifiedFactors = factors.data?.totp ?? [];
  const remembered = request
    ? await validateRememberedDeviceFromRequest(userId, request)
    : await validateRememberedDeviceFromCookies(userId);
  const currentLevel = aal.data?.currentLevel ?? null;

  return {
    aal: aal.data ?? null,
    factors: factors.data ?? null,
    verifiedFactors,
    mfaRequired: preference.mfa_required,
    rememberDeviceEnabled: preference.remember_device_enabled,
    mfaSatisfied: currentLevel === "aal2" || remembered,
    remembered,
  };
};

export const getAuthenticatedAdmin = async (request?: Request) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user) {
    return null;
  }

  const admin = await isAdminUser(user.id);
  if (!admin) {
    return null;
  }

  const mfa = await getMfaContext(supabase, user.id, request);

  return {
    supabase,
    user,
    mfaRequired: mfa.mfaRequired,
    mfaSatisfied: mfa.mfaSatisfied,
    verifiedFactors: mfa.verifiedFactors,
  } satisfies AuthenticatedAdmin;
};

export const requireAdminPage = async (options?: {
  next?: string;
  requireMfa?: boolean;
  allowMfaSetup?: boolean;
}) => {
  let admin: Awaited<ReturnType<typeof getAuthenticatedAdmin>> = null;

  try {
    admin = await getAuthenticatedAdmin();
  } catch {
    admin = null;
  }

  if (!admin) {
    redirect(`/admin/login?next=${encodeURIComponent(options?.next ?? "/admin")}`);
    throw new Error("Redirecting to admin login.");
  }

  const mustHaveMfa = options?.requireMfa ?? true;
  const canSetup = options?.allowMfaSetup && admin.verifiedFactors.length === 0;

  if (mustHaveMfa && admin.mfaRequired && !admin.mfaSatisfied && !canSetup) {
    redirect(`/admin/login?mfa=required&next=${encodeURIComponent(options?.next ?? "/admin")}`);
    throw new Error("Redirecting to MFA verification.");
  }

  return admin;
};

export const requireAdminApi = async (
  request: Request,
  options?: { requireMfa?: boolean; sameOrigin?: boolean },
) => {
  try {
    if (options?.sameOrigin ?? true) {
      assertSameOrigin(request);
    }

    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return { ok: false as const, response: jsonError("Unauthorized.", 401) };
    }

    if ((options?.requireMfa ?? false) && admin.mfaRequired && !admin.mfaSatisfied) {
      return { ok: false as const, response: jsonError("MFA verification required.", 403) };
    }

    return { ok: true as const, ...admin };
  } catch {
    return { ok: false as const, response: jsonError("Unauthorized.", 401) };
  }
};

export const signOutAndRedirectToLogin = async (next = "/admin") => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/admin/login?next=${encodeURIComponent(safeRedirect(next))}`);
};

export const writeAdminAudit = async (input: {
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  request?: Request;
}) => {
  if (!isSupabaseAdminConfigured()) return;

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("admin_audit_logs").insert({
      actor_user_id: input.actorUserId ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? null,
      ip_hash: input.request ? hashNullable(clientIp(input.request)) : null,
      user_agent_hash: input.request ? hashNullable(userAgent(input.request)) : null,
    });
  } catch {
    // Audit logging is best-effort during early setup.
  }
};