/**
 * Sanitize a Supabase/Postgres error message for user display.
 * Strips internal prefixes and technical details while keeping
 * user-friendly parts from RAISE EXCEPTION in RPCs.
 *
 * Never expose raw database errors, stack traces, or internal state.
 */
export function sanitizeDbError(error: { message?: string } | null, fallback: string): string {
  if (!error?.message) return fallback;

  // RPC errors from RAISE EXCEPTION arrive as "context: message"
  const cleaned = error.message.replace(/^.*?:\s*/, "");

  // If the cleaned message still looks technical, use fallback
  if (
    cleaned.includes("violates") ||
    cleaned.includes("duplicate key") ||
    cleaned.includes("syntax error") ||
    cleaned.includes("permission denied") ||
    cleaned.includes("does not exist") ||
    cleaned.includes("relation") ||
    cleaned.includes("PGRES")
  ) {
    return fallback;
  }

  return cleaned || fallback;
}
