import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/events";
import { getPublicLink } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";

/** Only these schemes are ever redirected to (never javascript:, data:…). */
function safeTarget(url: string): string | null {
  try {
    const target = new URL(url);
    return ["https:", "http:", "tel:", "mailto:"].includes(target.protocol)
      ? target.href
      : null;
  } catch {
    return null;
  }
}

/** Counts the click (no personal data) and redirects to the link. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { linkId } = await params;
  const link = await getPublicLink(linkId);
  const target = link && link.kind !== "pix" ? safeTarget(link.url) : null;
  if (!link || !target) {
    return NextResponse.redirect(new URL("/", siteUrl()), { status: 302 });
  }

  recordEvent(request, {
    pageId: link.page_id,
    linkId: link.id,
    event: link.kind === "whatsapp" ? "whatsapp" : "click",
  });

  return NextResponse.redirect(target, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
