import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import {
  COMPARISON_SLUGS,
  COMPARISONS,
  getComparisonBySlug,
} from "@/lib/comparisons";
import { getNicheBySlug } from "@/lib/niches";
import { siteUrl } from "@/lib/redirect";
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildSoftwareApplicationSchema,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISON_SLUGS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getComparisonBySlug(slug);
  if (!item) return { title: "Comparativo não encontrado" };

  const url = `${siteUrl()}/comparar/${item.slug}`;
  return {
    title: item.metaTitle,
    description: item.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `${item.metaTitle} · linkmural`,
      description: item.metaDescription,
      url,
      siteName: "linkmural",
      type: "article",
    },
  };
}

export default async function ComparisonDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getComparisonBySlug(slug);
  if (!item) notFound();

  const base = siteUrl();
  const pageUrl = `${base}/comparar/${item.slug}`;
  const otherComparisons = COMPARISONS.filter((c) => c.slug !== item.slug);
  const relatedNiches = item.relatedNiches
    .map((nicheSlug) => getNicheBySlug(nicheSlug))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));

  return (
    <MarketingChrome>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Início", url: base },
          { name: "Comparar", url: `${base}/comparar` },
          { name: `linkmural vs ${item.shortName}`, url: pageUrl },
        ])}
      />
      <JsonLd data={buildSoftwareApplicationSchema(base)} />
      <JsonLd data={buildFaqPageSchema(item.faqs)} />

      {/* Breadcrumb + Hero */}
      <section className="flex flex-col items-start gap-4">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-caption text-ink-muted"
        >
          <Link href="/" className="hover:text-ink">
            Início
          </Link>
          <span aria-hidden>/</span>
          <Link href="/comparar" className="hover:text-ink">
            Comparar
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">linkmural vs {item.shortName}</span>
        </nav>

        <Badge variant="neutral" dot="positive">
          Comparativo direto · Preços em BRL
        </Badge>
        <h1 className="max-w-3xl font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          {item.h1}
        </h1>
        <p className="max-w-2xl text-body text-ink-muted">{item.subtitle}</p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/cadastro"
            className={buttonClasses({ variant: "primary", size: "lg" })}
          >
            Testar linkmural grátis
          </Link>
          <Link
            href="/planos"
            className={buttonClasses({ variant: "secondary", size: "lg" })}
          >
            Ver planos em reais
          </Link>
        </div>
      </section>

      {/* Bloco AEO (Resposta Direta) */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <h2 className="font-display text-title tracking-[-0.02em]">
          {item.aeoQuestion}
        </h2>
        <p className="mt-2.5 text-body leading-relaxed text-ink-muted">
          {item.aeoAnswer}
        </p>
      </section>

      {/* Tabela Comparativa Semântica */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Comparativo de recursos: linkmural vs {item.competitor}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-left text-small">
            <thead>
              <tr className="border-b border-line bg-paper/70">
                <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                  Critério
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                  linkmural
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 font-semibold text-ink-muted"
                >
                  {item.competitor}
                </th>
              </tr>
            </thead>
            <tbody>
              {item.table.map((row) => (
                <tr
                  key={row.feature}
                  className="border-b border-line last:border-b-0"
                >
                  <th
                    scope="row"
                    className="px-5 py-4 align-top font-semibold text-ink"
                  >
                    {row.feature}
                  </th>
                  <td className="px-5 py-4 align-top text-ink">
                    {row.linkmural}
                  </td>
                  <td className="px-5 py-4 align-top text-ink-muted">
                    {row.competitor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 Diferenciais */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {item.differentiators.map((diff) => (
          <div
            key={diff.title}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5"
          >
            <h3 className="font-display text-body font-bold tracking-[-0.01em]">
              {diff.title}
            </h3>
            <p className="text-small text-ink-muted">{diff.description}</p>
          </div>
        ))}
      </section>

      {/* Quando escolher cada um (tom honesto para GEO/SEO) */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-ink bg-surface p-6">
          <h2 className="font-display text-title tracking-[-0.02em]">
            Quando escolher o linkmural
          </h2>
          <ul className="flex flex-col gap-2.5 text-small text-ink-muted">
            {item.whenToChooseLinkmural.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <Icon
                  name="check"
                  size={16}
                  className="mt-0.5 shrink-0 text-positive"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-title tracking-[-0.02em]">
            Quando escolher o {item.shortName}
          </h2>
          <ul className="flex flex-col gap-2.5 text-small text-ink-muted">
            {item.whenToChooseCompetitor.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <Icon
                  name="arrow"
                  size={15}
                  className="mt-0.5 shrink-0 text-ink-muted"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Perguntas frequentes sobre linkmural vs {item.shortName}
        </h2>
        <div className="flex flex-col gap-2.5">
          {item.faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-line bg-surface px-4 py-3.5 open:border-ink/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-small font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <Icon
                  name="plus"
                  size={16}
                  className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="mt-2 text-small leading-relaxed text-ink-muted">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Linkagem interna cruzada */}
      <section className="grid grid-cols-1 gap-6 border-t border-line pt-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-body font-bold">
            Outros comparativos
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherComparisons.map((other) => (
              <Link
                key={other.slug}
                href={`/comparar/${other.slug}`}
                className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-small text-ink no-underline hover:border-ink"
              >
                linkmural vs {other.shortName}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-body font-bold">
            Modelos por nicho
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedNiches.map((niche) => (
              <Link
                key={niche.slug}
                href={`/para/${niche.slug}`}
                className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-small text-ink no-underline hover:border-ink"
              >
                Link na bio para {niche.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}
