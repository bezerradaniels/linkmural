import { openStatus, type OpenStatus } from "./hours";
import type { PublicLink, PublicPage } from "./public-page";

/** Digits only, with Brazil's country code when it is missing. */
export function phoneDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

/** (11) 99999-0000 for Brazilian numbers, +<digits> otherwise. */
export function formatPhone(digits: string): string {
  const local = digits.startsWith("55") ? digits.slice(2) : null;
  if (local && (local.length === 10 || local.length === 11)) {
    const ddd = local.slice(0, 2);
    const rest = local.slice(2);
    const cut = rest.length - 4;
    return `(${ddd}) ${rest.slice(0, cut)}-${rest.slice(cut)}`;
  }
  return `+${digits}`;
}

export function linkHref(link: PublicLink) {
  return `/l/${link.id}`;
}

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}

export type PageModel = {
  name: string;
  initials: string;
  status: OpenStatus | null;
  place: string | null;
  featured: PublicLink | null;
  /** Links shown in the list or grid (not the featured one, not the WhatsApp action). */
  links: PublicLink[];
  whatsapp: { href: string; tracked: boolean } | null;
  call: { href: string; label: string } | null;
  directions: { href: string; label: string } | null;
  email: { href: string; label: string } | null;
  contactHref: string;
};

/** Everything the three templates need, derived once from the page row. */
export function buildModel(
  page: PublicPage,
  now: Date = new Date(),
): PageModel {
  const name = page.business_name.trim() || page.slug;
  const featured =
    page.links.find((l) => l.featured && l.kind !== "pix") ?? null;
  const waLink = page.links.find((l) => l.kind === "whatsapp") ?? null;
  const digits = phoneDigits(page.whatsapp);

  const whatsapp = waLink
    ? { href: linkHref(waLink), tracked: true }
    : digits
      ? { href: `https://wa.me/${digits}`, tracked: false }
      : null;

  const placeParts = [page.address, page.city].filter(Boolean) as string[];
  const place = page.city ?? page.address ?? null;
  const directions = placeParts.length
    ? {
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeParts.join(", "))}`,
        label: placeParts.join(" · "),
      }
    : null;

  return {
    name,
    initials: initialsOf(name),
    status:
      openStatus(page.hours, now) ??
      (page.status_text ? { open: true, label: page.status_text } : null),
    place,
    featured,
    links: page.links.filter((l) => l !== featured && l !== waLink),
    whatsapp,
    call: digits
      ? { href: `tel:+${digits}`, label: formatPhone(digits) }
      : null,
    directions,
    email: page.email
      ? { href: `mailto:${page.email}`, label: page.email }
      : null,
    contactHref: `/${page.slug}/contato.vcf`,
  };
}
