import "server-only";

export type SafeBrowsingResult =
  { safe: true } | { safe: false; reason: string };

/**
 * Checks a URL against Google Safe Browsing v4 when GOOGLE_SAFE_BROWSING_KEY
 * is configured. Fails open on network errors so legitimate users are never
 * blocked by transient API outages.
 */
export async function checkSafeUrl(url: string): Promise<SafeBrowsingResult> {
  if (!/^https?:\/\//i.test(url)) return { safe: true };
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) return { safe: true };

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(4000),
        body: JSON.stringify({
          client: { clientId: "linkmural", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );

    if (!res.ok) return { safe: true };
    const data = (await res.json()) as { matches?: unknown[] };
    if (Array.isArray(data.matches) && data.matches.length > 0) {
      return {
        safe: false,
        reason:
          "Esse link foi identificado como potencialmente perigoso e não pode ser salvo.",
      };
    }
    return { safe: true };
  } catch {
    return { safe: true };
  }
}
