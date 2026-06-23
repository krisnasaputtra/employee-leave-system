import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Server-only admin Supabase client.
 *
 * - Uses the service-role key.
 * - Bypasses RLS entirely.
 * - Must NEVER be imported in Client Components.
 * - The `server-only` import ensures a build error if this file
 *   is accidentally imported in a client bundle.
 *
 * Usage: Account provisioning, account ban/unban, and tightly
 * scoped administrative operations only.
 */
export function createAdminClient() {
  const env = getServerEnv();

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
