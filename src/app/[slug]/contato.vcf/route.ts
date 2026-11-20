import { recordEvent } from "@/lib/events";
import { getPublicPage } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";
import { buildVCard } from "@/lib/vcard";

/** "Salvar contato": downloads the page's vCard and counts a contact event. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) return new Response("Página não encontrada", { status: 404 });

  recordEvent(request, { pageId: page.id, event: "contact" });

  return new Response(buildVCard(page, `${siteUrl()}/${page.slug}`), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${page.slug}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
