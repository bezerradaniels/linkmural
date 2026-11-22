import { z } from "zod";

export const RICH_BLOCK_KINDS = ["gallery", "youtube", "service"] as const;
export type RichBlockKind = (typeof RICH_BLOCK_KINDS)[number];

export function isRichBlockKind(
  kind: string | null | undefined,
): kind is RichBlockKind {
  return (
    kind === "gallery" || kind === "youtube" || kind === "service"
  );
}

/**
 * Extracts an 11-character YouTube video ID from standard watch, short, shorts,
 * embed or live URLs.
 */
export function extractYoutubeId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const u = new URL(candidate);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      if (
        parts.length >= 2 &&
        (parts[0] === "shorts" ||
          parts[0] === "embed" ||
          parts[0] === "live" ||
          parts[0] === "v")
      ) {
        const id = parts[1];
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export const galleryImageSchema = z.object({
  url: z.string().trim().url("URL de imagem inválida.").max(2048),
  caption: z.string().trim().max(80).optional().default(""),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

export const galleryDataSchema = z.object({
  images: z
    .array(galleryImageSchema)
    .min(1, "Adicione pelo menos 1 foto na galeria.")
    .max(10, "Máximo de 10 fotos por galeria."),
});

export type GalleryData = z.infer<typeof galleryDataSchema>;

export function parseGalleryData(raw: unknown): GalleryData {
  const parsed = galleryDataSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { images: [] };
}

export const youtubeDataSchema = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
});

export function parseYoutubeVideoId(
  rawData: unknown,
  fallbackUrl?: string | null,
): string | null {
  const parsed = youtubeDataSchema.safeParse(rawData);
  if (parsed.success) return parsed.data.videoId;
  return fallbackUrl ? extractYoutubeId(fallbackUrl) : null;
}

export const serviceDataSchema = z.object({
  price: z.string().trim().max(32).optional().default(""),
  duration: z.string().trim().max(32).optional().default(""),
  ctaLabel: z.string().trim().max(40).optional().default("Solicitar"),
  badge: z.string().trim().max(28).optional().default(""),
});

export type ServiceData = z.infer<typeof serviceDataSchema>;

export function parseServiceData(raw: unknown): ServiceData {
  const parsed = serviceDataSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { price: "", duration: "", ctaLabel: "Solicitar", badge: "" };
}
