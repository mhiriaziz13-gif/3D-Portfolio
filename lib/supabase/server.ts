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

export const createSupabaseServerClient = async () => {
  assertSupabasePublicEnv();
  const cookieStore = (await cookies()) as unknown as MutableCookieStore;

  return createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
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
