import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { COMPARISONS } from "@/lib/comparisons";
import { siteUrl } from "@/lib/redirect";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Comparar ferramentas de link na bio",
  description:
    "Compare o linkmural com Linktree, Bento.me, Beacons.ai, Bio.site e Canva em preço em reais (BRL), Bento Grid, velocidade mobile e domínio próprio.",
  alternates: { canonical: `${siteUrl()}/comparar` },
};

export default function CompararIndexPage() {
  const base = siteUrl();

  return (
    <MarketingChrome>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Início", url: base },
          { name: "Comparar", url: `${base}/comparar` },
        ])}
      />

      <section className="flex flex-col items-start gap-4">
        <Badge variant="neutral" dot="positive">
          Comparativos objetivos em BRL
        </Badge>
        <h1 className="max-w-3xl font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          Compare o linkmural com outras ferramentas de link na bio
        </h1>
        <p className="max-w-2xl text-body text-ink-muted">
          Analisamos preço em reais, personalização em Bento Grid, velocidade no
          celular, domínio próprio e recursos nativos para o mercado brasileiro.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {COMPARISONS.map((item) => (
          <Link
            key={item.slug}
            href={`/comparar/${item.slug}`}
            className="group flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-6 no-underline transition-colors hover:border-ink"
          >
            <div className="flex flex-col gap-2">
              <span className="text-caption font-semibold text-ink-muted">
                linkmural vs {item.competitor}
              </span>
              <h2 className="font-display text-title tracking-[-0.02em] text-ink">
                {item.h1}
              </h2>
              <p className="text-small text-ink-muted">{item.subtitle}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-small font-semibold text-ink">
              Ver comparativo completo
              <Icon
                name="arrow"
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        ))}
      </section>

      <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-ink bg-[#0E1015] p-7 text-white sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-title text-white">
            Prefere testar na prática em 3 minutos?
          </h2>
          <p className="text-small text-white/75">
            Crie sua página em Bento Grid grátis, sem cartão de crédito.
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
          Criar minha página grátis
        </Link>
      </section>
    </MarketingChrome>
  );
}
