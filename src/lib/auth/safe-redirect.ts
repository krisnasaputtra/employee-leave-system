const DEFAULT_REDIRECT = "/dashboard";

export function getSafeRedirectUrl(redirectTo: string | null | undefined): string {
  if (!redirectTo) return DEFAULT_REDIRECT;
  const trimmed = redirectTo.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return DEFAULT_REDIRECT;
  if (/[a-z]+:/i.test(trimmed.split("/")[1] ?? "")) return DEFAULT_REDIRECT;
  if (trimmed.includes("\\")) return DEFAULT_REDIRECT;
  return trimmed;
}
