import { z } from "zod";

/*
 * Recognizes a pasted address and suggests kind, icon and title
 * (docs/HANDOFF.md §8). Data mirrors design/link-icons.json; a test keeps
 * them in sync.
 */

export type LinkKind =
  "link" | "whatsapp" | "contact" | "pix" | "email" | "phone" | "map";

export type Detected = {
  kind: LinkKind;
  /** Normalized value to store in links.url (a URL, or the Pix key). */
  url: string;
  icon: string;
  title: string;
  pix?: { type: PixType; key: string };
};

export const DOMAINS: { host: string; icon: string; title: string }[] = [
  { host: "instagram.com", icon: "si:instagram", title: "Instagram" },
  { host: "instagr.am", icon: "si:instagram", title: "Instagram" },
  { host: "wa.me", icon: "si:whatsapp", title: "WhatsApp" },
  { host: "api.whatsapp.com", icon: "si:whatsapp", title: "WhatsApp" },
  { host: "whatsapp.com", icon: "si:whatsapp", title: "WhatsApp" },
  { host: "facebook.com", icon: "si:facebook", title: "Facebook" },
  { host: "fb.com", icon: "si:facebook", title: "Facebook" },
  { host: "m.me", icon: "si:messenger", title: "Messenger" },
  { host: "tiktok.com", icon: "si:tiktok", title: "TikTok" },
  { host: "youtube.com", icon: "si:youtube", title: "YouTube" },
  { host: "youtu.be", icon: "si:youtube", title: "YouTube" },
  { host: "t.me", icon: "si:telegram", title: "Telegram" },
  { host: "telegram.me", icon: "si:telegram", title: "Telegram" },
  { host: "x.com", icon: "si:x", title: "X" },
  { host: "twitter.com", icon: "si:x", title: "X" },
  { host: "threads.net", icon: "si:threads", title: "Threads" },
  { host: "threads.com", icon: "si:threads", title: "Threads" },
  { host: "pinterest.com", icon: "si:pinterest", title: "Pinterest" },
  { host: "pin.it", icon: "si:pinterest", title: "Pinterest" },
  { host: "open.spotify.com", icon: "si:spotify", title: "Spotify" },
  { host: "discord.gg", icon: "si:discord", title: "Discord" },
  { host: "discord.com", icon: "si:discord", title: "Discord" },
  { host: "twitch.tv", icon: "si:twitch", title: "Twitch" },
  { host: "music.apple.com", icon: "si:applemusic", title: "Apple Music" },
  { host: "deezer.com", icon: "si:deezer", title: "Deezer" },
  { host: "soundcloud.com", icon: "si:soundcloud", title: "SoundCloud" },
  { host: "behance.net", icon: "si:behance", title: "Behance" },
  { host: "dribbble.com", icon: "si:dribbble", title: "Dribbble" },
  { host: "github.com", icon: "si:github", title: "GitHub" },
  {
    host: "link.mercadopago.com.br",
    icon: "si:mercadopago",
    title: "Mercado Pago",
  },
  { host: "mpago.la", icon: "si:mercadopago", title: "Mercado Pago" },
  { host: "picpay.me", icon: "si:picpay", title: "PicPay" },
  { host: "nubank.com.br", icon: "si:nubank", title: "Nubank" },
  { host: "ifood.com.br", icon: "si:ifood", title: "iFood" },
  { host: "shopee.com.br", icon: "si:shopee", title: "Shopee" },
  { host: "maps.google.com", icon: "si:googlemaps", title: "Como chegar" },
  { host: "maps.app.goo.gl", icon: "si:googlemaps", title: "Como chegar" },
  { host: "goo.gl/maps", icon: "si:googlemaps", title: "Como chegar" },
  { host: "waze.com", icon: "si:waze", title: "Waze" },
  { host: "calendly.com", icon: "si:calendly", title: "Agendar" },
  { host: "tripadvisor.com", icon: "si:tripadvisor", title: "Tripadvisor" },
  { host: "tripadvisor.com.br", icon: "si:tripadvisor", title: "Tripadvisor" },
  { host: "airbnb.com", icon: "si:airbnb", title: "Airbnb" },
  { host: "airbnb.com.br", icon: "si:airbnb", title: "Airbnb" },
  { host: "linkedin.com", icon: "lm:linkedin", title: "LinkedIn" },
  { host: "kwai.com", icon: "lm:kwai", title: "Kwai" },
];

