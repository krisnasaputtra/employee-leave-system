/**
 * Check if an error is a Next.js internal error (redirect or notFound).
 * These must be re-thrown so Next.js can handle them properly.
 */
export function isNextInternalError(error: unknown): boolean {
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string"
  ) {
    const digest = (error as { digest: string }).digest;
    return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
  }
  return false;
}
