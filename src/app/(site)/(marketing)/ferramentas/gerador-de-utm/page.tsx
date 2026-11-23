import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { JsonLd } from "@/components/seo/JsonLd";
import { UtmGeneratorTool } from "@/components/tools/UtmGeneratorTool";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { siteUrl } from "@/lib/redirect";
import { buildBreadcrumbSchema, buildFaqPageSchema } from "@/lib/seo";

const PAGE_PATH = "/ferramentas/gerador-de-utm";

export const metadata: Metadata = {
  title: "Gerador de UTM grátis com planilha (CSV e Google Sheets)",
  description:
    "Crie vários links com parâmetros UTM sem login: campos guiados, presets de Instagram, WhatsApp, Meta Ads e Google Ads, planilha editável, QR Code e exportação CSV.",
  alternates: { canonical: `${siteUrl()}${PAGE_PATH}` },
  openGraph: {
    title: "Gerador de UTM grátis com planilha · linkmural",
    description:
      "Monte links rastreáveis em lote com presets prontos, planilha editável no navegador, QR Code e exportação para Google Sheets e Excel.",
    url: `${siteUrl()}${PAGE_PATH}`,
    siteName: "linkmural",
    type: "website",
  },
};

const UTM_PARAMS_GUIDE = [
  {
    param: "utm_source",
    required: "Obrigatório",
    meaning: "Identifica de onde veio o visitante (plataforma, site ou canal).",
    examples: "instagram, whatsapp, google, meta_ads, newsletter",
  },
  {
    param: "utm_medium",
    required: "Recomendado",
    meaning: "Indica o formato ou tipo de mídia usado no link.",
    examples: "bio, stories, reels, cpc, email, impresso",
  },
  {
    param: "utm_campaign",
    required: "Recomendado",
    meaning: "Agrupa todos os links de uma mesma ação, oferta ou lançamento.",
    examples: "black_friday, lancamento_maio, dia_das_maes",
  },
  {
    param: "utm_content",
    required: "Opcional",
    meaning: "Diferencia botões, criativos ou posições dentro da mesma campanha.",
    examples: "botao_topo, criativo_video_01, banner_lateral",
  },
  {
    param: "utm_term",
    required: "Opcional",
    meaning: "Registra palavras-chave em anúncios pagos de pesquisa.",
    examples: "link_na_bio_profissional, consulta_cardiologia",
  },
];

const FAQS = [
  {
    q: "O que é um link com UTM e para que serve?",
    a: "UTM (Urchin Tracking Module) são pequenos parâmetros adicionados ao final de uma URL (como ?utm_source=instagram&utm_medium=stories) para que o Google Analytics 4 e outras ferramentas de métricas identifiquem exatamente qual rede social, anúncio ou botão trouxe cada visita e venda.",
  },
  {
    q: "Preciso criar conta para usar o gerador de UTM do linkmural?",
    a: "Não. A ferramenta é 100% gratuita e funciona sem login. Os links adicionados à sua planilha ficam salvos automaticamente no seu navegador (localStorage) para você editar, copiar para o Google Sheets ou baixar em CSV.",
  },
  {
    q: "Como usar UTM no link da bio do Instagram?",
    a: "Use utm_source=instagram, utm_medium=bio e uma campanha descritiva (ex.: utm_campaign=perfil_principal). Assim, ao abrir o Google Analytics ou o painel do linkmural, você separa claramente os cliques vindos da bio daqueles vindos de Stories, Reels ou anúncios.",
  },
  {
    q: "Posso usar acentos, espaços ou letras maiúsculas nos parâmetros UTM?",
    a: "Não é recomendado porque ferramentas de analytics diferenciam maiúsculas de minúsculas (Instagram e instagram viram linhas separadas). Nosso gerador normaliza automaticamente tudo para minúsculas, sem acentos e com underscore (_).",
  },
];

