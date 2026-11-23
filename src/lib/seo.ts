import { COMPARISONS } from "@/lib/comparisons";
import { NICHES } from "@/lib/niches";
import { formatBrl, monthlyEquivalent, PLANS, type Plan } from "@/lib/plans";

export const PRODUCTION_HOST = "linkmural.com";

/**
 * Returns true only for the primary production domain (linkmural.com / www.linkmural.com).
 * Used to keep staging/beta (e.g. beta.linkmural.com) and local environments out of search indexes.
 */
export function isProductionHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  const hostname = hostHeader.split(":")[0]?.trim().toLowerCase();
  return hostname === PRODUCTION_HOST || hostname === `www.${PRODUCTION_HOST}`;
}

export type PublicPageSeoInput = {
  links: ReadonlyArray<unknown>;
  bio?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
};

/**
 * Identifies thin/empty user profiles (no active links, no bio and no contact info)
 * so they receive `noindex` and do not waste crawl budget.
 */
export function isEmptyPublicPage(page: PublicPageSeoInput): boolean {
  const hasLinks = page.links.length > 0;
  const hasBio = Boolean(page.bio?.trim());
  const hasContact = Boolean(
    page.whatsapp?.trim() || page.phone?.trim() || page.email?.trim(),
  );
  return !hasLinks && !hasBio && !hasContact;
}

