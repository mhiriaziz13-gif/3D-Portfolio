"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertSupabasePublicEnv, supabaseEnv } from "@/lib/supabase/config";

export const createSupabaseBrowserClient = () => {
  assertSupabasePublicEnv();
  return createBrowserClient(supabaseEnv.url, supabaseEnv.anonKey);
};
