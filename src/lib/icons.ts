import {
  siAirbnb,
  siApplemusic,
  siBehance,
  siCalendly,
  siDeezer,
  siDiscord,
  siDribbble,
  siFacebook,
  siGithub,
  siGmail,
  siGooglemaps,
  siIfood,
  siInstagram,
  siMercadopago,
  siMessenger,
  siNubank,
  siPicpay,
  siPinterest,
  siPix,
  siShopee,
  siSoundcloud,
  siSpotify,
  siTelegram,
  siThreads,
  siTiktok,
  siTripadvisor,
  siTwitch,
  siWaze,
  siWhatsapp,
  siX,
  siYoutube,
} from "simple-icons";
import { ICON_PATHS } from "@/components/ui/icons";

/*
 * Link icons: "si:<slug>" = official brand logo (Simple Icons, filled, 24px),
 * "lm:<name>" = Linkmural stroke icon. Only the icons listed here are bundled.
 * Brand logos are trademarks: use them only to point at the customer's own profile.
 */

type SimpleIcon = { title: string; path: string; hex: string };

const BRANDS: Record<string, SimpleIcon> = {
  instagram: siInstagram,
  whatsapp: siWhatsapp,
  facebook: siFacebook,
  messenger: siMessenger,
  tiktok: siTiktok,
  youtube: siYoutube,
  telegram: siTelegram,
  x: siX,
  threads: siThreads,
  pinterest: siPinterest,
  spotify: siSpotify,
  discord: siDiscord,
  twitch: siTwitch,
  applemusic: siApplemusic,
  deezer: siDeezer,
  soundcloud: siSoundcloud,
  behance: siBehance,
  dribbble: siDribbble,
  github: siGithub,
  mercadopago: siMercadopago,
  picpay: siPicpay,
  nubank: siNubank,
  ifood: siIfood,
  shopee: siShopee,
  googlemaps: siGooglemaps,
  waze: siWaze,
  calendly: siCalendly,
  tripadvisor: siTripadvisor,
  airbnb: siAirbnb,
  gmail: siGmail,
  pix: siPix,
};

/** Stroke icons offered for links. */
export const LINE_ICON_NAMES = [
  "phone",
  "mail",
  "map",
  "contact",
  "calendar",
  "shop",
  "menu",
  "catalog",
  "portfolio",
  "site",
  "coupon",
  "pdf",
  "ticket",
  "linkedin",
  "kwai",
  "reviews",
  "payment",
  "link",
] as const;
export type LineIconName = (typeof LINE_ICON_NAMES)[number];

/** Brands whose official color is black or near-black: they follow the text color. */
const MONO = new Set(["tiktok", "x", "threads", "github"]);

export type ResolvedIcon =
  | {
      type: "brand";
      slug: string;
      title: string;
      path: string;
      hex: string;
      mono: boolean;
    }
  | { type: "line"; name: LineIconName; path: string };

const FALLBACK: ResolvedIcon = {
  type: "line",
  name: "link",
  path: ICON_PATHS.link,
};

function isLineIcon(name: string): name is LineIconName {
  return (LINE_ICON_NAMES as readonly string[]).includes(name);
}

/** Turns links.icon ("si:instagram", "lm:calendar") into drawable data. */
export function resolveIcon(ref: string | null | undefined): ResolvedIcon {
  if (!ref) return FALLBACK;
  const [prefix, name = ""] = ref.split(":");
  if (prefix === "si" && name in BRANDS) {
    const icon = BRANDS[name];
    return {
      type: "brand",
      slug: name,
      title: icon.title,
      path: icon.path,
      hex: `#${icon.hex}`,
      mono: MONO.has(name),
    };
  }
  if (prefix === "lm" && isLineIcon(name)) {
    return { type: "line", name, path: ICON_PATHS[name] };
  }
  return FALLBACK;
}

/** True when the reference points at an icon we can draw. */
export function isKnownIcon(ref: string): boolean {
  const [prefix, name = ""] = ref.split(":");
  return (
    (prefix === "si" && name in BRANDS) || (prefix === "lm" && isLineIcon(name))
  );
}

/**
 * Color for a brand logo: its official color (default) or the style text color.
 * Black brands always use the text color so they work on dark styles.
 */
export function brandColor(
  icon: ResolvedIcon,
  iconColor: "brand" | "style",
): string {
  if (icon.type !== "brand" || iconColor === "style" || icon.mono)
    return "currentColor";
  return icon.hex;
}

/** Icon picker groups (docs/HANDOFF.md §8). */
export const ICON_GROUPS: Record<string, string[]> = {
  "Redes sociais": [
    "si:instagram",
    "si:whatsapp",
    "si:facebook",
    "si:tiktok",
    "si:youtube",
    "si:telegram",
    "si:x",
    "si:threads",
    "si:pinterest",
    "si:spotify",
    "si:discord",
    "si:twitch",
  ],
  "Pagamentos e compras": [
    "si:pix",
    "si:mercadopago",
    "si:picpay",
    "si:nubank",
    "si:ifood",
    "si:shopee",
  ],
  Serviços: [
    "si:googlemaps",
    "si:waze",
    "si:calendly",
    "si:gmail",
    "si:tripadvisor",
    "si:airbnb",
  ],
  "Contato e negócio": LINE_ICON_NAMES.map((n) => `lm:${n}`),
};

/** Search synonyms (accent-free, lower case) → icon. Source: design/link-icons.json. */
export const ICON_SYNONYMS: Record<string, string> = {
  zap: "si:whatsapp",
  whats: "si:whatsapp",
  insta: "si:instagram",
  face: "si:facebook",
  yt: "si:youtube",
  tik: "si:tiktok",
  mapa: "si:googlemaps",
  endereco: "lm:map",
  menu: "lm:menu",
  cardapio: "lm:menu",
  pagar: "si:pix",
  pix: "si:pix",
  agenda: "lm:calendar",
  agendar: "lm:calendar",
  loja: "lm:shop",
  site: "lm:site",
  cupom: "lm:coupon",
  ingresso: "lm:ticket",
  avaliacao: "lm:reviews",
  catalogo: "lm:catalog",
  portfolio: "lm:portfolio",
  telefone: "lm:phone",
  email: "lm:mail",
};