/** Safely serializes JSON-LD preventing `</script>` breakout. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "linkmural",
    url: baseUrl,
    logo: `${baseUrl}/brand/linkmural-logo.svg`,
    description:
      "Plataforma brasileira para criação de páginas de links na bio em Bento Grid para negócios, profissionais liberais e criadores.",
  };
}

function buildPlanOffers(baseUrl: string) {
  const offers: Array<Record<string, unknown>> = [
    {
      "@type": "Offer",
      name: "Plano Grátis",
      price: "0.00",
      priceCurrency: "BRL",
      url: `${baseUrl}/cadastro`,
      availability: "https://schema.org/InStock",
      description:
        "1 página publicada, até 5 links (formato barra 2x1), 3 modelos com Logo e Capa, e métricas de 7 ou 30 dias.",
    },
  ];

  const paidPlans: Array<{ key: Exclude<Plan, "free">; desc: string }> = [
    {
      key: "pro",
      desc: "Links ilimitados, Bento Grid (2x1, 1x1, 2x2), efeitos Glass e Glossy, Doodles, remoção da marca linkmural e métricas por link.",
    },
    {
      key: "business",
      desc: "Tudo do Pro + até 3 páginas, galeria de fotos em carrossel, vídeo do YouTube, cards de Serviços, domínio próprio e exportação CSV.",
    },
  ];

  for (const { key, desc } of paidPlans) {
    const info = PLANS[key];
    offers.push(
      {
        "@type": "Offer",
        name: `Plano ${info.label} (Mensal)`,
        price: (info.price.monthly / 100).toFixed(2),
        priceCurrency: "BRL",
        url: `${baseUrl}/planos`,
        availability: "https://schema.org/InStock",
        description: desc,
      },
      {
        "@type": "Offer",
        name: `Plano ${info.label} (Anual)`,
        price: (info.price.yearly / 100).toFixed(2),
        priceCurrency: "BRL",
        url: `${baseUrl}/planos`,
        availability: "https://schema.org/InStock",
        description: `${desc} Cobrança anual.`,
      },
    );
  }

  return offers;
}

export function buildSoftwareApplicationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "linkmural",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    url: baseUrl,
    description:
      "Crie sua página de links na bio em Bento Grid com logo e capa personalizados, fotos gratuitas do Unsplash, WhatsApp, Pix, galeria em carrossel, vídeo do YouTube, cards de serviços e link rastreável.",
    offers: buildPlanOffers(baseUrl),
  };
}

export function buildFaqPageSchema(
  faqs: ReadonlyArray<{ q: string; a: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildBreadcrumbSchema(
  items: ReadonlyArray<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildLlmsTxt(baseUrl: string): string {
  const proMonthly = formatBrl(PLANS.pro.price.monthly);
  const proYearly = formatBrl(PLANS.pro.price.yearly);
  const proYearlyEq = formatBrl(monthlyEquivalent(PLANS.pro.price.yearly));
  const studioMonthly = formatBrl(PLANS.business.price.monthly);
  const studioYearly = formatBrl(PLANS.business.price.yearly);
  const studioYearlyEq = formatBrl(
    monthlyEquivalent(PLANS.business.price.yearly),
  );

  return `# linkmural

> Plataforma brasileira de páginas de links na bio em Bento Grid para negócios locais, profissionais liberais e criadores de conteúdo.

linkmural permite criar uma página mobile-first em \`linkmural.com/<endereco>\` em menos de 3 minutos, com 3 modelos de layout, 8 estilos visuais, integração com WhatsApp, Pix, Unsplash, YouTube, galeria de fotos, cards de serviços e rastreamento de cliques sem cookies invasivos (LGPD).

## Planos e Preços (BRL)

- **Grátis (R$ 0):** 1 página publicada, até 5 links (formato barra 2x1), 3 modelos com Logo e Capa, fonte, cores e fundo sólido ou gradiente, métricas de 7 ou 30 dias.
- **Pro (${proMonthly}/mês ou ${proYearly}/ano — ${proYearlyEq}/mês no anual, 50% de desconto de lançamento por 12 meses):** Links ilimitados, Bento Grid com cards 2x1, 1x1 e 2x2, efeitos Glass, Glossy, Doodles e Imagem, remoção de "Feito com linkmural" e métricas por link.
- **Studio (${studioMonthly}/mês ou ${studioYearly}/ano — ${studioYearlyEq}/mês no anual, 50% de desconto de lançamento por 12 meses):** Tudo do Pro + até 3 páginas, galeria de fotos em carrossel, vídeo do YouTube embutido, cards de Serviços com preço/duração/CTA, domínio próprio e exportação CSV.

## Links Principais

- [Página inicial](${baseUrl}/): Visão geral, modelos, funcionalidades e perguntas frequentes.
- [Planos e preços](${baseUrl}/planos): Comparativo completo dos planos Grátis, Pro e Studio.
- [Comparativos](${baseUrl}/comparar): linkmural vs Linktree, Bento.me, Beacons.ai, Bio.site e Canva.
- [Modelos por nicho](${baseUrl}/para): Páginas de link na bio para médicos, advogados, restaurantes, lojas, criadores e outros segmentos.
- [Gerador de UTM grátis](${baseUrl}/ferramentas/gerador-de-utm): Ferramenta gratuita sem login com campos guiados, planilha editável, QR Code e exportação CSV/Google Sheets.
- [Criar conta grátis](${baseUrl}/cadastro): Cadastro rápido sem cartão de crédito.
- [Entrar](${baseUrl}/entrar): Acesso ao painel de edição e métricas.
- [Termos de uso](${baseUrl}/termos): Condições de uso da plataforma.
- [Política de privacidade](${baseUrl}/privacidade): Conformidade com a LGPD.
- [Documentação completa para LLMs](${baseUrl}/llms-full.txt): Especificação detalhada de recursos, limites e diferenciais técnicos.
`;
}

export function buildLlmsFullTxt(baseUrl: string): string {
  const proMonthly = formatBrl(PLANS.pro.price.monthly);
  const proYearly = formatBrl(PLANS.pro.price.yearly);
  const proListMonthly = PLANS.pro.listPrice
    ? formatBrl(PLANS.pro.listPrice.monthly)
    : proMonthly;
  const proListYearly = PLANS.pro.listPrice
    ? formatBrl(PLANS.pro.listPrice.yearly)
    : proYearly;

  const studioMonthly = formatBrl(PLANS.business.price.monthly);
  const studioYearly = formatBrl(PLANS.business.price.yearly);
  const studioListMonthly = PLANS.business.listPrice
    ? formatBrl(PLANS.business.listPrice.monthly)
    : studioMonthly;
  const studioListYearly = PLANS.business.listPrice
    ? formatBrl(PLANS.business.listPrice.yearly)
    : studioYearly;

  return `# linkmural — Referência Completa para Agentes e LLMs

> URL oficial: ${baseUrl}
> Idioma principal: Português do Brasil (pt-BR)
> Moeda: Real Brasileiro (BRL)

## O que é o linkmural

O linkmural é uma plataforma SaaS brasileira para criação de páginas de link na bio e vitrines digitais em formato Bento Grid. Foi projetado para negócios locais, profissionais liberais (médicos, advogados, dentistas, arquitetos, psicólogos), prestadores de serviço e criadores de conteúdo que precisam converter visitantes do Instagram, TikTok e WhatsApp em contatos e vendas.

## Diferenciais Técnicos

- **Arquitetura Mobile-First e Performance:** Páginas públicas renderizadas como Server Components com cache por tag e revalidação instantânea ao salvar, sem JavaScript desnecessário.
- **Privacidade por Padrão (LGPD):** O rastreamento de cliques e visitas não armazena IP nem user-agent completo dos visitantes; registra apenas origem/UTM, país e tipo de aparelho.
- **Identidade Visual:** 3 modelos estruturais × 8 estilos visuais pré-configurados, além de personalização de tipografia, paleta de cores, logo e capa com busca integrada de imagens gratuitas no Unsplash.
- **Recursos de Conversão:** Botões diretos para WhatsApp, cópia de chave Pix, vCard para salvar contato (\`/<slug>/contato.vcf\`), QR Code automático (\`/<slug>/qr\`), links rastreáveis com parâmetros UTM, galeria de fotos em carrossel, vídeo do YouTube embutido e cards de serviços com preço e duração.

## Tabela Detalhada de Planos (BRL)

### 1. Plano Grátis
- **Preço:** R$ 0 para sempre (sem cartão de crédito)
- **Páginas:** 1 página publicada
- **Links:** Até 5 links no formato barra (2×1)
- **Personalização:** 3 modelos com Logo e Capa, fonte, cores e fundo sólido ou gradiente
- **Métricas:** Visitas e cliques totais (janela de 7 ou 30 dias)
- **Marca d'água:** Exibe "Feito com linkmural" no rodapé

### 2. Plano Pro
- **Preço promocional (50% OFF nos primeiros 12 meses):** ${proMonthly}/mês no plano mensal ou ${proYearly}/ano no plano anual
- **Preço regular após 12 meses:** ${proListMonthly}/mês ou ${proListYearly}/ano
- **Páginas:** 1 página publicada
- **Links:** Ilimitados
- **Layout:** Bento Grid completo com cards 2×1 (Faixa), 1×1 (Bloco) e 2×2 (Destaque)
- **Estilos e efeitos:** Transparência (Glass), Glossy, Doodles e imagem de fundo
- **Métricas:** Cliques por link e por período
- **Marca d'água:** Permite remover "Feito com linkmural" do rodapé

### 3. Plano Studio
- **Preço promocional (50% OFF nos primeiros 12 meses):** ${studioMonthly}/mês no plano mensal ou ${studioYearly}/ano no plano anual
- **Preço regular após 12 meses:** ${studioListMonthly}/mês ou ${studioListYearly}/ano
- **Páginas:** Até 3 páginas publicadas
- **Links:** Ilimitados
- **Blocos exclusivos:** Galeria de fotos em carrossel, vídeo do YouTube 16:9 embutido no grid, cards de Serviços com preço, duração e CTA
- **Domínio:** Suporte a domínio próprio personalizado
- **Métricas:** Completas com exportação em CSV

## Rotas Públicas Principais

- \`${baseUrl}/\` — Página inicial com apresentação dos modelos, estilos, planos e FAQ.
- \`${baseUrl}/planos\` — Comparativo de planos Grátis, Pro e Studio com alternância Anual/Mensal.
- \`${baseUrl}/comparar\` — Hub de comparativos diretos contra concorrentes.
- \`${baseUrl}/para\` — Hub de casos de uso e modelos por nicho.
- \`${baseUrl}/ferramentas/gerador-de-utm\` — Gerador de UTM gratuito com planilha editável, QR Code e exportação CSV/TSV sem login.
- \`${baseUrl}/cadastro\` — Criação de conta gratuita (e-mail com link mágico ou Google).
- \`${baseUrl}/entrar\` — Login no painel do usuário.
- \`${baseUrl}/<endereco>\` — Página pública publicada do usuário/negócio.
- \`${baseUrl}/termos\` — Termos de uso.
- \`${baseUrl}/privacidade\` — Política de privacidade.

## Comparativos Publicados

${COMPARISONS.map((c) => `- [linkmural vs ${c.competitor}](${baseUrl}/comparar/${c.slug}): ${c.subtitle}`).join("\n")}

## Casos de Uso por Nicho

${NICHES.map((n) => `- [Link na bio para ${n.name}](${baseUrl}/para/${n.slug}): ${n.subtitle}`).join("\n")}
`;
}
