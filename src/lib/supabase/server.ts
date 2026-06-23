import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

/**
 * Server request-scoped Supabase client.
 *
 * - Cookie-based authenticated session.
 * - RLS is enforced as the signed-in user.
 * - Use this in Server Components, Server Actions, and Route Handlers.
 * - Do NOT import this from Client Components.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // The `setAll` method is called from a Server Component where
              // cookies cannot be set. This can be safely ignored if middleware
              // is refreshing user sessions.
            }
          }
        },
      },
    },
  );
}
