/** Only allow same-site relative paths ("/app", "/onboarding/3"). Falls back to /app. */
export function safeNext(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512)
    return fallback;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  )
    return fallback;
  return value;
}

/** Public base URL of this deployment (localhost, beta or production). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/** Cookie that remembers where to go after the magic link (same browser). */
export const NEXT_COOKIE = "lm_next";
