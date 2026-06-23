import { type NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

/**
 * Supabase auth-refresh middleware helper.
 *
 * Refreshes the auth session on every request according to current
 * Supabase SSR guidance. This prevents stale cookies and ensures
 * the user's session stays valid.
 *
 * This is NOT an authorization layer — it only refreshes tokens.
 * Every protected Server Component, query, and Server Action must
 * still authorize independently.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: Do NOT use getSession() alone for authorization.
  // getUser() sends a request to the Supabase Auth server to revalidate
  // the Auth token, while getSession() does not.
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getUser();

  return supabaseResponse;
}
