export type HeroVariantKey =
  | "concorrentes"
  | "link_na_bio"
  | "link_para_instagram"
  | "default";

export interface HeroVariant {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  microcopy: string;
}

const DEFAULT_MICROCOPY =
  "Pronto em menos de 2 minutos • Sem cartão de crédito • Personalize com sua marca";

export const HERO_VARIANTS: Record<HeroVariantKey, HeroVariant> = {
  concorrentes: {
    eyebrow: "A evolução do link na bio",
    title:
      "Muito mais que uma lista de links: o gerenciador feito para converter no Instagram",
    subtitle:
      "Fuja das páginas genéricas. Com o Linkmural, você centraliza seus canais, captura leads, monetiza sua audiência e acompanha cada clique em uma vitrine com a identidade da sua marca.",
    cta: "Criar meu link na bio grátis",
    microcopy: DEFAULT_MICROCOPY,
  },
  link_na_bio: {
    eyebrow: "Seu link na bio profissional",
    title:
      "A melhor opção para centralizar e gerenciar todos os links da sua bio",
    subtitle:
      "Reúna site, loja virtual, WhatsApp e ofertas em uma única URL personalizada. Capture contatos direto pela página, meça o desempenho dos cliques e transforme visitas em vendas.",
    cta: "Criar meu link na bio grátis",
    microcopy: DEFAULT_MICROCOPY,
  },
  link_para_instagram: {
    eyebrow: "Feito para a bio do Instagram",
    title: "A melhor forma de gerenciar os links na bio do seu Instagram",
    subtitle:
      "Leve seguidores direto para sua loja, WhatsApp ou agendamentos com uma vitrine mobile rápida e com a cara do seu perfil. Capture leads, monetize sua audiência e veja o que mais gera cliques.",
    cta: "Criar meu link para Instagram",
    microcopy: DEFAULT_MICROCOPY,
  },
  default: {
    eyebrow: "Gerenciador de links na bio",
    title:
      "Transforme o link na bio do Instagram no seu melhor canal de conversão",
    subtitle:
      "Centralize todos os seus canais em uma única URL personalizada, capture leads, monetize sua audiência e acompanhe resultados em tempo real.",
    cta: "Começar grátis agora",
    microcopy: DEFAULT_MICROCOPY,
  },
};

export function resolveHeroVariant(utmContent?: string | null): {
  key: HeroVariantKey;
  content: HeroVariant;
} {
  const normalized = utmContent?.trim().toLowerCase() ?? "";

  if (
    normalized === "concorrentes" ||
    normalized === "link_na_bio" ||
    normalized === "link_para_instagram"
  ) {
    return {
      key: normalized,
      content: HERO_VARIANTS[normalized],
    };
  }

  return {
    key: "default",
    content: HERO_VARIANTS.default,
  };
}
