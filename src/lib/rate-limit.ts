/**
 * Lightweight in-memory fixed-window rate limiter for public API routes.
 * Keeps keys only in volatile process memory (never written to disk or DB)
 * so IPs are never stored persistently (docs/HANDOFF.md §7.5, §16).
 */

type BucketEntry = {
  count: number;
  resetAt: number;
};

const MAX_STORE_ENTRIES = 5_000;
const store = new Map<string, BucketEntry>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number; resetAt: number };

/** Extracts a transient client key from proxy headers without persisting it. */
export function clientIpKey(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "local";
}

function pruneExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  request: Request,
  options: { bucket: string; limit: number; windowMs: number },
  now: number = Date.now(),
): RateLimitResult {
  if (store.size >= MAX_STORE_ENTRIES) {
    pruneExpired(now);
  }

  const key = `${options.bucket}:${clientIpKey(request.headers)}`;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(0, options.limit - 1), resetAt };
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return { ok: false, retryAfterSeconds, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Builds a 429 response with Retry-After header. */
export function rateLimitResponse(
  retryAfterSeconds: number,
  message?: string,
): Response {
  const headers = {
    "Retry-After": String(retryAfterSeconds),
    "Cache-Control": "no-store",
  };
  if (message) {
    return Response.json({ error: message }, { status: 429, headers });
  }
  return new Response(null, { status: 429, headers });
}

/** Test-only helper to clear in-memory buckets between test cases. */
export function resetRateLimits(): void {
  store.clear();
}
