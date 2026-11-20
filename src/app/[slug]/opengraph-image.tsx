import { ImageResponse } from "next/og";
import { buildModel } from "@/lib/public-actions";
import { getPublicPage } from "@/lib/public-page";
import { resolveTheme } from "@/lib/theme";

export const alt = "Página no linkmural";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image: name, logo or initials and the style's colors. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  const palette = resolveTheme(page?.style, page?.theme, page?.plan).palette;
  const model = page ? buildModel(page) : null;
  // Satori cannot draw WebP; fall back to initials for those.
  const avatar =
    page?.avatarUrl && !/\.webp($|\?)/i.test(page.avatarUrl)
      ? page.avatarUrl
      : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: palette.bg,
        color: palette.ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: 48,
            background: palette.accent,
            color: palette.onAccent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              width={180}
              height={180}
              alt=""
              style={{ objectFit: "cover" }}
            />
          ) : (
            (model?.initials ?? "lm")
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 820,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
            {model?.name ?? "linkmural"}
          </div>
          {page?.kind && (
            <div style={{ fontSize: 36, color: palette.muted }}>
              {page.kind}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 32,
        }}
      >
        <div style={{ color: palette.muted }}>
          {page ? `linkmural.com/${page.slug}` : "linkmural.com"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              background: "#CDF54A",
            }}
          />
          linkmural
        </div>
      </div>
    </div>,
    size,
  );
}
