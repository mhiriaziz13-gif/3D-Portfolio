import { createClient } from "@supabase/supabase-js";

import { assertSupabaseAdminEnv, supabaseEnv } from "@/lib/supabase/config";

export const createSupabaseAdminClient = () => {
  assertSupabaseAdminEnv();

  return createClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};