const KIND_BY_ICON: Record<string, LinkKind> = {
  "si:whatsapp": "whatsapp",
  "si:googlemaps": "map",
  "si:waze": "map",
};

// ---------------------------------------------------------------------------
// Pix keys
// ---------------------------------------------------------------------------

export type PixType = "cpf" | "cnpj" | "email" | "phone" | "random";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function isValidCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights =
      len === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

const EMAIL_RE = /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]{2,}$/i;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Detects a Pix key typed without a URL. Returns its normalized form. */
export function detectPixKey(
  input: string,
): { type: PixType; key: string } | null {
  const value = input.trim();
  if (!value || value.includes("://")) return null;
  if (UUID_RE.test(value)) return { type: "random", key: value.toLowerCase() };
  if (EMAIL_RE.test(value)) return { type: "email", key: value.toLowerCase() };
  // Phone keys are stored with the +55 country code.
  if (/^\+55[\s\d().-]+$/.test(value)) {
    const digits = onlyDigits(value);
    if (digits.length === 12 || digits.length === 13)
      return { type: "phone", key: `+${digits}` };
  }
  if (/^[\d.\-/\s]+$/.test(value)) {
    if (isValidCpf(value)) return { type: "cpf", key: onlyDigits(value) };
    if (isValidCnpj(value)) return { type: "cnpj", key: onlyDigits(value) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

/** Adds https:// when missing and drops "www.". Returns null when it is not a usable URL. */
export function normalizeUrl(input: string): URL | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  if (/^(tel|mailto):/i.test(value)) {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") || url.hostname.endsWith(".")) return null;
    url.hostname = url.hostname.replace(/^www\./i, "");
    return url;
  } catch {
    return null;
  }
}

function matchDomain(url: URL) {
  const host = url.hostname.toLowerCase();
  const hostPath = `${host}${url.pathname}`.toLowerCase();
  return DOMAINS.find((d) =>
    d.host.includes("/")
      ? hostPath === d.host || hostPath.startsWith(`${d.host}/`)
      : host === d.host || host.endsWith(`.${d.host}`),
  );
}

/**
 * Suggests kind, icon and title for what the person pasted. Order:
 * Pix key, tel:/mailto:, known domain (subdomains too), .pdf, any other URL.
 * Returns null when the input is neither a URL nor a Pix key.
 */
export function detectLink(input: string): Detected | null {
  const pix = detectPixKey(input);
  if (pix)
    return {
      kind: "pix",
      url: pix.key,
      icon: "si:pix",
      title: "Pagar com Pix",
      pix,
    };

  const url = normalizeUrl(input);
  if (!url) return null;

  if (url.protocol === "tel:")
    return { kind: "phone", url: url.href, icon: "lm:phone", title: "Ligar" };
  if (url.protocol === "mailto:")
    return { kind: "email", url: url.href, icon: "lm:mail", title: "E-mail" };

  const domain = matchDomain(url);
  if (domain) {
    return {
      kind: KIND_BY_ICON[domain.icon] ?? "link",
      url: url.href,
      icon: domain.icon,
      title: domain.title,
    };
  }
  if (url.pathname.toLowerCase().endsWith(".pdf")) {
    return { kind: "link", url: url.href, icon: "lm:pdf", title: "PDF" };
  }
  return { kind: "link", url: url.href, icon: "lm:link", title: url.hostname };
}

/** What may be saved in links.url: http(s), tel:, mailto: or a Pix key (§8). */
export const linkUrlSchema = z
  .string()
  .trim()
  .min(1, "Cole um endereço.")
  .max(2048, "Endereço muito longo.")
  .refine(
    (value) => detectLink(value) !== null,
    "Esse endereço não parece válido. Confira e tente de novo.",
  );
