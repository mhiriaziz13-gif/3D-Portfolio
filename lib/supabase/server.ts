import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { assertSupabasePublicEnv, supabaseEnv } from "@/lib/supabase/config";

type CookieRecord = {
  name: string;
  value: string;
};

type MutableCookieStore = {
  getAll: () => CookieRecord[];
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

const cookiesFromRequest = (request: Request): CookieRecord[] => {
  const header = request.headers.get("cookie");
  if (!header) return [];

  return header.split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 1) return [];

    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    try {
      return [{ name, value: decodeURIComponent(rawValue) }];
    } catch {
      return [{ name, value: rawValue }];
    }
  });
};

export const createSupabaseServerClient = async (request?: Request) => {
  assertSupabasePublicEnv();
  const cookieStore = (await cookies()) as unknown as MutableCookieStore;
  const requestCookies = request ? cookiesFromRequest(request) : [];

  return createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return requestCookies.length ? requestCookies : cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Record<string, unknown>);
          });
        } catch {
          // Server Components cannot always write cookies; route handlers and middleware can.
        }
      },
    },
  });
};

export const createSupabasePublicClient = () => {
  assertSupabasePublicEnv();

  return createClient(supabaseEnv.url, supabaseEnv.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
