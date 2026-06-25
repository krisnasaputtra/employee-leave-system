"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_COOKIE_KEYS = new Set([
  'sidebar_state',
  'sidebar_variant',
  'sidebar_collapsible',
  'theme_preset',
  'theme_mode',
]);

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(key)?.value;
  } catch {
    return undefined;
  }
}

export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  try {
    // Only allow known preference cookies
    if (!ALLOWED_COOKIE_KEYS.has(key)) {
      return;
    }
    // Auth guard: only logged-in users can set cookies
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cookieStore = await cookies();
    cookieStore.set(key, value, {
      path: options.path ?? "/",
      maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // default: 7 days
    });
  } catch {
    // Silently fail for cookie operations
  }
}

export async function getPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): Promise<T> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(key);
    const value = cookie ? cookie.value.trim() : undefined;
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}
