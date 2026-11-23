import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { NichePhonePreview } from "@/components/marketing/NichePhonePreview";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { getComparisonBySlug } from "@/lib/comparisons";
import { getNicheBySlug, NICHE_SLUGS } from "@/lib/niches";
import { siteUrl } from "@/lib/redirect";
import {
  buildBreadcrumbSchema,
  buildFaqPageSchema,
  buildSoftwareApplicationSchema,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return NICHE_SLUGS.map((nicho) => ({ nicho }));
}

type Props = { params: Promise<{ nicho: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nicho } = await params;
  const item = getNicheBySlug(nicho);
  if (!item) return { title: "Nicho não encontrado" };

  const url = `${siteUrl()}/para/${item.slug}`;
  return {
    title: item.metaTitle,
    description: item.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `${item.metaTitle} · linkmural`,
      description: item.metaDescription,
      url,
      siteName: "linkmural",
      type: "website",
    },
  };
}

export default async function NicheDetailPage({ params }: Props) {
  const { nicho } = await params;
  const item = getNicheBySlug(nicho);
  if (!item) notFound();

  const base = siteUrl();
  const pageUrl = `${base}/para/${item.slug}`;
  const relatedNiches = item.relatedSlugs
    .map((slug) => getNicheBySlug(slug))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  const comparisons = item.recommendedComparisons
    .map((slug) => getComparisonBySlug(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <MarketingChrome>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Início", url: base },
          { name: "Para seu nicho", url: `${base}/para` },
          { name: item.name, url: pageUrl },
        ])}
      />
      <JsonLd data={buildSoftwareApplicationSchema(base)} />
      <JsonLd data={buildFaqPageSchema(item.faqs)} />

      {/* 1. H1 + Proposta de Valor + 3. Preview Visual do Nicho */}
      <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col items-start gap-4">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-caption text-ink-muted"
          >
            <Link href="/" className="hover:text-ink">
              Início
            </Link>
            <span aria-hidden>/</span>
            <Link href="/para" className="hover:text-ink">
              Nichos
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink">{item.name}</span>
          </nav>

          <Badge variant="neutral" dot="positive">
            {item.verticalLabel}
          </Badge>
          <h1 className="font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
            {item.h1}
          </h1>
          <p className="text-body text-ink-muted">{item.subtitle}</p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/cadastro"
              className={buttonClasses({ variant: "primary", size: "lg" })}
            >
              Criar minha página grátis
            </Link>
            <Link
              href="/planos"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              Ver planos
            </Link>
          </div>
        </div>

        <NichePhonePreview niche={item} />
      </section>

      {/* 2. Bloco AEO (Resposta Direta) */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <h2 className="font-display text-title tracking-[-0.02em]">
          {item.aeoQuestion}
        </h2>
        <p className="mt-2.5 text-body leading-relaxed text-ink-muted">
          {item.aeoAnswer}
        </p>
      </section>

      {/* 4. Checklist de Links Essenciais */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Checklist de links essenciais para {item.name}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {item.essentialLinks.map((entry, idx) => (
            <div
              key={entry.title}
              className="flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-5"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-caption font-bold text-lime">
                {idx + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-body font-bold text-ink">
                  {entry.title}
                </h3>
                <p className="text-small text-ink-muted">{entry.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Diferenciais Técnicos Aplicados */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Por que usar o linkmural para {item.name}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {item.technicalHighlights.map((highlight) => (
            <div
              key={highlight.title}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5"
            >
              <h3 className="font-display text-body font-bold text-ink">
                {highlight.title}
              </h3>
              <p className="text-small text-ink-muted">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ Específico do Nicho */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Perguntas frequentes sobre link na bio para {item.name}
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

      {/* CTA Banner */}
      <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-ink bg-[#0E1015] p-7 text-white sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-title text-white">
            Coloque sua página de {item.name} no ar em menos de 3 minutos
          </h2>
          <p className="text-small text-white/75">
            Comece no plano Grátis sem cartão de crédito e personalize tudo no
            seu celular.
          </p>
        </div>
        <Link
          href="/cadastro"
          className={buttonClasses({
            variant: "primary",
            size: "lg",
            className: "shrink-0 font-bold",
          })}
        >
          Criar conta grátis
        </Link>
      </section>

      {/* 7. Links Internos Cruzados */}
      <section className="grid grid-cols-1 gap-6 border-t border-line pt-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-body font-bold">
            Veja também outros nichos
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedNiches.map((rel) => (
              <Link
                key={rel.slug}
                href={`/para/${rel.slug}`}
                className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-small text-ink no-underline hover:border-ink"
              >
                Link na bio para {rel.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-body font-bold">
            Compare antes de escolher
          </h2>
          <div className="flex flex-wrap gap-2">
            {comparisons.map((comp) => (
              <Link
                key={comp.slug}
                href={`/comparar/${comp.slug}`}
                className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-small text-ink no-underline hover:border-ink"
              >
                linkmural vs {comp.shortName}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}
