import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/** Public paths that don't require authentication. */
const PUBLIC_PATHS = ["/login", "/auth/signout"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Next.js middleware.
 *
 * 1. Refreshes the Supabase auth session on every matched request.
 * 2. Redirects unauthenticated users to /login for protected routes.
 * 3. Redirects authenticated users away from /login to /dashboard.
 *
 * This is a COARSE guard only — every protected Server Component,
 * query, and Server Action must still authorize independently.
 */
export async function middleware(request: NextRequest) {
  // Always refresh session first
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Skip auth checks for public paths
  if (isPublicPath(pathname)) {
    return response;
  }

  // For protected paths, check if user is authenticated
  // We read the Supabase auth cookie to make a quick check.
  // The full getUser() validation happens in server components.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

  if (!hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirectTo", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect root to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
