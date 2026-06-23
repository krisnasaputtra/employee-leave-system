"use client";

import { createBrowserClient } from "@supabase/ssr";

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
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
