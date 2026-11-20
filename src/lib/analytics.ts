/*
 * Visit and click metadata without personal data (docs/HANDOFF.md §7.5).
 * Only the referrer host, utm_source, country (cf-ipcountry) and a device
 * class are kept. The user agent is read once to classify, never stored.
 */

export type ClickEvent = "view" | "click" | "whatsapp" | "contact" | "qr";
export type Device = "mobile" | "desktop" | "tablet" | "other";

const BOT_RE =
  /bot|crawler|spider|crawling|preview|facebookexternalhit|facebookcatalog|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|embedly|headless|lighthouse|pagespeed|curl|wget|python-requests|httpclient|go-http-client|axios|node-fetch/i;

/** Crawlers, link previews (WhatsApp, Facebook…) and scripts are not visits. */
export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_RE.test(userAgent);
}

/** Browser prefetch/prerender requests are not clicks. */
export function isPrefetch(headers: Headers): boolean {
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""} ${headers.get("x-purpose") ?? ""}`;
  return (
    /prefetch|prerender|preview/i.test(purpose) ||
    headers.get("next-router-prefetch") !== null
  );
}

/** Coarse device class from the user agent (the UA itself is discarded). */
export function deviceOf(userAgent: string | null | undefined): Device {
  if (!userAgent) return "other";
  if (/ipad|tablet|kindle|silk|playbook|(android(?!.*mobile))/i.test(userAgent))
    return "tablet";
  if (
    /mobi|iphone|ipod|android|windows phone|blackberry|opera mini/i.test(
      userAgent,
    )
  )
    return "mobile";
  if (/windows|macintosh|mac os x|linux|cros|x11/i.test(userAgent))
    return "desktop";
  return "other";
}

/** Hostname of the referrer, without "www.", ignoring our own pages. */
export function referrerHost(
  referrer: string | null | undefined,
  ownHosts: string[] = [],
): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || ownHosts.includes(host)) return null;
    return host.slice(0, 255);
  } catch {
    return null;
  }
}

/** Two-letter country from Cloudflare, or null ("XX"/"T1" mean unknown/Tor). */
export function countryOf(headers: Headers): string | null {
  const code = headers.get("cf-ipcountry")?.toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
}

export function cleanUtm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase().slice(0, 100);
  return /^[a-z0-9._\- ]+$/.test(v) ? v : null;
}
