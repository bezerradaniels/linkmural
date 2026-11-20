import { z } from "zod";

/*
 * Slug normalization, validation, suggestion candidates and hold cookie
 * serialization for the landing page and onboarding (docs/FASE-2.md §A).
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 30;
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
export const SLUG_HOLD_COOKIE = "lm_slug_hold";
export const SLUG_HOLD_MINUTES = 30;

export type SlugStatus = "livre" | "invalido" | "reservado" | "ocupado";

/**
 * Normalizes while the person is typing: lowercase, strips accents,
 * turns spaces/underscores into hyphens, removes invalid characters,
 * collapses consecutive hyphens, strips leading hyphens, caps at 30 chars.
 * Keeps a single trailing hyphen while typing so space -> hyphen feels natural.
 */
export function normalizeSlugInput(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, SLUG_MAX);
}

/** Final normalized slug (also trims trailing hyphens). */
export function finalizeSlug(raw: string): string {
  return normalizeSlugInput(raw).replace(/-+$/, "");
}

/** Rules: 3–30 chars, lowercase letters/digits/hyphen, no `--`, no leading/trailing `-`. */
export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !slug.includes("--");
}

export const slugSchema = z
  .string()
  .transform(finalizeSlug)
  .refine(
    isValidSlug,
    "Use de 3 a 30 letras minúsculas, números ou hífen (sem hífen duplo ou nas pontas).",
  );

function clipCandidate(prefix: string, base: string, suffix: string): string {
  const maxBase = SLUG_MAX - prefix.length - suffix.length;
  if (maxBase < 1) return "";
  const trimmedBase = base.slice(0, maxBase).replace(/^-+|-+$/g, "");
  if (!trimmedBase) return "";
  return `${prefix}${trimmedBase}${suffix}`
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Deterministic candidate suggestions when a slug is taken or reserved.
 * The server filters these against reserved_slugs, pages and active holds
 * and returns up to 3 free options.
 */
export function buildSlugCandidates(rawSlug: string): string[] {
  const base = finalizeSlug(rawSlug);
  if (!base) return [];

  const compact = base.replace(/-/g, "");
  const variants = [
    clipCandidate("", base, "-oficial"),
    clipCandidate("", compact || base, "br"),
    clipCandidate("meu", compact || base, ""),
    clipCandidate("", base, "-br"),
    clipCandidate("sou", compact || base, ""),
    clipCandidate("", base, "-app"),
    clipCandidate("", base, "2"),
    clipCandidate("", base, "1"),
  ];

  const seen = new Set<string>([base]);
  const out: string[] = [];
  for (const v of variants) {
    if (!v || seen.has(v) || !isValidSlug(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SlugHold = { slug: string; token: string };

export function serializeHoldCookie(slug: string, token: string): string {
  return `${slug}.${token}`;
}

export function parseHoldCookie(
  raw: string | undefined | null,
): SlugHold | null {
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  const slug = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  if (!isValidSlug(slug) || !UUID_RE.test(token)) return null;
  return { slug, token };
}
