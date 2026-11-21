import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clientIpKey,
  rateLimitResponse,
  resetRateLimits,
} from "./rate-limit";

function reqWithHeaders(headers: Record<string, string> = {}) {
  return new Request("https://linkmural.com/api/test", { headers });
}

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("extracts client IP prioritizing Cloudflare, x-forwarded-for and x-real-ip", () => {
    expect(
      clientIpKey(
        new Headers({
          "cf-connecting-ip": "1.2.3.4",
          "x-forwarded-for": "5.6.7.8, 9.9.9.9",
        }),
      ),
    ).toBe("1.2.3.4");
    expect(
      clientIpKey(new Headers({ "x-forwarded-for": "5.6.7.8, 9.9.9.9" })),
    ).toBe("5.6.7.8");
    expect(clientIpKey(new Headers({ "x-real-ip": "10.0.0.1" }))).toBe(
      "10.0.0.1",
    );
    expect(clientIpKey(new Headers())).toBe("local");
  });

  it("allows requests up to the limit and blocks afterwards until window resets", () => {
    const req = reqWithHeaders({ "x-forwarded-for": "203.0.113.10" });
    const opts = { bucket: "test", limit: 2, windowMs: 60_000 };
    const t0 = 1_700_000_000_000;

    const r1 = checkRateLimit(req, opts, t0);
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.remaining).toBe(1);

    const r2 = checkRateLimit(req, opts, t0 + 1_000);
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.remaining).toBe(0);

    const r3 = checkRateLimit(req, opts, t0 + 2_000);
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.retryAfterSeconds).toBe(58);

    // After the window expires, the counter resets.
    const r4 = checkRateLimit(req, opts, t0 + 60_001);
    expect(r4.ok).toBe(true);
  });

  it("isolates different buckets and different IPs", () => {
    const reqA = reqWithHeaders({ "x-forwarded-for": "198.51.100.1" });
    const reqB = reqWithHeaders({ "x-forwarded-for": "198.51.100.2" });
    const t0 = 1_700_000_000_000;

    expect(
      checkRateLimit(reqA, { bucket: "report", limit: 1, windowMs: 10_000 }, t0)
        .ok,
    ).toBe(true);
    expect(
      checkRateLimit(reqA, { bucket: "report", limit: 1, windowMs: 10_000 }, t0)
        .ok,
    ).toBe(false);
    expect(
      checkRateLimit(reqB, { bucket: "report", limit: 1, windowMs: 10_000 }, t0)
        .ok,
    ).toBe(true);
    expect(
      checkRateLimit(
        reqA,
        { bucket: "waitlist", limit: 1, windowMs: 10_000 },
        t0,
      ).ok,
    ).toBe(true);
  });

  it("builds 429 responses with Retry-After and optional JSON body", async () => {
    const empty = rateLimitResponse(30);
    expect(empty.status).toBe(429);
    expect(empty.headers.get("Retry-After")).toBe("30");

    const json = rateLimitResponse(15, "Muitas tentativas.");
    expect(json.status).toBe(429);
    expect(await json.json()).toEqual({ error: "Muitas tentativas." });
  });
});
