import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createSupabasePublicClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import {
  adminMfaRememberDays,
  isSupabaseAdminConfigured,
  requireAdminMfa,
  supabaseEnv,
} from "@/lib/supabase/config";
import {
  hashNullable,
  randomToken,
  sha256Hex,
} from "@/lib/security/crypto";
import {
  clientIp,
  isSameOrigin,
  jsonError,
  userAgent,
} from "@/lib/security/http";
import { safeRedirect } from "@/lib/security/redirects";

export const REMEMBER_DEVICE_COOKIE = "aam_admin_mfa_device";

type AuthenticatedAdmin = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  mfaRequired: boolean;
  mfaSatisfied: boolean;
  verifiedFactors: unknown[];
};

export type AdminAuthState =
  | {
      status: "authenticated";
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      user: User;
      accessToken?: string;
    }
  | {
      status: "not_authenticated";
    }
  | {
      status: "not_admin";
      user: User;
    }
  | {
      status: "server_error";
    };

type RequestWithCookies = Request & {
  cookies?: {
    get?: (
      name: string,
    ) => { value?: string } | string | undefined;
  };
};

const cookieValueFromRequest = async (
  request: Request,
  name: string,
) => {
  const requestCookie = (
    request as RequestWithCookies
  ).cookies?.get?.(name);

  if (typeof requestCookie === "string") {
    return requestCookie;
  }

  if (requestCookie?.value) {
    return requestCookie.value;
  }

  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value ?? null;
  } catch {
    return null;
  }
};

const rememberCookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  expires,
});

export const getAdminMembership = async (
  userId: string,
) => {
  if (!isSupabaseAdminConfigured()) {
    return {
      status: "server_error" as const,
    };
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      status: "server_error" as const,
    };
  }

  return data?.user_id
    ? {
        status: "admin" as const,
      }
    : {
        status: "not_admin" as const,
      };
};

export const isAdminUser = async (userId: string) =>
  (await getAdminMembership(userId)).status === "admin";

const extractBearerToken = (request?: Request) => {
  const authorization =
    request?.headers.get("authorization") ?? "";

  const token =
    authorization
      .match(/^Bearer\s+(.+)$/i)?.[1]
      ?.trim() || null;

  if (
    !token ||
    token === "undefined" ||
    token === "null"
  ) {
    return null;
  }

  return token;
};

type BearerUserResult =
  | {
      user: User;
      error: null;
      status: number;
    }
  | {
      user: null;
      error: string;
      status: number | null;
    };

