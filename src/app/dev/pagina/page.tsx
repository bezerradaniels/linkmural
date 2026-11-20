import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageView } from "@/components/public-page/PublicPageView";
import { demoPage } from "@/lib/demo-page";
import {
  STYLE_KEYS,
  STYLES,
  TEMPLATES,
  type StyleKey,
  type TemplateKey,
} from "@/lib/styles";

export const metadata: Metadata = {
  title: "Modelos",
  robots: { index: false },
};

/** Public page preview: 3 templates × 8 styles with demo data. Development only. */
export default async function DevPaginaPage({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string; estilo?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const template = (
    params.modelo && params.modelo in TEMPLATES ? params.modelo : "balcao"
  ) as TemplateKey;
  const style = (
    params.estilo && params.estilo in STYLES ? params.estilo : "sport"
  ) as StyleKey;

  return (
    <>
      <nav
        aria-label="Combinações"
        className="sticky top-0 z-20 flex flex-wrap gap-1.5 border-b border-line bg-paper/95 p-2 text-[12px] backdrop-blur"
      >
        {(Object.keys(TEMPLATES) as TemplateKey[]).map((t) => (
          <Link
            key={t}
            href={`?modelo=${t}&estilo=${style}`}
            className={`rounded-pill px-2.5 py-1 ${t === template ? "bg-ink text-paper" : "bg-surface"}`}
          >
            {TEMPLATES[t]}
          </Link>
        ))}
        <span className="mx-1 text-ink-muted">|</span>
        {STYLE_KEYS.map((s) => (
          <Link
            key={s}
            href={`?modelo=${template}&estilo=${s}`}
            className={`rounded-pill px-2.5 py-1 ${s === style ? "bg-ink text-paper" : "bg-surface"}`}
          >
            {STYLES[s].label}
          </Link>
        ))}
      </nav>
      <PublicPageView
        page={demoPage(template, style)}
        pageUrl="https://linkmural.com/studioforca"
      />
    </>
  );
}
