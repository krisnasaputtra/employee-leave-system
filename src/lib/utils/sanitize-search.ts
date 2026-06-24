/**
 * Sanitize search input for use in Supabase PostgREST filter strings.
 * Strips characters that have special meaning in PostgREST filter syntax.
 */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,.()\\/"']/g, '').trim();
}
