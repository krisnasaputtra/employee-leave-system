import "server-only";

import { z } from "zod/v4";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL is required").default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional().default("BNI Leave System <noreply@bni.co.id>"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validated server environment variables, including secrets.
 * Must only be imported by server-side modules.
 */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = z.prettifyError(parsed.error);
    throw new Error(`Server environment validation failed:\n${formatted}`);
  }

  return parsed.data;
}
