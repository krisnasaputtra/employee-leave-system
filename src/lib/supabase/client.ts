"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/client-env";
import type { Database } from "@/types/database.types";

/**
 * Browser Supabase client.
 *
 * - Uses the publishable (anon) key.
 * - RLS is enforced.
 * - Safe for use in Client Components.
 * - Do NOT use this for server-side operations.
 */
export function createClient() {
  const env = getClientEnv();

  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
