import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import {
  getNichesByVertical,
  VERTICAL_LABELS,
  type NicheVertical,
} from "@/lib/niches";
import { siteUrl } from "@/lib/redirect";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Link na bio por nicho e profissão",
  description:
    "Veja modelos prontos de link na bio em Bento Grid para médicos, advogados, dentistas, restaurantes, lojas, criadores, infoprodutores e agências.",
  alternates: { canonical: `${siteUrl()}/para` },
};

const VERTICAL_ORDER: NicheVertical[] = [
  "profissionais",
  "negocios-locais",
  "criadores-b2b",
];

export default function ParaIndexPage() {
  const base = siteUrl();

  return (
    <MarketingChrome>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Início", url: base },
          { name: "Para seu nicho", url: `${base}/para` },
        ])}
      />

      <section className="flex flex-col items-start gap-4">
        <Badge variant="neutral" dot="positive">
          Guias e prévias por segmento
        </Badge>
        <h1 className="max-w-3xl font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          Link na bio pensado para o seu nicho
        </h1>
        <p className="max-w-2xl text-body text-ink-muted">
          Escolha sua profissão ou tipo de negócio para ver quais links mais
          convertem, uma prévia em Bento Grid e recomendações práticas.
        </p>
      </section>

      {VERTICAL_ORDER.map((vertical) => {
        const items = getNichesByVertical(vertical);
        return (
          <section key={vertical} className="flex flex-col gap-4">
            <h2 className="font-display text-title tracking-[-0.02em]">
              {VERTICAL_LABELS[vertical]}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((niche) => (
                <Link
                  key={niche.slug}
                  href={`/para/${niche.slug}`}
                  className="group flex flex-col justify-between gap-3 rounded-2xl border border-line bg-surface p-5 no-underline transition-colors hover:border-ink"
                >
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-body font-bold text-ink">
                      Link na bio para {niche.name}
                    </h3>
                    <p className="text-small text-ink-muted">
                      {niche.subtitle}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-ink">
                    Ver modelo e checklist
                    <Icon
                      name="arrow"
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-ink bg-[#0E1015] p-7 text-white sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-title text-white">
            Não encontrou seu segmento? O linkmural se adapta a qualquer negócio.
          </h2>
          <p className="text-small text-white/75">
            Personalize cores, fontes, logo, capa e cards em Bento Grid grátis.
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
          Criar grátis agora
        </Link>
      </section>
    </MarketingChrome>
  );
}
