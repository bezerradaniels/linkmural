import { siteUrl } from "@/lib/redirect";
import { buildLlmsFullTxt } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const body = buildLlmsFullTxt(siteUrl());
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
