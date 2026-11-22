import { buildModel } from "@/lib/public-actions";
import type { PublicPage } from "@/lib/public-page";
import { resolveTheme } from "@/lib/theme";
import { PageShell } from "./parts";
import { Balcao, Cartao, Mosaico } from "./templates";

const TEMPLATES = { balcao: Balcao, mosaico: Mosaico, cartao: Cartao };

/** Renders a public page with its template, style and plan rules. */
export function PublicPageView({
  page,
  pageUrl,
  now,
  preview = false,
}: {
  page: PublicPage;
  pageUrl: string;
  now?: Date;
  preview?: boolean;
}) {
  const theme = resolveTheme(page.style, page.theme, page.plan, page.template);
  const model = buildModel(page, now);
  const Template = TEMPLATES[page.template] ?? Balcao;
  return (
    <PageShell page={page} theme={theme} preview={preview}>
      <Template page={page} model={model} theme={theme} pageUrl={pageUrl} />
    </PageShell>
  );
}
