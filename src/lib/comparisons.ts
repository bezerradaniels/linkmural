import { formatBrl, monthlyEquivalent, PLANS } from "@/lib/plans";

export type ComparisonRow = {
  feature: string;
  linkmural: string;
  competitor: string;
};

export type ComparisonItem = {
  slug: string;
  competitor: string;
  shortName: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  aeoQuestion: string;
  aeoAnswer: string;
  differentiators: Array<{ title: string; description: string }>;
  table: ComparisonRow[];
  whenToChooseLinkmural: string[];
  whenToChooseCompetitor: string[];
  faqs: Array<{ q: string; a: string }>;
  relatedNiches: string[];
};

const proMonthly = formatBrl(PLANS.pro.price.monthly);
const proYearlyEq = formatBrl(monthlyEquivalent(PLANS.pro.price.yearly));
const studioMonthly = formatBrl(PLANS.business.price.monthly);
const studioYearlyEq = formatBrl(monthlyEquivalent(PLANS.business.price.yearly));

export const COMPARISONS: ComparisonItem[] = [
  {
    slug: "linkmural-vs-linktree",
    competitor: "Linktree",
    shortName: "Linktree",
    metaTitle: "linkmural vs Linktree: comparativo completo em BRL",
    metaDescription:
      "Compare linkmural e Linktree em preço em reais (BRL), design em Bento Grid, velocidade mobile, domínio próprio e recursos para negócios brasileiros.",
    h1: "linkmural vs Linktree: qual a melhor ferramenta de link na bio?",
    subtitle:
      "Comparativo direto entre o linkmural e o Linktree em preço em reais, personalização visual em Bento Grid, velocidade mobile e foco em conversão.",
    aeoQuestion: "O linkmural é uma boa alternativa ao Linktree no Brasil?",
    aeoAnswer:
      "Sim. O linkmural é uma alternativa brasileira ao Linktree com preços em reais (a partir de R$ 0 no plano Grátis e " +
      proYearlyEq +
      "/mês no anual do Pro), layout em Bento Grid personalizável, botões nativos para WhatsApp e Pix, métricas compatíveis com a LGPD e páginas ultrarrápidas em Server Components.",
    differentiators: [
      {
        title: "Preços em reais (BRL) sem variação cambial",
        description: `Plano Grátis sem cartão, Pro a partir de ${proYearlyEq}/mês no anual (${proMonthly}/mês no mensal) e Studio a partir de ${studioYearlyEq}/mês no anual.`,
      },
      {
        title: "Vitrine em Bento Grid, não só lista de botões",
        description:
          "Combine cards 2×1, 1×1 e 2×2, galeria em carrossel, vídeo do YouTube e cards de serviços com preço e duração.",
      },
      {
        title: "Feito para o mercado brasileiro",
        description:
          "Interface 100% em português, suporte nativo a WhatsApp, cópia de chave Pix, vCard para agenda e rastreamento alinhado à LGPD.",
      },
    ],
    table: [
      {
        feature: "Preço do plano inicial pago",
        linkmural: `A partir de ${proYearlyEq}/mês no anual (${proMonthly}/mês mensal) em BRL`,
        competitor: "Planos pagos cobrados em dólar (USD), sujeitos a câmbio e IOF",
      },
      {
        feature: "Formato de layout",
        linkmural: "Bento Grid (cards 2×1, 1×1 e 2×2) + 3 modelos × 8 estilos",
        competitor: "Predominantemente lista vertical de botões",
      },
      {
        feature: "Domínio próprio",
        linkmural: `Incluso no plano Studio (${studioYearlyEq}/mês no anual)`,
        competitor: "Não disponível como domínio customizado nativo na maioria dos planos",
      },
      {
        feature: "WhatsApp, Pix e vCard",
        linkmural: "Nativos no painel, prontos em poucos cliques",
        competitor: "Exige links manuais ou integrações externas",
      },
      {
        feature: "Idioma e suporte",
        linkmural: "100% em português do Brasil",
        competitor: "Interface traduzida parcialmente, foco global em inglês",
      },
      {
        feature: "Privacidade e LGPD",
        linkmural: "Métricas sem armazenar IP nem user-agent completo",
        competitor: "Ecossistema amplo de cookies e rastreadores de terceiros",
      },
    ],
    whenToChooseLinkmural: [
      "Você quer pagar em reais (BRL) com preço previsível e sem surpresa no cartão.",
      "Precisa de uma vitrine visual em Bento Grid que passe credibilidade para clientes locais ou seguidores.",
      "Usa WhatsApp, Pix, cards de serviços ou domínio próprio para converter visitas em agendamentos e vendas.",
      "Prefere uma página pública leve que abre rápido no 4G/5G sem scripts pesados.",
    ],
    whenToChooseCompetitor: [
      "Você já usa integrações muito específicas do ecossistema global do Linktree (como lojas internacionais integradas).",
      "Prefere manter uma lista simples de links já configurada há anos sem migrar a URL.",
    ],
    faqs: [
      {
        q: "Quanto custa o linkmural em comparação ao Linktree?",
        a: `O linkmural tem plano Grátis para sempre (até 5 links), plano Pro por ${proMonthly}/mês ou ${proYearlyEq}/mês no anual, e plano Studio por ${studioMonthly}/mês ou ${studioYearlyEq}/mês no anual — tudo em reais (BRL), sem IOF de cobrança em dólar.`,
      },
      {
        q: "Posso migrar meus links do Linktree para o linkmural?",
        a: "Sim. Basta criar sua conta gratuita, cadastrar os mesmos links no painel do linkmural em menos de 3 minutos e trocar a URL na bio do Instagram, TikTok e WhatsApp.",
      },
      {
        q: "O linkmural permite remover a marca do rodapé?",
        a: "Sim. A partir do plano Pro você pode ocultar o selo 'Feito com linkmural' do rodapé da sua página.",
      },
    ],
    relatedNiches: ["medicos", "restaurantes", "criadores-de-conteudo"],
  },
  {
    slug: "linkmural-vs-bento",
    competitor: "Bento.me",
    shortName: "Bento.me",
    metaTitle: "linkmural vs Bento.me: alternativa em Bento Grid com analytics e domínio",
    metaDescription:
      "Compare linkmural e Bento.me: estética em Bento Grid combinada com métricas de clique, domínio próprio, cards de serviços e interface em português.",
    h1: "linkmural vs Bento.me: estética em Bento Grid com recursos de conversão",
    subtitle:
      "Veja como o linkmural une o visual moderno em blocos do estilo Bento com analytics nativo, WhatsApp, Pix e domínio próprio em português.",
    aeoQuestion: "Qual a melhor alternativa ao Bento.me para negócios e criadores?",
    aeoAnswer:
      "O linkmural é uma alternativa brasileira ao Bento.me que preserva a estética moderna em Bento Grid (cards 2×1, 1×1 e 2×2), adicionando recursos essenciais de marketing ausentes em páginas puramente estáticas: métricas de cliques por link, links rastreáveis com UTM, domínio próprio, cards de serviços e suporte nativo a WhatsApp e Pix.",
    differentiators: [
      {
        title: "Bento Grid com métricas reais de conversão",
        description:
          "Saiba quantas visitas sua página recebeu, quais cards mais recebem cliques e qual rede social traz mais tráfego.",
      },
      {
        title: "Cards prontos para vender serviços",
        description:
          "Além de links e imagens, publique cards de Serviços com preço, duração e botão direto para agendamento.",
      },
      {
        title: "Domínio próprio e até 3 páginas",
        description:
          "No plano Studio você conecta seu domínio customizado e gerencia até 3 páginas no mesmo painel.",
      },
    ],
    table: [
      {
        feature: "Layout em Bento Grid",
        linkmural: "Sim — cards 2×1, 1×1 e 2×2 com 8 estilos e efeitos Glass/Glossy",
        competitor: "Sim — grade visual modular voltada para portfólio pessoal",
      },
      {
        feature: "Métricas de cliques e origem (UTM)",
        linkmural: "Nativo em todos os planos, com detalhamento por link no Pro e CSV no Studio",
        competitor: "Foco minimalista, sem analytics detalhado por campanha/link",
      },
      {
        feature: "Domínio próprio",
        linkmural: "Incluso no plano Studio",
        competitor: "Limitado ao subdomínio/URL padrão da plataforma",
      },
      {
        feature: "Cards de Serviços, WhatsApp e Pix",
        linkmural: "Nativos para profissionais e negócios locais",
        competitor: "Voltado principalmente a links sociais e widgets de texto/imagem",
      },
      {
        feature: "Banco de imagens integrado",
        linkmural: "Busca gratuita do Unsplash direto no painel (Capa, Fundo e Galeria)",
        competitor: "Upload manual de imagens",
      },
    ],
    whenToChooseLinkmural: [
      "Você gosta do visual em Bento Grid, mas precisa de métricas de cliques e rastreamento UTM para medir resultados.",
      "Atende clientes no Brasil e precisa destacar WhatsApp, chave Pix, endereço, horários e tabela de serviços.",
      "Quer conectar seu próprio domínio sem abrir mão de uma interface simples em português.",
    ],
    whenToChooseCompetitor: [
      "Você busca apenas um cartão pessoal minimalista em inglês, sem necessidade de analytics, domínio próprio ou blocos comerciais.",
    ],
    faqs: [
      {
        q: "O linkmural tem o mesmo estilo visual de blocos do Bento.me?",
        a: "Sim. O linkmural oferece Bento Grid drag-and-drop com cards em tamanhos Faixa (2×1), Bloco (1×1) e Destaque (2×2), além de 3 modelos estruturais e 8 estilos visuais.",
      },
      {
        q: "Preciso pagar para testar o linkmural?",
        a: "Não. O plano Grátis é gratuito para sempre, sem cartão de crédito, já incluindo Logo, Capa, fontes, cores e fotos gratuitas do Unsplash.",
      },
      {
        q: "O linkmural funciona bem para portfólio de criativos e freelancers?",
        a: "Sim. Você pode combinar galeria de fotos em carrossel, vídeo do YouTube embutido, links para Behance/GitHub e botão de agendamento no mesmo grid.",
      },
    ],
    relatedNiches: ["arquitetos", "agencias-e-freelancers", "criadores-de-conteudo"],
  },
  {
    slug: "linkmural-vs-beacons",
    competitor: "Beacons.ai",
    shortName: "Beacons.ai",
    metaTitle: "linkmural vs Beacons.ai: interface limpa em português e preço em BRL",
    metaDescription:
      "Compare linkmural e Beacons.ai: entenda as diferenças de simplicidade, velocidade mobile, idioma português e preços em reais sem taxas ocultas.",
    h1: "linkmural vs Beacons.ai: simplicidade em português sem excesso de menus",
    subtitle:
      "Compare uma plataforma brasileira enxuta e rápida com uma suíte internacional cheia de módulos e cobrança em dólar.",
    aeoQuestion: "Qual a diferença entre o linkmural e o Beacons.ai?",
    aeoAnswer:
      "O Beacons.ai é uma suíte internacional em inglês com múltiplos módulos e planos em dólar, enquanto o linkmural foca em entregar uma página de link na bio em Bento Grid rápida, 100% em português e com preços transparentes em reais (BRL), sem menus complexos nem taxas sobre vendas no WhatsApp ou Pix.",
    differentiators: [
      {
        title: "Sem curva de aprendizado nem dezenas de abas",
        description:
          "Coloque sua página profissional no ar em menos de 3 minutos, com editor visual direto ao ponto.",
      },
      {
        title: "Preços transparentes em reais",
        description: `Sem cobrança em dólar nem comissões surpresa: Grátis, Pro (${proYearlyEq}/mês no anual) ou Studio (${studioYearlyEq}/mês no anual).`,
      },
      {
        title: "Performance real no celular",
        description:
          "Páginas leves construídas para abrir instantaneamente no navegador interno do Instagram e TikTok.",
      },
    ],
    table: [
      {
        feature: "Idioma da plataforma",
        linkmural: "100% em português do Brasil",
        competitor: "Principalmente em inglês",
      },
      {
        feature: "Moeda de cobrança",
        linkmural: "Reais (BRL) com valores fixos e transparentes",
        competitor: "Dólar americano (USD)",
      },
      {
        feature: "Complexidade do painel",
        linkmural: "Enxuto e focado na página de links, aparência e métricas",
        competitor: "Suíte extensa com múltiplos subprodutos e menus",
      },
      {
        feature: "Domínio próprio e múltiplas páginas",
        linkmural: "Incluso no Studio (até 3 páginas + domínio próprio)",
        competitor: "Disponível em planos pagos superiores em USD",
      },
      {
        feature: "Integração local (WhatsApp, Pix, vCard)",
        linkmural: "Nativa no editor",
        competitor: "Voltada ao mercado norte-americano (Stripe/PayPal em USD)",
      },
    ],
    whenToChooseLinkmural: [
      "Você quer uma ferramenta em português que não exige horas de configuração para ficar bonita.",
      "Prefere pagar em BRL e converter clientes pelo WhatsApp, Pix, site próprio ou plataformas brasileiras.",
      "Valoriza carregamento rápido no celular para não perder cliques vindos de Reels e Stories.",
    ],
    whenToChooseCompetitor: [
      "Você vende produtos digitais em dólar para audiência internacional e quer usar e-mail marketing e checkout embutidos na mesma suíte em inglês.",
    ],
    faqs: [
      {
        q: "O linkmural cobra comissão sobre meus agendamentos ou vendas?",
        a: "Não. O linkmural não cobra nenhuma taxa ou comissão sobre cliques, agendamentos no WhatsApp ou pagamentos via Pix.",
      },
      {
        q: "O linkmural serve para infoprodutores e criadores?",
        a: "Sim. Você pode organizar páginas de vendas, links rastreáveis por rede social, vídeo do YouTube, galeria e links de afiliados em um Bento Grid de alta conversão.",
      },
      {
        q: "Posso usar meu próprio domínio no linkmural?",
        a: "Sim, o plano Studio inclui suporte a domínio próprio personalizado e até 3 páginas publicadas.",
      },
    ],
    relatedNiches: ["infoprodutores", "criadores-de-conteudo", "musicos-e-artistas"],
  },
  {
    slug: "linkmural-vs-biosite",
    competitor: "Bio.site (Squarespace)",
    shortName: "Bio.site",
    metaTitle: "linkmural vs Bio.site (Squarespace): personalização e controle técnico",
    metaDescription:
      "Compare linkmural e Bio.site da Squarespace em personalização visual em Bento Grid, domínio próprio, métricas detalhadas e foco no Brasil.",
    h1: "linkmural vs Bio.site (Squarespace): mais personalização e controle técnico",
    subtitle:
      "Entenda quando vale a pena escolher o linkmural em vez do Bio.site para ter Bento Grid, domínio customizado e métricas mais completas.",
    aeoQuestion: "Bio.site da Squarespace ou linkmural: qual vale mais a pena?",
    aeoAnswer:
      "O Bio.site da Squarespace oferece templates básicos de link na bio com personalização limitada, enquanto o linkmural entrega controle visual completo em Bento Grid (3 modelos × 8 estilos, Glass, Glossy e Unsplash), cards de serviços, domínio próprio, métricas por link com exportação CSV e suporte total ao português do Brasil.",
    differentiators: [
      {
        title: "Personalização além de templates fixos",
        description:
          "Alterne entre 3 modelos, 8 estilos, cores, fontes, efeitos Glass/Glossy e disposição drag-and-drop em Bento Grid.",
      },
      {
        title: "Controle técnico: domínio próprio e UTM",
        description:
          "Use seu domínio próprio no plano Studio e gere links rastreáveis para saber de qual canal vêm seus clientes.",
      },
      {
        title: "Recursos prontos para atendimento local",
        description:
          "Horário de funcionamento, endereço, telefone, WhatsApp, chave Pix e botão de salvar contato (vCard).",
      },
    ],
    table: [
      {
        feature: "Flexibilidade de layout",
        linkmural: "Bento Grid com cards 2×1, 1×1 e 2×2 + galeria e vídeo",
        competitor: "Templates pré-definidos com menor liberdade estrutural",
      },
      {
        feature: "Domínio próprio",
        linkmural: "Incluso no plano Studio",
        competitor: "Foco em URLs bio.site/usuario (domínio próprio exige ecossistema Squarespace)",
      },
      {
        feature: "Cards de Serviços e WhatsApp/Pix",
        linkmural: "Nativos no painel",
        competitor: "Recursos básicos de links e formulário simples",
      },
      {
        feature: "Métricas e exportação",
        linkmural: "Visitas, cliques por link, origem UTM e exportação CSV no Studio",
        competitor: "Analytics básico na versão gratuita",
      },
      {
        feature: "Idioma e moeda",
        linkmural: "Português do Brasil e cobrança em BRL",
        competitor: "Ecossistema global em inglês/USD",
      },
    ],
    whenToChooseLinkmural: [
      "Você quer uma página com cara de marca própria, sem ficar preso a templates iguais aos de todo mundo.",
      "Precisa de domínio customizado, cards de serviços e métricas detalhadas por link.",
      "Atende clientes no Brasil e precisa de WhatsApp, Pix e vCard integrados.",
    ],
    whenToChooseCompetitor: [
      "Você já paga e gerencia toda a sua presença digital dentro do ecossistema Squarespace e quer apenas um complemento básico.",
    ],
    faqs: [
      {
        q: "O linkmural funciona para profissionais que precisam de sobriedade visual?",
        a: "Sim. O linkmural conta com estilos minimalistas e sóbrios ideais para médicos, advogados, psicólogos, arquitetos e consultorias.",
      },
      {
        q: "É possível testar o visual antes de publicar?",
        a: "Sim. O painel mostra uma prévia ao vivo em formato de celular enquanto você ajusta cores, fontes, capa e posição dos cards.",
      },
      {
        q: "Preciso ter um site pronto para usar o linkmural?",
        a: "Não. O linkmural funciona como sua vitrine digital principal, centralizando contato, serviços, endereço, redes sociais e portfólio.",
      },
    ],
    relatedNiches: ["advogados", "clinicas-de-estetica", "dentistas"],
  },
  {
    slug: "linkmural-vs-canva",
    competitor: "Canva (Site de Bio)",
    shortName: "Canva",
    metaTitle: "linkmural vs Canva para link na bio: performance, SEO e métricas reais",
    metaDescription:
      "Canva ou ferramenta própria de link na bio? Compare linkmural e Canva em velocidade mobile, SEO nativo, métricas de clique e atualização rápida.",
    h1: "linkmural vs Canva: por que usar uma ferramenta dedicada de link na bio",
    subtitle:
      "Entenda as diferenças práticas entre montar um site estático no Canva e usar o linkmural com métricas de clique, SEO nativo e edição em segundos.",
    aeoQuestion: "Vale a pena fazer link na bio no Canva ou em uma ferramenta própria?",
    aeoAnswer:
      "Para uso profissional, uma ferramenta dedicada como o linkmural supera o Canva em velocidade mobile, SEO nativo, métricas reais de cliques por botão e praticidade de atualização. No Canva, cada ajuste exige editar o design e republicar, sem rastreamento detalhado de origem ou recursos nativos como vCard e Pix.",
    differentiators: [
      {
        title: "Velocidade mobile e SEO nativo",
        description:
          "Enquanto páginas do Canva carregam pacotes pesados de layout, o linkmural entrega HTML leve, rápido e indexável.",
      },
      {
        title: "Métricas de clique por botão e canal",
        description:
          "Descubra exatamente qual link converte mais e se o clique veio do Instagram, TikTok ou WhatsApp.",
      },
      {
        title: "Atualização em segundos pelo celular",
        description:
          "Troque promoções, links e horários em 2 toques sem quebrar o alinhamento do design nem precisar republicar.",
      },
    ],
    table: [
      {
        feature: "Velocidade de carregamento mobile",
        linkmural: "Alta — Server Components leves, sem JS desnecessário",
        competitor: "Mais lenta em conexões móveis por renderizar canvas/assets pesados",
      },
      {
        feature: "Métricas de cliques por link",
        linkmural: "Nativo (gráfico de 7/30 dias, por link no Pro, CSV no Studio)",
        competitor: "Métricas limitadas, sem rastreamento granular de conversão por botão",
      },
      {
        feature: "Responsividade automática",
        linkmural: "Mobile-first nativa em qualquer tela sem desalinhamento",
        competitor: "Exige ajustes manuais para não cortar texto ou botões em telas menores",
      },
      {
        feature: "Recursos interativos (Pix, vCard, QR, YouTube)",
        linkmural: "Nativos e configuráveis por formulário",
        competitor: "Links estáticos sobre elementos gráficos",
      },
      {
        feature: "SEO e metadados (Open Graph / Canonical)",
        linkmural: "Automáticos por página, com preview rico ao compartilhar no WhatsApp",
        competitor: "Controle básico de SEO e prévia social",
      },
    ],
    whenToChooseLinkmural: [
      "Você quer saber quantas pessoas clicam em cada botão e de qual rede social elas vieram.",
      "Atualiza links, cardápios, agenda ou campanhas com frequência e precisa de agilidade no celular.",
      "Busca carregamento instantâneo, boa indexação no Google e prévia profissional ao enviar o link no WhatsApp.",
    ],
    whenToChooseCompetitor: [
      "Você precisa de um folheto gráfico único e totalmente ilustrado para uma campanha pontual onde métricas de clique não importam.",
    ],
    faqs: [
      {
        q: "Por que o link na bio feito no Canva costuma perder cliques?",
        a: "Sites exportados do Canva costumam carregar mais recursos visuais pesados no navegador interno do Instagram e podem desalinhar em diferentes tamanhos de celular, aumentando o abandono antes do clique.",
      },
      {
        q: "Consigo manter a identidade visual da minha marca no linkmural?",
        a: "Sim. Você sobe sua logo e capa, escolhe cores, tipografia e estilo visual (incluindo fundo sólido, gradiente, imagem ou efeitos Glass/Glossy) sem precisar mexer em alinhamento manual.",
      },
      {
        q: "O linkmural gera QR Code da minha página automaticamente?",
        a: "Sim. Toda página publicada tem QR Code pronto para imprimir em balcões, cartões de visita, embalagens e cardápios.",
      },
    ],
    relatedNiches: ["lojas-de-roupa", "clinicas-de-estetica", "restaurantes"],
  },
];

export const COMPARISON_SLUGS = COMPARISONS.map((c) => c.slug);

export function getComparisonBySlug(slug: string): ComparisonItem | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
