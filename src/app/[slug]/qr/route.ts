import QRCode from "qrcode";
import { getPublicPage } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";

/** QR code for the page: ?format=svg|png, &download=1 to save it. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) return new Response("Página não encontrada", { status: 404 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "png" ? "png" : "svg";
  const download = searchParams.get("download") === "1";
  const url = `${siteUrl()}/${page.slug}`;
  const options = {
    errorCorrectionLevel: "M" as const,
    margin: 2,
    color: { dark: "#0E0E0E", light: "#FFFFFF" },
  };

  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=86400, s-maxage=604800",
  };
  if (download)
    headers["Content-Disposition"] =
      `attachment; filename="linkmural-${page.slug}.${format}"`;

  if (format === "png") {
    const png = await QRCode.toBuffer(url, {
      ...options,
      type: "png",
      width: 1024,
    });
    return new Response(new Uint8Array(png), {
      headers: { ...headers, "Content-Type": "image/png" },
    });
  }
  const svg = await QRCode.toString(url, { ...options, type: "svg" });
  return new Response(svg, {
    headers: { ...headers, "Content-Type": "image/svg+xml; charset=utf-8" },
  });
}
