export type UtmParams = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/**
 * Normalizes a UTM tag value: removes accents, lowercases, replaces spaces with `_`,
 * keeps `[a-z0-9_-]`, collapses repeated underscores and limits to 64 chars.
 */
export function normalizeUtmValue(raw: string): string {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 64);
}

function parseHttpUrl(rawUrl: string): URL | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(trimmed)) return null;
  // Avoid mistaking Pix keys (random UUIDs, CPF/CNPJ, phone, email) for web URLs.
  if (trimmed.includes("@") && !trimmed.includes("/")) return null;

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname.includes(".")) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** True when `rawUrl` is a web URL (`http:`/`https:`) that supports UTM query params. */
export function supportsUtmUrl(rawUrl: string): boolean {
  return parseHttpUrl(rawUrl) !== null;
}

/** Reads `utm_*` parameters from a URL string. */
export function parseUtmFromUrl(rawUrl: string): UtmParams {
  const parsed = parseHttpUrl(rawUrl);
  if (!parsed) {
    return { source: "", medium: "", campaign: "", content: "", term: "" };
  }
  return {
    source: parsed.searchParams.get("utm_source") ?? "",
    medium: parsed.searchParams.get("utm_medium") ?? "",
    campaign: parsed.searchParams.get("utm_campaign") ?? "",
    content: parsed.searchParams.get("utm_content") ?? "",
    term: parsed.searchParams.get("utm_term") ?? "",
  };
}

/** True when any `utm_*` parameter is present and non-empty on `rawUrl`. */
export function hasUtmParams(rawUrl: string): boolean {
  const parsed = parseHttpUrl(rawUrl);
  if (!parsed) return false;
  return UTM_KEYS.some((key) => {
    const val = parsed.searchParams.get(key);
    return typeof val === "string" && val.trim().length > 0;
  });
}

/**
 * Adds or updates `utm_*` query parameters on `rawUrl`, keeping existing
 * non-UTM query parameters and URL fragments (`#hash`). Empty fields are removed.
 */
export function buildUrlWithUtm(
  rawUrl: string,
  params: Partial<UtmParams>,
): string | null {
  const parsed = parseHttpUrl(rawUrl);
  if (!parsed) return null;

  const map: Record<(typeof UTM_KEYS)[number], string> = {
    utm_source: normalizeUtmValue(params.source ?? ""),
    utm_medium: normalizeUtmValue(params.medium ?? ""),
    utm_campaign: normalizeUtmValue(params.campaign ?? ""),
    utm_content: normalizeUtmValue(params.content ?? ""),
    utm_term: normalizeUtmValue(params.term ?? ""),
  };

  for (const key of UTM_KEYS) {
    const val = map[key];
    if (val) {
      parsed.searchParams.set(key, val);
    } else {
      parsed.searchParams.delete(key);
    }
  }

  return parsed.toString();
}

/** Strips all `utm_*` query parameters while keeping the rest of the URL intact. */
export function stripUtmFromUrl(rawUrl: string): string {
  const parsed = parseHttpUrl(rawUrl);
  if (!parsed) return rawUrl;
  for (const key of UTM_KEYS) {
    parsed.searchParams.delete(key);
  }
  return parsed.toString();
}