export default function GeradorDeUtmPage() {
  const base = siteUrl();
  const pageUrl = `${base}${PAGE_PATH}`;

  const toolSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Gerador de UTM com Planilha — linkmural",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    url: pageUrl,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "BRL",
    },
    description:
      "Ferramenta gratuita online para criar links com parâmetros UTM em lote, organizar em planilha editável, gerar QR Code e exportar em CSV ou para Google Sheets.",
  };

  return (
    <MarketingChrome>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Início", url: base },
          { name: "Ferramentas", url: `${base}/ferramentas` },
          { name: "Gerador de UTM", url: pageUrl },
        ])}
      />
      <JsonLd data={toolSchema} />
      <JsonLd data={buildFaqPageSchema(FAQS)} />

      {/* Hero */}
      <section className="flex flex-col items-start gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-caption text-ink-muted"
        >
          <Link href="/" className="hover:text-ink">
            Início
          </Link>
          <span aria-hidden>/</span>
          <Link href="/ferramentas" className="hover:text-ink">
            Ferramentas
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">Gerador de UTM</span>
        </nav>

        <Badge variant="neutral" dot="positive">
          Ferramenta grátis · Sem cadastro
        </Badge>
        <h1 className="max-w-3xl font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          Gerador de UTM grátis com planilha
        </h1>
        <p className="max-w-2xl text-body text-ink-muted">
          Crie vários links rastreáveis para Instagram, WhatsApp, Meta Ads e
          Google Analytics em segundos. Monte sua planilha direto na página,
          gere QR Codes e exporte para CSV ou Google Sheets.
        </p>
      </section>

      {/* Interactive Tool + Live Spreadsheet */}
      <UtmGeneratorTool />

      {/* Subtle contextual CTA to Linkmural */}
      <section className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-ink bg-[#0E1015] p-7 text-white sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <span className="text-caption font-semibold text-lime">
            Dica para sua bio
          </span>
          <h2 className="font-display text-title text-white">
            Rastreie cliques da sua bio sem montar UTMs na mão toda semana
          </h2>
          <p className="max-w-xl text-small text-white/75">
            No linkmural você cria sua página de links em Bento Grid grátis, com
            construtor de links rastreáveis integrado e métricas por canal
            respeitando a LGPD.
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
          Criar página grátis
        </Link>
      </section>

      {/* AEO Direct Answer Block */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Como criar links com UTM corretamente?
        </h2>
        <p className="mt-2.5 text-body leading-relaxed text-ink-muted">
          Para criar um link com UTM corretamente, informe a URL de destino e
          defina ao menos a origem (<code>utm_source</code>), a mídia (
          <code>utm_medium</code>) e a campanha (<code>utm_campaign</code>)
          usando letras minúsculas, sem acentos e separando palavras com
          underscore. Mantenha todos os links padronizados em uma planilha para
          evitar dados duplicados no Google Analytics.
        </p>
      </section>

      {/* 5 UTM Parameters Reference Table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Guia rápido dos 5 parâmetros UTM
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[580px] border-collapse text-left text-small">
            <thead>
              <tr className="border-b border-line bg-paper/70">
                <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                  Parâmetro
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                  Uso
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                  Para que serve
                </th>
                <th scope="col" className="px-5 py-3.5 font-semibold text-ink">
                  Exemplos
                </th>
              </tr>
            </thead>
            <tbody>
              {UTM_PARAMS_GUIDE.map((item) => (
                <tr
                  key={item.param}
                  className="border-b border-line last:border-b-0"
                >
                  <th
                    scope="row"
                    className="px-5 py-3.5 font-mono text-caption font-semibold text-ink"
                  >
                    {item.param}
                  </th>
                  <td className="px-5 py-3.5 text-caption text-ink-muted">
                    {item.required}
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{item.meaning}</td>
                  <td className="px-5 py-3.5 font-mono text-caption text-ink">
                    {item.examples}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Perguntas frequentes sobre UTMs
        </h2>
        <div className="flex flex-col gap-2.5">
          {FAQS.map((faq) => (
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
    </MarketingChrome>
  );
}
