export type UnsplashPhoto = {
  id: string;
  thumbUrl: string;
  regularUrl: string;
  alt: string;
  color: string;
  authorName: string;
  authorUrl: string;
  unsplashUrl: string;
  downloadLocation: string | null;
};

export const UNSPLASH_UTM = "utm_source=linkmural&utm_medium=referral";
export const UNSPLASH_HOME_URL = `https://unsplash.com/?${UNSPLASH_UTM}`;

export const UNSPLASH_TOPICS = [
  { label: "Café & Bistrô", query: "coffee shop aesthetic" },
  { label: "Academia & Fitness", query: "fitness gym studio" },
  { label: "Estética & Beleza", query: "beauty spa skincare" },
  { label: "Escritório & Negócios", query: "modern workspace architecture" },
  { label: "Moda & Estilo", query: "fashion editorial minimal" },
  { label: "Minimalista", query: "minimal abstract texture" },
  { label: "Restaurante", query: "restaurant food table" },
  { label: "Natureza", query: "nature calm landscape" },
] as const;

export function isUnsplashCdnUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "images.unsplash.com"
    );
  } catch {
    return false;
  }
}

export function isAllowedBgImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (isUnsplashCdnUrl(url)) return true;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.pathname.startsWith("/storage/v1/object/public/media/")
    );
  } catch {
    return false;
  }
}

export function isValidUnsplashDownloadUrl(
  url: string | null | undefined,
): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "api.unsplash.com" &&
      /^\/photos\/[A-Za-z0-9_-]+\/download$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

type RawUnsplashApiPhoto = {
  id?: unknown;
  color?: unknown;
  alt_description?: unknown;
  description?: unknown;
  urls?: {
    small?: unknown;
    regular?: unknown;
  } | null;
  user?: {
    name?: unknown;
    username?: unknown;
  } | null;
  links?: {
    download_location?: unknown;
  } | null;
};

export function mapUnsplashApiPhoto(
  raw: RawUnsplashApiPhoto,
): UnsplashPhoto | null {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  const thumbUrl =
    typeof raw.urls?.small === "string" ? raw.urls.small : null;
  const regularUrl =
    typeof raw.urls?.regular === "string" ? raw.urls.regular : null;
  if (!id || !thumbUrl || !regularUrl) return null;

  const authorName =
    typeof raw.user?.name === "string" && raw.user.name.trim()
      ? raw.user.name.trim()
      : "Unsplash";
  const username =
    typeof raw.user?.username === "string" && raw.user.username.trim()
      ? raw.user.username.trim()
      : "";
  const authorUrl = username
    ? `https://unsplash.com/@${encodeURIComponent(username)}?${UNSPLASH_UTM}`
    : UNSPLASH_HOME_URL;

  const rawColor = typeof raw.color === "string" ? raw.color : "";
  const color = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : "#1E2229";
  const alt =
    (typeof raw.alt_description === "string" && raw.alt_description) ||
    (typeof raw.description === "string" && raw.description) ||
    `Foto por ${authorName} no Unsplash`;
  const dl =
    typeof raw.links?.download_location === "string" &&
    isValidUnsplashDownloadUrl(raw.links.download_location)
      ? raw.links.download_location
      : null;

  return {
    id,
    thumbUrl,
    regularUrl,
    alt: alt.slice(0, 140),
    color,
    authorName,
    authorUrl,
    unsplashUrl: UNSPLASH_HOME_URL,
    downloadLocation: dl,
  };
}

/** Curated Unsplash photos shown immediately before typing or as fallback. */
export const CURATED_UNSPLASH_PHOTOS: UnsplashPhoto[] = [
  {
    id: "curated-coffee",
    thumbUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
    regularUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1280&q=82",
    alt: "Cafeteria aconchegante com iluminação quente",
    color: "#2C1E16",
    authorName: "Nafinia Putra",
    authorUrl: `https://unsplash.com/@nafinia?${UNSPLASH_UTM}`,
    unsplashUrl: UNSPLASH_HOME_URL,
    downloadLocation: null,
  },
  {
    id: "curated-gym",
    thumbUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
    regularUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1280&q=82",
    alt: "Estúdio de treino moderno e equipamentos",
    color: "#1B1E24",
    authorName: "Danielle Cerullo",
    authorUrl: `https://unsplash.com/@dcerullo?${UNSPLASH_UTM}`,
    unsplashUrl: UNSPLASH_HOME_URL,
    downloadLocation: null,
  },
  {
    id: "curated-spa",
    thumbUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
    regularUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1280&q=82",
    alt: "Ambiente de estética, spa e bem-estar",
    color: "#D8CFC4",
    authorName: "Alan Caishan",
    authorUrl: `https://unsplash.com/@caishan?${UNSPLASH_UTM}`,
    unsplashUrl: UNSPLASH_HOME_URL,
    downloadLocation: null,
  },
  {
    id: "curated-workspace",
    thumbUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    regularUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=82",
    alt: "Escritório moderno com luz natural",
    color: "#2B3036",
    authorName: "alesia kazantceva",
    authorUrl: `https://unsplash.com/@alesiaskaz?${UNSPLASH_UTM}`,
    unsplashUrl: UNSPLASH_HOME_URL,
    downloadLocation: null,
  },
  {
    id: "curated-minimal",
    thumbUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
    regularUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1280&q=82",
    alt: "Arquitetura minimalista em tons neutros",
    color: "#E4DDD3",
    authorName: "jean wimmerlin",
    authorUrl: `https://unsplash.com/@jwimmerli?${UNSPLASH_UTM}`,
    unsplashUrl: UNSPLASH_HOME_URL,
    downloadLocation: null,
  },
  {
    id: "curated-nature",
    thumbUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    regularUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1280&q=82",
    alt: "Paisagem natural serena ao amanhecer",
    color: "#223A48",
    authorName: "Sean Oulashin",
    authorUrl: `https://unsplash.com/@oulashin?${UNSPLASH_UTM}`,
    unsplashUrl: UNSPLASH_HOME_URL,
    downloadLocation: null,
  },
];
