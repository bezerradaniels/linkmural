import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { siteUrl } from "@/lib/redirect";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Ferramentas gratuitas de marketing e link na bio",
  description:
    "Ferramentas gratuitas do linkmural sem cadastro: gerador de links UTM com planilha editável, exportação CSV/Google Sheets e QR Code.",
  alternates: { canonical: `${siteUrl()}/ferramentas` },
};

export default function FerramentasIndexPage() {
  const base = siteUrl();

  return (
    <MarketingChrome>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Início", url: base },
          { name: "Ferramentas", url: `${base}/ferramentas` },
        ])}
      />

      <section className="flex flex-col items-start gap-4">
        <Badge variant="neutral" dot="positive">
          100% grátis · Sem login
        </Badge>
        <h1 className="max-w-3xl font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          Ferramentas gratuitas para rastrear e divulgar seus links
        </h1>
        <p className="max-w-2xl text-body text-ink-muted">
          Utilitários práticos criados pelo linkmural para negócios, criadores e
          times de marketing usarem direto no navegador, sem precisar criar
          conta.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Link
          href="/ferramentas/gerador-de-utm"
          className="group flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-6 no-underline transition-colors hover:border-ink"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-ink text-lime">
                <Icon name="chart" size={18} />
              </span>
              <Badge variant="neutral" dot="positive">
                Disponível
              </Badge>
            </div>
            <h2 className="font-display text-title tracking-[-0.02em] text-ink">
              Gerador de UTM com Planilha
            </h2>
            <p className="text-small text-ink-muted">
              Monte vários links rastreáveis com campos guiados, presets de
              canais, edição inline na tabela, QR Code por linha e exportação
              para CSV ou Google Sheets.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-small font-semibold text-ink">
            Abrir gerador de UTM
            <Icon
              name="arrow"
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-ink bg-[#0E1015] p-6 text-white">
          <div className="flex flex-col gap-2">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-lime text-on-lime">
              <Icon name="link" size={18} />
            </span>
            <h2 className="font-display text-title tracking-[-0.02em] text-white">
              Página de links em Bento Grid
            </h2>
            <p className="text-small text-white/75">
              Centralize WhatsApp, Pix, serviços, YouTube e links rastreáveis em
              uma página rápida com métricas prontas.
            </p>
          </div>
          <Link
            href="/cadastro"
            className={buttonClasses({
              variant: "primary",
              size: "md",
              className: "w-fit font-bold",
            })}
          >
            Criar conta grátis
          </Link>
        </div>
      </section>
    </MarketingChrome>
  );
}
