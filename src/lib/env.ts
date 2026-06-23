import { z } from "zod/v4";

/**
 * Server-side environment variable validation.
 *
 * This module validates that all required environment variables are present
 * and correctly typed at startup. It must only be imported in server code.
 *
 * Rules:
 * - NEXT_PUBLIC_ variables are safe for the browser.
 * - SUPABASE_SERVICE_ROLE_KEY is server-only and must NEVER be prefixed with NEXT_PUBLIC_.
 * - Never log environment variable values.
 */

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL is required").default("http://localhost:3000"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL is required").default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validated server environment — includes the secret service-role key.
 * Must only be called in server-side code.
 */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = z.prettifyError(parsed.error);
    throw new Error(`❌ Server environment validation failed:\n${formatted}`);
  }
  return parsed.data;
}

/**
 * Validated client environment — only public variables.
 * Safe to call from both server and client code.
 */
export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    const formatted = z.prettifyError(parsed.error);
    throw new Error(`❌ Client environment validation failed:\n${formatted}`);
  }
  return parsed.data;
}