const getUserFromBearerToken = async (
  accessToken: string,
): Promise<BearerUserResult> => {
  try {
    const response = await fetch(
      `${supabaseEnv.url}/auth/v1/user`,
      {
        method: "GET",
        headers: {
          apikey: supabaseEnv.anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      let error =
        response.statusText || "BearerAuthError";

      try {
        const payload = (await response.json()) as {
          error?: string;
          error_code?: string;
          msg?: string;
          message?: string;
        };

        error =
          payload.error_code ||
          payload.error ||
          payload.msg ||
          payload.message ||
          error;
      } catch {
        // Keep HTTP status text when response is not JSON.
      }

      return {
        user: null,
        error,
        status: response.status,
      };
    }

    const user = (await response.json()) as User;

    if (!user?.id) {
      return {
        user: null,
        error: "BearerUserMissing",
        status: response.status,
      };
    }

    return {
      user,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      user: null,
      error:
        error instanceof Error
          ? error.name
          : "BearerAuthFetchError",
      status: null,
    };
  }
};

const logAdminAuthDiagnostics = (details: {
  method?: string;
  pathname?: string;
  hasBearerToken: boolean;
  bearerTokenLength?: number;
  bearerTokenStartsWithEy?: boolean;
  cookieAuthSucceeded: boolean;
  cookieAuthError?: string | null;
  cookieAuthStatus?: number | null;
  bearerAuthSucceeded: boolean;
  bearerAuthError?: string | null;
  bearerAuthStatus?: number | null;
  finalAuthState: AdminAuthState["status"];
}) => {
  const event = "Admin auth diagnostics";

  if (process.env.NODE_ENV === "production") {
    if (
      details.finalAuthState !== "authenticated"
    ) {
      console.warn(event, details);
    }

    return;
  }

  console.debug(event, details);
};

export const getAdminAuthState = async (
  request?: Request,
): Promise<AdminAuthState> => {
  let cookieAuthSucceeded = false;
  let bearerAuthSucceeded = false;

  let cookieAuthError: string | null = null;
  let cookieAuthStatus: number | null = null;

  let bearerAuthError: string | null = null;
  let bearerAuthStatus: number | null = null;

  const requestUrl = request
    ? new URL(request.url)
    : null;

  try {
    const supabase =
      await createSupabaseServerClient(request);

    const accessToken =
      extractBearerToken(request);

    let validatedAccessToken:
      | string
      | undefined;

    let user: User | null = null;

    /*
     * First attempt:
     * authenticate using Supabase SSR cookies.
     */
    const cookieResult =
      await supabase.auth.getUser();

    if (
      !cookieResult.error &&
      cookieResult.data.user
    ) {
      cookieAuthSucceeded = true;
      user = cookieResult.data.user;
    } else if (cookieResult.error) {
      cookieAuthError =
        cookieResult.error.name;

      cookieAuthStatus =
        cookieResult.error.status ?? null;
    }

    /*
     * Fallback:
     * validate the Bearer token directly against
     * Supabase Auth REST.
     */
    if (!user && accessToken) {
      const bearerResult =
        await getUserFromBearerToken(
          accessToken,
        );

      if (bearerResult.user) {
        bearerAuthSucceeded = true;
        validatedAccessToken = accessToken;
        user = bearerResult.user;
      } else {
        bearerAuthError =
          bearerResult.error;

        bearerAuthStatus =
          bearerResult.status;
      }
    }

    if (!user) {
      logAdminAuthDiagnostics({
        method: request?.method,
        pathname: requestUrl?.pathname,

        hasBearerToken:
          Boolean(accessToken),

        bearerTokenLength:
          accessToken?.length ?? 0,

        bearerTokenStartsWithEy:
          accessToken?.startsWith("ey") ??
          false,

        cookieAuthSucceeded,
        cookieAuthError,
        cookieAuthStatus,

        bearerAuthSucceeded,
        bearerAuthError,
        bearerAuthStatus,

        finalAuthState:
          "not_authenticated",
      });

      return {
        status: "not_authenticated",
      };
    }

    /*
     * The Supabase user must also exist
     * in public.admins.
     */
    const membership =
      await getAdminMembership(user.id);

    if (
      membership.status === "server_error"
    ) {
      logAdminAuthDiagnostics({
        method: request?.method,
        pathname: requestUrl?.pathname,

        hasBearerToken:
          Boolean(accessToken),

        bearerTokenLength:
          accessToken?.length ?? 0,

        bearerTokenStartsWithEy:
          accessToken?.startsWith("ey") ??
          false,

        cookieAuthSucceeded,
        cookieAuthError,
        cookieAuthStatus,

        bearerAuthSucceeded,
        bearerAuthError,
        bearerAuthStatus,

        finalAuthState: "server_error",
      });

      return {
        status: "server_error",
      };
    }

    if (
      membership.status === "not_admin"
    ) {
      logAdminAuthDiagnostics({
        method: request?.method,
        pathname: requestUrl?.pathname,

        hasBearerToken:
          Boolean(accessToken),

        bearerTokenLength:
          accessToken?.length ?? 0,

        bearerTokenStartsWithEy:
          accessToken?.startsWith("ey") ??
          false,

        cookieAuthSucceeded,
        cookieAuthError,
        cookieAuthStatus,

        bearerAuthSucceeded,
        bearerAuthError,
        bearerAuthStatus,

        finalAuthState: "not_admin",
      });

      return {
        status: "not_admin",
        user,
      };
    }

    logAdminAuthDiagnostics({
      method: request?.method,
      pathname: requestUrl?.pathname,

      hasBearerToken:
        Boolean(accessToken),

      bearerTokenLength:
        accessToken?.length ?? 0,

      bearerTokenStartsWithEy:
        accessToken?.startsWith("ey") ??
        false,

      cookieAuthSucceeded,
      cookieAuthError,
      cookieAuthStatus,

      bearerAuthSucceeded,
      bearerAuthError,
      bearerAuthStatus,

      finalAuthState: "authenticated",
    });

    return {
      status: "authenticated",
      supabase,
      user,
      accessToken: validatedAccessToken,
    };
  } catch {
    const accessToken =
      extractBearerToken(request);

    logAdminAuthDiagnostics({
      method: request?.method,
      pathname: requestUrl?.pathname,

      hasBearerToken:
        Boolean(accessToken),

      bearerTokenLength:
        accessToken?.length ?? 0,

      bearerTokenStartsWithEy:
        accessToken?.startsWith("ey") ??
        false,

      cookieAuthSucceeded,
      cookieAuthError,
      cookieAuthStatus,

      bearerAuthSucceeded,
      bearerAuthError,
      bearerAuthStatus,

      finalAuthState: "server_error",
    });

    return {
      status: "server_error",
    };
  }
};

export const getAdminSecurityPreference = async (
  userId: string,
) => {
  if (!isSupabaseAdminConfigured()) {
    return {
      mfa_required: requireAdminMfa(),
      remember_device_enabled: true,
    };
  }

  const supabase =
    createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("admin_security_preferences")
    .select(
      "mfa_required, remember_device_enabled",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load admin security preferences.");
  }

  return {
    mfa_required:
      requireAdminMfa() ||
      Boolean(data?.mfa_required),

    remember_device_enabled:
      data?.remember_device_enabled ?? true,
  };
};

export const validateRememberedDeviceToken =
  async (
    userId: string,
    token: string | null,
  ) => {
    if (
      !token ||
      !isSupabaseAdminConfigured()
    ) {
      return false;
    }

    const supabase =
      createSupabaseAdminClient();

    const tokenHash =
      sha256Hex(token);

    const { data, error } = await supabase
      .from("admin_remembered_devices")
      .select(
        "id, expires_at, revoked_at",
      )
      .eq("user_id", userId)
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt(
        "expires_at",
        new Date().toISOString(),
      )
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    await supabase
      .from("admin_remembered_devices")
      .update({
        last_used_at:
          new Date().toISOString(),
      })
      .eq("id", data.id);

    return true;
  };

export const validateRememberedDeviceFromRequest =
  async (
    userId: string,
    request: Request,
  ) =>
    validateRememberedDeviceToken(
      userId,
      await cookieValueFromRequest(
        request,
        REMEMBER_DEVICE_COOKIE,
      ),
    );

export const validateRememberedDeviceFromCookies =
  async (userId: string) => {
    const cookieStore = await cookies();

    return validateRememberedDeviceToken(
      userId,
      cookieStore.get(
        REMEMBER_DEVICE_COOKIE,
      )?.value ?? null,
    );
  };

export const createRememberedDevice = async (
  userId: string,
  request: Request,
) => {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const preference =
    await getAdminSecurityPreference(userId);

  if (
    !preference.remember_device_enabled
  ) {
    return null;
  }

  const token = randomToken(32);

  const expiresAt = new Date(
    Date.now() +
      adminMfaRememberDays() *
        24 *
        60 *
        60 *
        1000,
  );

  const supabase =
    createSupabaseAdminClient();

  const { error } = await supabase
    .from("admin_remembered_devices")
    .insert({
      user_id: userId,
      token_hash: sha256Hex(token),

      user_agent_hash: hashNullable(
        userAgent(request),
      ),

      ip_hash: hashNullable(
        clientIp(request),
      ),

      expires_at:
        expiresAt.toISOString(),
    });

  if (error) {
    return null;
  }

  return {
    token,
    expiresAt,
  };
};

export const setRememberDeviceCookie = (
  response: NextResponse,
  token: string,
  expiresAt: Date,
) => {
  response.cookies.set(
    REMEMBER_DEVICE_COOKIE,
    token,
    rememberCookieOptions(expiresAt),
  );
};

export const clearRememberDeviceCookie = (
  response: NextResponse,
) => {
  response.cookies.set(
    REMEMBER_DEVICE_COOKIE,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    },
  );
};

export const revokeRememberedDevice = async (
  userId: string,
  id: string,
) => {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  const supabase =
    createSupabaseAdminClient();

  await supabase
    .from("admin_remembered_devices")
    .update({
      revoked_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
};

export const revokeAllRememberedDevices =
  async (userId: string) => {
    if (!isSupabaseAdminConfigured()) {
      return;
    }

    const supabase =
      createSupabaseAdminClient();

    await supabase
      .from("admin_remembered_devices")
      .update({
        revoked_at:
          new Date().toISOString(),
      })
      .eq("user_id", userId)
      .is("revoked_at", null);
  };

type MfaFactors = {
  all: unknown[];
  phone: unknown[];
  totp: unknown[];
  webauthn: unknown[];
};

const verifiedFactorsByType = (
  factors: unknown[],
  type: string,
) =>
  factors.filter((factor) => {
    const candidate = factor as {
      status?: string;
      factor_type?: string;
    };

    return (
      candidate.status === "verified" &&
      candidate.factor_type === type
    );
  });

const mfaFactorsFromUser = (
  user?: User,
): MfaFactors | null => {
  const factors = (
    user as
      | {
          factors?: unknown[];
        }
      | undefined
  )?.factors;

  if (!Array.isArray(factors)) {
    return null;
  }

  return {
    all: factors,

    phone: verifiedFactorsByType(
      factors,
      "phone",
    ),

    totp: verifiedFactorsByType(
      factors,
      "totp",
    ),

    webauthn: verifiedFactorsByType(
      factors,
      "webauthn",
    ),
  };
};

export const getMfaContext = async (
  supabase: Awaited<
    ReturnType<
      typeof createSupabaseServerClient
    >
  >,
  userId: string,
  request?: Request,
  accessToken?: string,
  user?: User,
) => {
  const preference =
    await getAdminSecurityPreference(userId);

  const factors =
    mfaFactorsFromUser(user) ??
    (
      await supabase.auth.mfa.listFactors()
    ).data ??
    null;

  const aalSupabase = accessToken
    ? createSupabasePublicClient()
    : supabase;

  const aal =
    await aalSupabase.auth.mfa
      .getAuthenticatorAssuranceLevel(
        accessToken,
      );

  const verifiedFactors =
    factors?.totp ?? [];

  const remembered =
    preference.remember_device_enabled
      ? request
        ? await validateRememberedDeviceFromRequest(
            userId,
            request,
          )
        : await validateRememberedDeviceFromCookies(
            userId,
          )
      : false;

  const currentLevel =
    aal.data?.currentLevel ?? null;

  return {
    aal: aal.data ?? null,
    factors,
    verifiedFactors,

    mfaRequired:
      preference.mfa_required,

    rememberDeviceEnabled:
      preference.remember_device_enabled,

    mfaSatisfied:
      currentLevel === "aal2" ||
      remembered,

    remembered,
  };
};

export const getAuthenticatedAdmin = async (
  request?: Request,
) => {
  const state =
    await getAdminAuthState(request);

  if (
    state.status !== "authenticated"
  ) {
    return null;
  }

  const mfa = await getMfaContext(
    state.supabase,
    state.user.id,
    request,
    state.accessToken,
    state.user,
  );

  return {
    supabase: state.supabase,
    user: state.user,
    mfaRequired: mfa.mfaRequired,
    mfaSatisfied: mfa.mfaSatisfied,
    verifiedFactors:
      mfa.verifiedFactors,
  } satisfies AuthenticatedAdmin;
};

export const requireAdminPage = async (
  options?: {
    next?: string;
    requireMfa?: boolean;
    allowMfaSetup?: boolean;
  },
) => {
  let admin:
    | Awaited<
        ReturnType<
          typeof getAuthenticatedAdmin
        >
      >
    | null = null;

  try {
    admin =
      await getAuthenticatedAdmin();
  } catch {
    admin = null;
  }

  if (!admin) {
    redirect(
      `/admin/login?next=${encodeURIComponent(
        options?.next ?? "/admin",
      )}`,
    );

    throw new Error(
      "Redirecting to admin login.",
    );
  }

  const mustHaveMfa =
    options?.requireMfa ?? true;

  const canSetup =
    options?.allowMfaSetup &&
    admin.verifiedFactors.length === 0;

  if (
    mustHaveMfa &&
    admin.mfaRequired &&
    !admin.mfaSatisfied &&
    !canSetup
  ) {
    redirect(
      `/admin/login?mfa=required&next=${encodeURIComponent(
        options?.next ?? "/admin",
      )}`,
    );

    throw new Error(
      "Redirecting to MFA verification.",
    );
  }

  return admin;
};

export const requireAdminApi = async (
  request: Request,
  options?: {
    requireMfa?: boolean;
    sameOrigin?: boolean;
  },
) => {
  if (
    (options?.sameOrigin ?? true) &&
    !isSameOrigin(request)
  ) {
    return {
      ok: false as const,

      response: jsonError(
        "Request origin is not allowed.",
        403,
        "origin_not_allowed",
      ),
    };
  }

  try {
    const state =
      await getAdminAuthState(request);

    if (
      state.status ===
      "not_authenticated"
    ) {
      return {
        ok: false as const,

        response: jsonError(
          "You are not signed in.",
          401,
          "not_authenticated",
        ),
      };
    }

    if (state.status === "not_admin") {
      return {
        ok: false as const,

        response: jsonError(
          "This account is not authorized for CMS administration.",
          403,
          "not_admin",
        ),
      };
    }

    if (
      state.status === "server_error"
    ) {
      return {
        ok: false as const,

        response: jsonError(
          "Admin authentication could not be verified.",
          500,
          "server_error",
        ),
      };
    }

    const mfa =
      options?.requireMfa ?? false
        ? await getMfaContext(
            state.supabase,
            state.user.id,
            request,
            state.accessToken,
            state.user,
          )
        : {
            mfaRequired: false,
            mfaSatisfied: true,
            verifiedFactors:
              [] as unknown[],
          };

    if (
      mfa.mfaRequired &&
      !mfa.mfaSatisfied
    ) {
      return {
        ok: false as const,

        response: jsonError(
          "MFA verification is required.",
          403,
          "mfa_required",
        ),
      };
    }

    return {
      ok: true as const,
      supabase: state.supabase,
      user: state.user,
      accessToken:
        state.accessToken,
      mfaRequired:
        mfa.mfaRequired,
      mfaSatisfied:
        mfa.mfaSatisfied,
      verifiedFactors:
        mfa.verifiedFactors,
    };
  } catch {
    return {
      ok: false as const,

      response: jsonError(
        "Admin authentication could not be verified.",
        500,
        "server_error",
      ),
    };
  }
};

export const signOutAndRedirectToLogin =
  async (next = "/admin") => {
    const supabase =
      await createSupabaseServerClient();

    await supabase.auth.signOut();

    redirect(
      `/admin/login?next=${encodeURIComponent(
        safeRedirect(next),
      )}`,
    );
  };

export const writeAdminAudit = async (
  input: {
    actorUserId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<
      string,
      unknown
    > | null;
    request?: Request;
  },
) => {
  if (!isSupabaseAdminConfigured()) {
    return;
  }

  try {
    const supabase =
      createSupabaseAdminClient();

    await supabase
      .from("admin_audit_logs")
      .insert({
        actor_user_id:
          input.actorUserId ?? null,

        action: input.action,

        entity_type:
          input.entityType ?? null,

        entity_id:
          input.entityId ?? null,

        metadata:
          input.metadata ?? null,

        ip_hash: input.request
          ? hashNullable(
              clientIp(input.request),
            )
          : null,

        user_agent_hash: input.request
          ? hashNullable(
              userAgent(input.request),
            )
          : null,
      });
  } catch {
    // Audit logging is best-effort.
  }
};
