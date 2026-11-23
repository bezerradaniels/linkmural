export type NicheVertical =
  | "profissionais"
  | "negocios-locais"
  | "criadores-b2b";

export type NichePreviewLink = {
  title: string;
  subtitle: string;
  size: "full" | "half";
  accent?: boolean;
};

export type NicheItem = {
  slug: string;
  name: string;
  vertical: NicheVertical;
  verticalLabel: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  aeoQuestion: string;
  aeoAnswer: string;
  preview: {
    handle: string;
    displayName: string;
    tagline: string;
    city: string;
    links: NichePreviewLink[];
  };
  essentialLinks: Array<{ title: string; impact: string }>;
  technicalHighlights: Array<{ title: string; description: string }>;
  faqs: Array<{ q: string; a: string }>;
  relatedSlugs: string[];
  recommendedComparisons: string[];
};

export const VERTICAL_LABELS: Record<NicheVertical, string> = {
  profissionais: "Profissionais Liberais e Serviços",
  "negocios-locais": "Negócios Locais e Varejo",
  "criadores-b2b": "Criadores, Infoprodutores e B2B",
};

export const NICHES: NicheItem[] = [
  // =========================================================================
  // VERTICAL A: Profissionais Liberais e Serviços
  // =========================================================================
  {
    slug: "medicos",
    name: "Médicos",
    vertical: "profissionais",
    verticalLabel: VERTICAL_LABELS.profissionais,
    metaTitle: "Link na bio para Médicos — agendamento, CRM e endereço",
    metaDescription:
      "Crie um link na bio profissional para médicos no linkmural: agendamento pelo WhatsApp ou Doctoralia, convênios aceitos, CRM e rota no Google Maps.",
    h1: "Link na bio profissional para Médicos — facilite o agendamento de consultas",
    subtitle:
      "Centralize WhatsApp da clínica, Doctoralia, convênios aceitos, especialidades e localização no Google Maps em uma página sóbria e rápida.",
    aeoQuestion: "O que colocar no link na bio de um médico?",
    aeoAnswer:
      "O link na bio de um médico deve priorizar o agendamento de consulta (WhatsApp da secretaria ou Doctoralia), exibir especialidade e número do CRM/RQE com clareza, listar os convênios aceitos e incluir a rota do consultório no Google Maps, além de orientações para primeira consulta ou telemedicina.",
    preview: {
      handle: "dra-camila-cardio",
      displayName: "Dra. Camila Nogueira",
      tagline: "Cardiologia Clínica · CRM-SP 184.210",
      city: "São Paulo, SP",
      links: [
        {
          title: "Agendar consulta pelo WhatsApp",
          subtitle: "Atendimento presencial e telemedicina",
          size: "full",
          accent: true,
        },
        {
          title: "Perfil no Doctoralia",
          subtitle: "Avaliações e agenda online",
          size: "half",
        },
        {
          title: "Como chegar à clínica",
          subtitle: "Abrir rota no Google Maps",
          size: "half",
        },
        {
          title: "Convênios e reembolso",
          subtitle: "Veja planos aceitos e orientações",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Agendamento via WhatsApp da recepção",
        impact:
          "Reduz o atrito entre o interesse no conteúdo educativo do Instagram e a marcação efetiva da consulta.",
      },
      {
        title: "Agenda online (Doctoralia / iClinic)",
        impact:
          "Permite que pacientes escolham horário mesmo fora do expediente comercial da secretaria.",
      },
      {
        title: "Localização no Google Maps",
        impact:
          "Evita atrasos e mensagens repetitivas pedindo endereço ou ponto de referência no dia da consulta.",
      },
      {
        title: "Convênios aceitos e preparo de exames",
        impact:
          "Qualifica o paciente antes do contato, economizando tempo da equipe de atendimento.",
      },
    ],
    technicalHighlights: [
      {
        title: "Carregamento instantâneo no celular",
        description:
          "Pacientes vindos de Reels ou Stories abrem sua página em menos de 1 segundo, sem telas travadas.",
      },
      {
        title: "Domínio próprio para autoridade médica",
        description:
          "No plano Studio, conecte drseunome.com.br para reforçar credibilidade em cartões, receituários e bio.",
      },
      {
        title: "Privacidade e LGPD",
        description:
          "Acompanhe cliques por botão e origem sem coletar dados sensíveis nem IP dos pacientes.",
      },
    ],
    faqs: [
      {
        q: "O link na bio do linkmural atende às boas práticas de publicidade médica?",
        a: "Sim. Você tem controle total do texto para exibir nome completo, especialidade, CRM e RQE em destaque, mantendo um layout sóbrio e informativo.",
      },
      {
        q: "Posso colocar dois endereços de consultório?",
        a: "Sim. Você pode adicionar cards separados para cada unidade com link direto para o Google Maps e horário de atendimento.",
      },
      {
        q: "Consigo saber quantos pacientes clicaram no botão do WhatsApp?",
        a: "Sim. O painel registra cliques por link e mostra de qual rede social vieram as visitas.",
      },
    ],
    relatedSlugs: ["dentistas", "psicologos", "clinicas-de-estetica"],
    recommendedComparisons: ["linkmural-vs-linktree", "linkmural-vs-biosite"],
  },
  {
    slug: "advogados",
    name: "Advogados",
    vertical: "profissionais",
    verticalLabel: VERTICAL_LABELS.profissionais,
    metaTitle: "Link na bio para Advogados — sobriedade visual e ética OAB",
    metaDescription:
      "Monte um link na bio sóbrio para advogados e escritórios de advocacia: áreas de atuação, consulta inicial, número da OAB, artigos e localização.",
    h1: "Link na bio profissional para Advogados — centralize seus canais com sobriedade",
    subtitle:
      "Apresente áreas de atuação, registro na OAB, artigos jurídicos e canal direto de atendimento em uma página elegante e respeitosa às normas éticas.",
    aeoQuestion: "O que colocar no link na bio de um advogado?",
    aeoAnswer:
      "O link na bio de um advogado deve apresentar identificação profissional (nome, escritório e OAB), áreas de atuação de forma informativa, canal direto para agendamento de consulta (WhatsApp ou formulário), links para artigos e publicações educativas e o endereço do escritório no Google Maps.",
    preview: {
      handle: "mendes-advocacia",
      displayName: "Mendes & Silva Advocacia",
      tagline: "Direito Trabalhista e Empresarial · OAB/SP",
      city: "Campinas, SP",
      links: [
        {
          title: "Falar com o escritório",
          subtitle: "Atendimento via WhatsApp comercial",
          size: "full",
          accent: true,
        },
        {
          title: "Áreas de atuação",
          subtitle: "Consultivo e contencioso",
          size: "half",
        },
        {
          title: "Artigos e guias",
          subtitle: "Conteúdo informativo",
          size: "half",
        },
        {
          title: "Endereço do escritório",
          subtitle: "Abrir rota no Google Maps",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Canal direto para consulta inicial",
        impact:
          "Direciona o potencial cliente para o WhatsApp ou formulário de triagem sem promessas comerciais indevidas.",
      },
      {
        title: "Áreas de atuação e especialidades",
        impact:
          "Deixa claro em quais demandas jurídicas você atua, filtrando contatos fora do seu escopo.",
      },
      {
        title: "Artigos, Jusbrasil ou site institucional",
        impact:
          "Reforça autoridade técnica para quem pesquisa seu nome antes de entrar em contato.",
      },
      {
        title: "Cartão de contato (vCard) e endereço",
        impact:
          "Permite salvar telefone e e-mail do escritório na agenda do celular em 1 toque.",
      },
    ],
    technicalHighlights: [
      {
        title: "Estilos sóbrios e tipografia editorial",
        description:
          "Escolha paletas neutras e minimalistas que transmitem seriedade e confiança jurídica.",
      },
      {
        title: "Domínio próprio do escritório",
        description:
          "Use links.seuescritorio.adv.br ou domínio customizado no plano Studio.",
      },
      {
        title: "Métricas de origem por canal",
        description:
          "Meça se os contatos vêm do Instagram, LinkedIn, Google ou cartão de visita com QR Code.",
      },
    ],
    faqs: [
      {
        q: "Posso remover o selo do linkmural para deixar a página 100% institucional?",
        a: "Sim. A partir do plano Pro você remove 'Feito com linkmural' do rodapé, e no Studio pode conectar o domínio do escritório.",
      },
      {
        q: "O linkmural gera QR Code para colocar em cartões de visita?",
        a: "Sim. Toda página tem QR Code próprio pronto para download e impressão.",
      },
      {
        q: "É possível criar uma página para o escritório e outra para sócios?",
        a: "Sim. O plano Studio permite gerenciar até 3 páginas publicadas na mesma conta.",
      },
    ],
    relatedSlugs: ["medicos", "arquitetos", "corretores-de-imoveis"],
    recommendedComparisons: ["linkmural-vs-biosite", "linkmural-vs-linktree"],
  },
  {
    slug: "dentistas",
    name: "Dentistas",
    vertical: "profissionais",
    verticalLabel: VERTICAL_LABELS.profissionais,
    metaTitle: "Link na bio para Dentistas — avaliação no WhatsApp e portfólio",
    metaDescription:
      "Crie o link na bio da sua clínica odontológica: agendamento de avaliação pelo WhatsApp, galeria de casos, CRO, procedimentos e localização no Maps.",
    h1: "Link na bio para Dentistas e Clínicas Odontológicas — transforme visitas em avaliações",
    subtitle:
      "Destaque avaliação pelo WhatsApp, galeria em carrossel, lista de procedimentos e localização da clínica em um Bento Grid visual.",
    aeoQuestion: "O que colocar no link na bio de um dentista?",
    aeoAnswer:
      "Um link na bio eficiente para dentistas deve trazer em primeiro lugar o botão de agendamento de avaliação no WhatsApp, acompanhado de uma galeria de casos clínicos, lista dos principais tratamentos (implantes, lentes, ortodontia), número do CRO e endereço da clínica com rota no Google Maps.",
    preview: {
      handle: "odonto-sorriso-prime",
      displayName: "Dr. Rafael Costa",
      tagline: "Implantodontia e Estética · CRO-MG 42.890",
      city: "Belo Horizonte, MG",
      links: [
        {
          title: "Agendar avaliação no WhatsApp",
          subtitle: "Resposta rápida da recepção",
          size: "full",
          accent: true,
        },
        {
          title: "Tratamentos",
          subtitle: "Implantes, lentes e clareamento",
          size: "half",
        },
        {
          title: "Localização da clínica",
          subtitle: "Estacionamento no local",
          size: "half",
        },
        {
          title: "Avaliações no Google",
          subtitle: "Veja depoimentos de pacientes",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Avaliação pelo WhatsApp em destaque",
        impact:
          "Captura o paciente no momento exato em que ele se interessa por um tratamento no feed.",
      },
      {
        title: "Galeria de casos e estrutura da clínica",
        impact:
          "No plano Studio, o carrossel de fotos mostra a clínica e resultados direto na página sem abrir outra aba.",
      },
      {
        title: "Cards de tratamentos e procedimentos",
        impact:
          "Organiza dúvidas frequentes sobre implantes, alinhadores, facetas e odontopediatria.",
      },
      {
        title: "Avaliações no Google e rota no Maps",
        impact:
          "Prova social imediata combinada com facilidade para chegar à clínica.",
      },
    ],
    technicalHighlights: [
      {
        title: "Galeria em carrossel no Bento Grid",
        description:
          "Apresente a estrutura do consultório e resultados de forma limpa e mobile-first.",
      },
      {
        title: "Links rastreáveis para anúncios",
        description:
          "Compare cliques vindos de tráfego pago, Reels orgânicos e Google Meu Negócio.",
      },
      {
        title: "Pronto em menos de 3 minutos",
        description:
          "Atualize horários de atendimento ou campanhas sazonais direto do celular.",
      },
    ],
    faqs: [
      {
        q: "Posso mostrar fotos da clínica direto no link da bio?",
        a: "Sim. O plano Studio permite adicionar uma galeria de fotos em carrossel integrada ao Bento Grid.",
      },
      {
        q: "Consigo incluir um vídeo apresentando o consultório?",
        a: "Sim. Você pode embutir um vídeo do YouTube em formato 16:9 diretamente na página.",
      },
      {
        q: "O plano Grátis já funciona para começar?",
        a: "Sim. No plano Grátis você já cria sua página com até 5 links, logo, capa e métricas de visitas e cliques.",
      },
    ],
    relatedSlugs: ["medicos", "clinicas-de-estetica", "psicologos"],
    recommendedComparisons: ["linkmural-vs-linktree", "linkmural-vs-canva"],
  },
  {
    slug: "psicologos",
    name: "Psicólogos",
    vertical: "profissionais",
    verticalLabel: VERTICAL_LABELS.profissionais,
    metaTitle: "Link na bio para Psicólogos — sessões online, presencial e CRP",
    metaDescription:
      "Crie um link na bio acolhedor para psicólogos: agendamento de sessão online ou presencial, CRP, abordagem terapêutica e conteúdos.",
    h1: "Link na bio para Psicólogos — acolha novos pacientes com clareza",
    subtitle:
      "Apresente sua abordagem terapêutica, registro no CRP, atendimento online ou presencial e agendamento pelo WhatsApp em um espaço calmo e organizado.",
    aeoQuestion: "O que colocar no link na bio de um psicólogo?",
    aeoAnswer:
      "O link na bio de um psicólogo deve informar claramente o número do CRP, a abordagem terapêutica (como TCC ou Psicanálise), se o atendimento é online e/ou presencial, um botão direto para agendar a primeira sessão no WhatsApp e orientações rápidas sobre funcionamento e duração das sessões.",
    preview: {
      handle: "psi-helena-duarte",
      displayName: "Helena Duarte · Psicóloga",
      tagline: "Terapia Cognitivo-Comportamental · CRP 06/152390",
      city: "Atendimento Online e Curitiba, PR",
      links: [
        {
          title: "Agendar primeira sessão",
          subtitle: "Conversar pelo WhatsApp",
          size: "full",
          accent: true,
        },
        {
          title: "Sobre a abordagem TCC",
          subtitle: "Como funcionam as sessões",
          size: "half",
        },
        {
          title: "Atendimento Online",
          subtitle: "Brasil e exterior",
          size: "half",
        },
        {
          title: "Materiais e leituras",
          subtitle: "Conteúdos sobre ansiedade e rotina",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Agendamento de primeira conversa",
        impact:
          "Reduz a insegurança de quem busca terapia pela primeira vez com uma mensagem acolhedora no WhatsApp.",
      },
      {
        title: "Abordagem e público atendido",
        impact:
          "Explica se você atende adultos, adolescentes, casais ou famílias, alinhando expectativas.",
      },
      {
        title: "Modalidade Online e Presencial",
        impact:
          "Deixa evidente que pacientes de outras cidades ou brasileiros no exterior também podem agendar.",
      },
      {
        title: "Conteúdos educativos ou podcast",
        impact:
          "Aprofunda o vínculo de confiança para quem ainda está decidindo iniciar o processo terapêutico.",
      },
    ],
    technicalHighlights: [
      {
        title: "Design leve e sem poluição visual",
        description:
          "8 estilos visuais cuidadosamente calibrados para transmitir calma, clareza e profissionalismo.",
      },
      {
        title: "Privacidade respeitada (LGPD)",
        description:
          "Nenhum dado pessoal ou IP dos visitantes é armazenado nas métricas da página.",
      },
      {
        title: "Plano gratuito sem prazo de expiração",
        description:
          "Comece sem custos e evolua para Pro ou Studio apenas se quiser domínio próprio ou mais blocos.",
      },
    ],
    faqs: [
      {
        q: "Posso colocar link para agenda do Google Calendar ou Calendly?",
        a: "Sim. Você pode adicionar qualquer ferramenta de agendamento ao lado do WhatsApp.",
      },
      {
        q: "É fácil alterar a disponibilidade de novos horários?",
        a: "Sim. Você pode usar o campo de status da página (ex.: 'Agenda aberta para novos pacientes') e atualizar em segundos.",
      },
      {
        q: "Preciso de conhecimentos técnicos para criar a página?",
        a: "Não. O assistente guiado do linkmural coloca sua página no ar em menos de 3 minutos.",
      },
    ],
    relatedSlugs: ["medicos", "dentistas", "advogados"],
    recommendedComparisons: ["linkmural-vs-linktree", "linkmural-vs-canva"],
  },
  {
    slug: "arquitetos",
    name: "Arquitetos",
    vertical: "profissionais",
    verticalLabel: VERTICAL_LABELS.profissionais,
    metaTitle: "Link na bio para Arquitetos — portfólio visual, Behance e orçamento",
    metaDescription:
      "Crie uma vitrine em Bento Grid para arquitetos e designers de interiores: portfólio em carrossel, solicitação de orçamento, Pinterest, Behance e CAU.",
    h1: "Link na bio para Arquitetos — transforme sua bio em um portfólio em Bento Grid",
    subtitle:
      "Exiba projetos em carrossel, solicitação de orçamento, Pinterest, Behance e vídeo de obras em uma página à altura do seu senso estético.",
    aeoQuestion: "O que colocar no link na bio de um arquiteto?",
    aeoAnswer:
      "O link na bio de um arquiteto deve destacar um botão direto para solicitação de orçamento (WhatsApp ou formulário de briefing), galeria visual com projetos concluídos, links para portfólio completo (site, Behance ou Pinterest), serviços oferecidos (residencial, comercial, interiores) e cidade de atuação.",
    preview: {
      handle: "studio-linha-arq",
      displayName: "Studio Linha Arquitetura",
      tagline: "Projetos Residenciais e Interiores · CAU A192840-2",
      city: "Florianópolis, SC",
      links: [
        {
          title: "Solicitar orçamento de projeto",
          subtitle: "Briefing rápido pelo WhatsApp",
          size: "full",
          accent: true,
        },
        {
          title: "Portfólio no Behance",
          subtitle: "Projetos entregues",
          size: "half",
        },
        {
          title: "Referências no Pinterest",
          subtitle: "Pastas de inspiração",
          size: "half",
        },
        {
          title: "Consultoria de Interiores",
          subtitle: "Online para todo o Brasil",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Solicitação de orçamento / Briefing",
        impact:
          "Converte seguidores inspirados pelos seus projetos em leads qualificados no WhatsApp ou formulário.",
      },
      {
        title: "Galeria visual de projetos",
        impact:
          "Mostra acabamento, paleta e assinatura estética logo no primeiro scroll da página.",
      },
      {
        title: "Behance, Pinterest e site oficial",
        impact:
          "Reúne suas vitrines de portfólio em um endereço único e fácil de compartilhar.",
      },
      {
        title: "Cards de Serviços (Projeto vs. Consultoria)",
        impact:
          "Ajuda o cliente a entender escopo, formato de entrega e diferença entre reforma completa e consultoria.",
      },
    ],
    technicalHighlights: [
      {
        title: "Estética Bento Grid com efeitos Glass e Glossy",
        description:
          "Personalize proporções 2×1, 1×1 e 2×2 para criar uma composição digna de portfólio editorial.",
      },
      {
        title: "Fotos em alta qualidade e vídeo do YouTube",
        description:
          "Incorpore tours de projetos finalizados em vídeo 16:9 e carrossel de fotos no plano Studio.",
      },
      {
        title: "Domínio próprio para o escritório",
        description:
          "Compartilhe uma URL com a marca do seu estúdio em apresentações comerciais e propostas.",
      },
    ],
    faqs: [
      {
        q: "Por que arquitetos preferem Bento Grid em vez de lista simples de botões?",
        a: "Porque arquitetura é visual. O Bento Grid destaca imagens de projetos, hierarquia de cards e tipografia refinada em vez de empilhar botões genéricos.",
      },
      {
        q: "Posso usar imagens do Unsplash para capa e fundo?",
        a: "Sim, mas você também pode subir fotos autorais dos seus próprios projetos direto no painel.",
      },
      {
        q: "Posso colocar o link de um formulário do Typeform ou Google Forms?",
        a: "Sim. Qualquer formulário de briefing pode ser adicionado como card de destaque.",
      },
    ],
    relatedSlugs: ["agencias-e-freelancers", "corretores-de-imoveis", "advogados"],
    recommendedComparisons: ["linkmural-vs-bento", "linkmural-vs-canva"],
  },
  {
    slug: "corretores-de-imoveis",
    name: "Corretores de Imóveis",
    vertical: "profissionais",
    verticalLabel: VERTICAL_LABELS.profissionais,
    metaTitle: "Link na bio para Corretores de Imóveis — catálogo, WhatsApp e CRECI",
    metaDescription:
      "Monte o link na bio ideal para corretores e imobiliárias: catálogo de imóveis em destaque, simulador de financiamento, WhatsApp direto e CRECI.",
    h1: "Link na bio para Corretores de Imóveis — acelere o contato de compradores",
    subtitle:
      "Organize imóveis em destaque, tour em vídeo no YouTube, simulador de financiamento, CRECI e WhatsApp direto em uma página rápida.",
    aeoQuestion: "O que colocar no link na bio de um corretor de imóveis?",
    aeoAnswer:
      "O link na bio de um corretor de imóveis deve incluir botão de WhatsApp para atendimento imediato, catálogo com imóveis em destaque ou lançamentos, vídeo tour de propriedades, link para simulação de financiamento, número do CRECI e região de atuação para filtrar compradores qualificados.",
    preview: {
      handle: "lucas-imoveis-alto-padrao",
      displayName: "Lucas Ferreira · Imóveis",
      tagline: "Alto Padrão e Lançamentos · CRECI-SP 219.440",
      city: "São José dos Campos, SP",
      links: [
        {
          title: "Falar no WhatsApp agora",
          subtitle: "Atendimento personalizado para compra",
          size: "full",
          accent: true,
        },
        {
          title: "Imóveis em destaque",
          subtitle: "Apartamentos e casas disponíveis",
          size: "half",
        },
        {
          title: "Simular financiamento",
          subtitle: "Calcule entrada e parcelas",
          size: "half",
        },
        {
          title: "Anuncie seu imóvel comigo",
          subtitle: "Avaliação gratuita e fotos profissionais",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "WhatsApp direto com resposta rápida",
        impact:
          "No mercado imobiliário, velocidade de atendimento define quem fecha a visita.",
      },
      {
        title: "Catálogo de lançamentos e destaques",
        impact:
          "Direciona quem viu um Reels de imóvel direto para a ficha completa ou seleção atualizada.",
      },
      {
        title: "Vídeo tour do YouTube embutido",
        impact:
          "Permite que o comprador assista ao tour completo do imóvel destaque sem sair da página.",
      },
      {
        title: "Captação de proprietários (Anuncie seu imóvel)",
        impact:
          "Gera novos imóveis para sua carteira enquanto você atende compradores.",
      },
    ],
    technicalHighlights: [
      {
        title: "Links rastreáveis por campanha",
        description:
          "Descubra quais imóveis e anúncios geram mais cliques no WhatsApp.",
      },
      {
        title: "QR Code para placas e plantões",
        description:
          "Coloque o QR Code da sua página em banners, cartões e estandes de lançamento.",
      },
      {
        title: "Atualização rápida de estoque",
        description:
          "Troque o imóvel em destaque em segundos pelo celular assim que uma unidade for vendida.",
      },
    ],
    faqs: [
      {
        q: "Posso colocar um vídeo tour de imóvel direto na página?",
        a: "Sim. No plano Studio você incorpora vídeos do YouTube em formato 16:9 e galerias de fotos em carrossel.",
      },
      {
        q: "Posso gerenciar páginas separadas para lançamentos diferentes?",
        a: "Sim. O plano Studio permite até 3 páginas publicadas na mesma conta.",
      },
      {
        q: "O cliente consegue salvar meu telefone na agenda?",
        a: "Sim. Toda página do linkmural oferece cartão de contato (vCard) para salvar telefone, WhatsApp e e-mail em 1 toque.",
      },
    ],
    relatedSlugs: ["arquitetos", "advogados", "agencias-e-freelancers"],
    recommendedComparisons: ["linkmural-vs-linktree", "linkmural-vs-biosite"],
  },

  // =========================================================================
  // VERTICAL B: Negócios Locais e Varejo
  // =========================================================================
  {
    slug: "restaurantes",
    name: "Restaurantes",
    vertical: "negocios-locais",
    verticalLabel: VERTICAL_LABELS["negocios-locais"],
    metaTitle: "Link na bio para Restaurantes — cardápio digital, delivery e reservas",
    metaDescription:
      "Crie o link na bio do seu restaurante, pizzaria ou cafeteria: cardápio digital, link para iFood ou delivery próprio, reservas, horários e rota no Maps.",
    h1: "Link na bio para Restaurantes e Delivery — transforme fome em pedido",
    subtitle:
      "Reúna cardápio digital, pedido pelo delivery próprio ou iFood, reserva de mesa, horário de funcionamento e rota no Maps em 1 clique.",
    aeoQuestion: "O que colocar no link na bio de um restaurante?",
    aeoAnswer:
      "O link na bio de um restaurante deve priorizar o cardápio digital e o link de pedido (delivery próprio no WhatsApp/app ou iFood), seguido por reserva de mesas, horário de funcionamento atualizado, galeria com fotos dos pratos principais e endereço com rota direta no Google Maps.",
    preview: {
      handle: "forno-e-brasa-pizza",
      displayName: "Forno & Brasa Pizzaria",
      tagline: "Fermentação natural · Terça a Domingo, 18h–23h",
      city: "Pinheiros, São Paulo",
      links: [
        {
          title: "Pedir pelo Delivery Próprio",
          subtitle: "Taxa reduzida + cupom no 1º pedido",
          size: "full",
          accent: true,
        },
        {
          title: "Ver Cardápio Digital",
          subtitle: "Pizzas, entradas e vinhos",
          size: "half",
        },
        {
          title: "Pedir no iFood",
          subtitle: "Entrega expressa",
          size: "half",
        },
        {
          title: "Reservar mesa ou rota no Maps",
          subtitle: "Rua dos Pinheiros, 840",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Delivery próprio (WhatsApp / Cardápio web)",
        impact:
          "Incentiva pedidos diretos sem comissão de marketplaces colocando o canal próprio no topo.",
      },
      {
        title: "Cardápio digital atualizado",
        impact:
          "Responde imediatamente à principal dúvida de quem descobre o restaurante pelo Instagram.",
      },
      {
        title: "iFood e apps parceiros",
        impact:
          "Mantém a conveniência para clientes que já têm cupom ou cartão salvo no aplicativo.",
      },
      {
        title: "Reservas, horário e Google Maps",
        impact:
          "Evita mensagens perguntando se o salão está aberto hoje ou onde fica o restaurante.",
      },
    ],
    technicalHighlights: [
      {
        title: "Abertura rápida na hora da fome",
        description:
          "Páginas leves que carregam instantaneamente no 4G, reduzindo desistências antes do pedido.",
      },
      {
        title: "Horário de funcionamento nativo",
        description:
          "Mostre seus horários de abertura organizados diretamente no cabeçalho da página.",
      },
      {
        title: "QR Code pronto para mesas e embalagens",
        description:
          "Use o mesmo endereço e QR Code para cardápio de mesa, flyers e sacolas de delivery.",
      },
    ],
    faqs: [
      {
        q: "Posso colocar link para o meu cardápio em PDF ou sistema de pedidos?",
        a: "Sim. Você pode conectar links do Anota AI, Goomer, Cardápio Web, iFood, WhatsApp ou qualquer PDF hospedado.",
      },
      {
        q: "Consigo destacar fotos dos pratos na página?",
        a: "Sim. O plano Studio inclui galeria em carrossel para exibir seus pratos mais pedidos logo na abertura.",
      },
      {
        q: "Posso ter uma página para cada unidade do restaurante?",
        a: "Sim. O plano Studio permite gerenciar até 3 páginas publicadas na mesma conta.",
      },
    ],
    relatedSlugs: ["lojas-de-roupa", "clinicas-de-estetica", "academias-e-personal"],
    recommendedComparisons: ["linkmural-vs-linktree", "linkmural-vs-canva"],
  },
  {
    slug: "clinicas-de-estetica",
    name: "Clínicas de Estética",
    vertical: "negocios-locais",
    verticalLabel: VERTICAL_LABELS["negocios-locais"],
    metaTitle: "Link na bio para Clínicas de Estética — procedimentos e agendamento",
    metaDescription:
      "Crie o link na bio da sua clínica de estética: tabela de procedimentos com preço e duração, agendamento rápido no WhatsApp, galeria e avaliações.",
    h1: "Link na bio para Clínicas de Estética — transforme seguidores em agendamentos",
    subtitle:
      "Apresente seus procedimentos com cards de serviços, fotos em carrossel, avaliações no Google e agendamento direto no WhatsApp.",
    aeoQuestion: "O que colocar no link na bio de uma clínica de estética?",
    aeoAnswer:
      "O link na bio de uma clínica de estética deve destacar o agendamento rápido pelo WhatsApp, uma lista ou cards dos principais procedimentos (harmonização, limpeza de pele, laser, drenagem), galeria com fotos do espaço e resultados, avaliações no Google e a localização da clínica no Maps.",
    preview: {
      handle: "lumiere-estetica",
      displayName: "Lumière Estética Avançada",
      tagline: "Estética Facial, Corporal e Laser",
      city: "Moema, São Paulo",
      links: [
        {
          title: "Agendar avaliação pelo WhatsApp",
          subtitle: "Horários disponíveis esta semana",
          size: "full",
          accent: true,
        },
        {
          title: "Menu de Procedimentos",
          subtitle: "Facial, corporal e depilação",
          size: "half",
        },
        {
          title: "Avaliações 5★ no Google",
          subtitle: "+320 clientes atendidas",
          size: "half",
        },
        {
          title: "Como chegar à clínica",
          subtitle: "Av. Pavão, 412 · Estacionamento",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Agendamento rápido no WhatsApp",
        impact:
          "Converte o desejo gerado por Reels de procedimentos em horário marcado na agenda.",
      },
      {
        title: "Cards de Serviços com duração e CTA",
        impact:
          "No plano Studio, apresente cada protocolo com descrição, tempo médio e botão direto para agendar.",
      },
      {
        title: "Galeria do espaço e resultados",
        impact:
          "Transmite higiene, sofisticação e confiança antes mesmo da primeira visita.",
      },
      {
        title: "Avaliações no Google e localização",
        impact:
          "Reforça prova social local para quem pesquisa clínicas próximas.",
      },
    ],
    technicalHighlights: [
      {
        title: "Visual premium com efeitos Glass e Glossy",
        description:
          "Estilos elegantes que combinam com a identidade visual de clínicas de beleza e bem-estar.",
      },
      {
        title: "Métricas por procedimento e anúncio",
        description:
          "Saiba quais tratamentos despertam mais cliques e quais campanhas dão mais retorno.",
      },
      {
        title: "Chave Pix e vCard integrados",
        description:
          "Facilite o envio de sinal para reserva de horário e salve o contato da recepção.",
      },
    ],
    faqs: [
      {
        q: "Posso mostrar os procedimentos com preço ou 'sob consulta'?",
        a: "Sim. Os cards de serviços permitem informar valor, duração e um botão de ação personalizado.",
      },
      {
        q: "Funciona para esteticistas autônomas e salões de beleza?",
        a: "Sim. Tanto profissionais autônomas quanto clínicas com várias salas usam o linkmural.",
      },
      {
        q: "Posso atualizar promoções do mês facilmente?",
        a: "Sim. Você cria, pausa ou destaca cards promocionais em segundos pelo celular.",
      },
    ],
    relatedSlugs: ["dentistas", "medicos", "lojas-de-roupa"],
    recommendedComparisons: ["linkmural-vs-canva", "linkmural-vs-linktree"],
  },
  {
    slug: "academias-e-personal",
    name: "Academias e Personal Trainers",
    vertical: "negocios-locais",
    verticalLabel: VERTICAL_LABELS["negocios-locais"],
    metaTitle: "Link na bio para Academias e Personal Trainers — planos e aula experimental",
    metaDescription:
      "Crie o link na bio da sua academia, box ou consultoria de personal trainer: planos, aula experimental, consultoria online e app de treino.",
    h1: "Link na bio para Academias e Personal Trainers — feche mais alunos pela bio",
    subtitle:
      "Centralize aula experimental, planos de consultoria online, app de treino, horários das aulas e WhatsApp em uma página de alta energia.",
    aeoQuestion: "O que colocar no link na bio de uma academia ou personal trainer?",
    aeoAnswer:
      "O link na bio de uma academia ou personal trainer deve destacar o botão para agendar aula experimental ou consultoria online, apresentar os planos disponíveis, incluir link direto para o aplicativo de treinos dos alunos atuais, grade de horários e endereço da unidade no Google Maps.",
    preview: {
      handle: "coach-bruno-treino",
      displayName: "Bruno Almeida · Personal",
      tagline: "Hipertrofia e Emagrecimento · CREF 098210-G/SP",
      city: "Online e Presencial",
      links: [
        {
          title: "Quero minha Consultoria Online",
          subtitle: "Treino personalizado + suporte semanal",
          size: "full",
          accent: true,
        },
        {
          title: "Agendar aula experimental",
          subtitle: "Vagas presenciais",
          size: "half",
        },
        {
          title: "App de Treino (Alunos)",
          subtitle: "Acesso às planilhas",
          size: "half",
        },
        {
          title: "Resultados de alunos",
          subtitle: "Veja evoluções reais",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Aula experimental ou avaliação física",
        impact:
          "É a oferta de menor barreira para transformar seguidores locais em alunos matriculados.",
      },
      {
        title: "Planos de consultoria online",
        impact:
          "Apresenta benefícios e direciona para o checkout ou fechamento pelo WhatsApp.",
      },
      {
        title: "Acesso ao App de treinos",
        impact:
          "Facilita a rotina dos alunos atuais sem poluir a mensagem principal de captação.",
      },
      {
        title: "Vídeo de apresentação ou tour da academia",
        impact:
          "Mostra equipamentos, ambiente e metodologia para gerar confiança imediata.",
      },
    ],
    technicalHighlights: [
      {
        title: "Cards de destaque em Bento Grid",
        description:
          "Dê tamanho 2×2 ao plano principal ou aula experimental para maximizar cliques.",
      },
      {
        title: "Rastreamento de origem (Reels, TikTok, Ads)",
        description:
          "Saiba exatamente qual rede social traz mais interessados na consultoria.",
      },
      {
        title: "QR Code para recepção e eventos",
        description:
          "Use o QR Code na academia para alunos acessarem grade de horários e app.",
      },
    ],
    faqs: [
      {
        q: "Posso separar links para novos alunos e alunos já matriculados?",
        a: "Sim. Você pode colocar a oferta de matrícula/consultoria no topo em destaque e os acessos de alunos nos cards menores abaixo.",
      },
      {
        q: "Posso incluir link de pagamento do Stripe, Mercado Pago ou Kiwify?",
        a: "Sim. Qualquer URL de checkout ou página de vendas pode ser adicionada como botão.",
      },
      {
        q: "O linkmural funciona bem para estúdios de Pilates e CrossFit?",
        a: "Sim. É ideal para academias, estúdios de Pilates, boxes de CrossFit, lutas e personal trainers.",
      },
    ],
    relatedSlugs: ["clinicas-de-estetica", "restaurantes", "infoprodutores"],
    recommendedComparisons: ["linkmural-vs-linktree", "linkmural-vs-beacons"],
  },
  {
    slug: "lojas-de-roupa",
    name: "Lojas de Roupa",
    vertical: "negocios-locais",
    verticalLabel: VERTICAL_LABELS["negocios-locais"],
    metaTitle: "Link na bio para Lojas de Roupa — catálogo WhatsApp e e-commerce",
    metaDescription:
      "Crie uma vitrine em Bento Grid para lojas de roupa e moda: catálogo no WhatsApp, loja virtual, coleções em destaque, trocas e endereço físico.",
    h1: "Link na bio para Lojas de Roupa — transforme sua bio em uma vitrine que vende",
    subtitle:
      "Combine loja virtual, catálogo no WhatsApp, fotos da nova coleção em carrossel, política de trocas e endereço da loja física.",
    aeoQuestion: "O que colocar no link na bio de uma loja de roupa?",
    aeoAnswer:
      "O link na bio de uma loja de roupa deve destacar o link direto para a loja virtual ou catálogo do WhatsApp, apresentar a coleção em destaque com fotos, incluir link para atendimento de tamanhos/envios, informar a política de trocas e mostrar o endereço físico com horário de funcionamento.",
    preview: {
      handle: "atelier-sol-moda",
      displayName: "Atelier Sol · Moda Feminina",
      tagline: "Envio para todo o Brasil · Loja física em Goiânia",
      city: "Goiânia, GO",
      links: [
        {
          title: "Comprar Nova Coleção",
          subtitle: "Acesse a loja virtual oficial",
          size: "full",
          accent: true,
        },
        {
          title: "Catálogo no WhatsApp",
          subtitle: "Atendimento com consultora",
          size: "half",
        },
        {
          title: "Loja Física (Maps)",
          subtitle: "Seg a Sáb, 9h às 19h",
          size: "half",
        },
        {
          title: "Tabela de medidas e trocas",
          subtitle: "Compre com tranquilidade",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Loja virtual / Coleção da semana",
        impact:
          "Leva quem gostou de um look nos Stories direto para a página do produto com menos cliques.",
      },
      {
        title: "Venda consultiva pelo WhatsApp",
        impact:
          "Converte clientes que têm dúvida sobre caimento, tecido, numeração ou frete expresso.",
      },
      {
        title: "Galeria da coleção em carrossel",
        impact:
          "Reforça o desejo visual logo ao abrir o link da bio no celular.",
      },
      {
        title: "Endereço físico, horários e política de trocas",
        impact:
          "Aumenta a segurança de compra online e leva tráfego qualificado para a loja física.",
      },
    ],
    technicalHighlights: [
      {
        title: "Atualização ágil a cada lançamento",
        description:
          "Troque o banner da coleção ou o link do cupom em segundos sem depender de designer.",
      },
      {
        title: "Métricas de clique por coleção",
        description:
          "Veja quantos cliques cada campanha gerou no e-commerce versus WhatsApp.",
      },
      {
        title: "Chave Pix e QR Code na loja física",
        description:
          "Agilize vendas pelo WhatsApp e divulgue o catálogo digital no balcão.",
      },
    ],
    faqs: [
      {
        q: "Funciona com Nuvemshop, Shopify, Tray e Shopee?",
        a: "Sim. Você pode colocar links diretos para sua loja em qualquer plataforma de e-commerce ou marketplace.",
      },
      {
        q: "Posso colocar links diferentes para atacado e varejo?",
        a: "Sim. Basta criar cards distintos para 'Comprar no Varejo' e 'Catálogo Atacado' com visual bem diferenciado.",
      },
      {
        q: "É melhor usar o linkmural ou um site feito no Canva para loja?",
        a: "O linkmural abre mais rápido no navegador do Instagram, mede cliques por botão e permite atualizar links de coleção pelo celular sem quebrar o layout.",
      },
    ],
    relatedSlugs: ["clinicas-de-estetica", "restaurantes", "criadores-de-conteudo"],
    recommendedComparisons: ["linkmural-vs-canva", "linkmural-vs-linktree"],
  },

  // =========================================================================
  // VERTICAL C: Criadores, Infoprodutores e B2B
  // =========================================================================
  {
    slug: "criadores-de-conteudo",
    name: "Criadores de Conteúdo",
    vertical: "criadores-b2b",
    verticalLabel: VERTICAL_LABELS["criadores-b2b"],
    metaTitle: "Link na bio para Criadores de Conteúdo — mídia kit, YouTube e afiliados",
    metaDescription:
      "Crie um link na bio em Bento Grid para influenciadores e criadores: mídia kit, parcerias, links de afiliados, último vídeo do YouTube e TikTok.",
    h1: "Link na bio para Criadores de Conteúdo — organize canais, afiliados e publis",
    subtitle:
      "Destaque seu último vídeo do YouTube, links de afiliados, mídia kit para marcas e redes sociais em um Bento Grid com a sua estética.",
    aeoQuestion: "O que colocar no link na bio de um criador de conteúdo?",
    aeoAnswer:
      "O link na bio de um criador de conteúdo deve reunir o conteúdo mais recente em destaque (como vídeo do YouTube ou podcast), links de produtos recomendados e afiliados, mídia kit e e-mail comercial para marcas, além dos perfis secundários (TikTok, newsletter e comunidade).",
    preview: {
      handle: "marina-vlogs",
      displayName: "Marina Rocha",
      tagline: "Lifestyle, Viagens e Tecnologia",
      city: "Rio de Janeiro, RJ",
      links: [
        {
          title: "Meus achadinhos e links",
          subtitle: "Amazon, Mercado Livre e cupons",
          size: "full",
          accent: true,
        },
        {
          title: "Canal no YouTube",
          subtitle: "Vídeos novos toda quinta",
          size: "half",
        },
        {
          title: "Mídia Kit e Publis",
          subtitle: "Contato comercial para marcas",
          size: "half",
        },
        {
          title: "Newsletter semanal",
          subtitle: "Bastidores e dicas grátis",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Vitrine de afiliados e cupons",
        impact:
          "Monetiza o tráfego diário de Stories e Reels com links fáceis de achar no topo.",
      },
      {
        title: "Último vídeo do YouTube embutido",
        impact:
          "Aumenta visualizações permitindo assistir ao vídeo direto no seu Bento Grid.",
      },
      {
        title: "Mídia kit e contato comercial",
        impact:
          "Profissionaliza o primeiro contato de agências e marcas interessadas em publicidade.",
      },
      {
        title: "Comunidade, newsletter ou outras redes",
        impact:
          "Transforma audiência alugada do algoritmo em audiência própria.",
      },
    ],
    technicalHighlights: [
      {
        title: "Identidade visual única em Bento Grid",
        description:
          "Saia do visual padronizado combinando cards 2×1, 1×1, 2×2, Doodles e fotos do Unsplash.",
      },
      {
        title: "Links rastreáveis por rede social",
        description:
          "Compare quantos cliques vêm do Instagram, TikTok, YouTube e Threads.",
      },
      {
        title: "Sem cobrança em dólar",
        description:
          "Planos em reais pensados para criadores brasileiros em qualquer estágio.",
      },
    ],
    faqs: [
      {
        q: "Posso colocar links de afiliados da Amazon, Shopee e Mercado Livre?",
        a: "Sim. Você pode organizar quantos links de afiliados quiser a partir do plano Pro (links ilimitados).",
      },
      {
        q: "Consigo embutir meu vídeo mais recente do YouTube?",
        a: "Sim. O plano Studio permite adicionar vídeos do YouTube em formato 16:9 diretamente no grid.",
      },
      {
        q: "Posso remover a marca do linkmural da minha página?",
        a: "Sim, a remoção da marca do rodapé está inclusa a partir do plano Pro.",
      },
    ],
    relatedSlugs: ["infoprodutores", "musicos-e-artistas", "agencias-e-freelancers"],
    recommendedComparisons: ["linkmural-vs-beacons", "linkmural-vs-bento"],
  },
  {
    slug: "infoprodutores",
    name: "Infoprodutores",
    vertical: "criadores-b2b",
    verticalLabel: VERTICAL_LABELS["criadores-b2b"],
    metaTitle: "Link na bio para Infoprodutores — páginas de vendas, leads e UTM",
    metaDescription:
      "Crie um link na bio focado em conversão para infoprodutores e mentores: páginas de vendas, isca digital, comunidade, YouTube e rastreamento UTM.",
    h1: "Link na bio para Infoprodutores — maximize cliques em páginas de vendas e leads",
    subtitle:
      "Direcione sua audiência para iscas digitais, cursos, mentorias, comunidades e vídeos no YouTube com rastreamento claro por canal.",
    aeoQuestion: "O que colocar no link na bio de um infoprodutor?",
    aeoAnswer:
      "O link na bio de um infoprodutor deve seguir a escada de valor: destaque principal para a campanha ativa (lançamento, aula gratuita ou página de vendas), seguido por isca digital de captura de leads, link para mentoria ou produto high-ticket, comunidade/YouTube e suporte ao aluno.",
    preview: {
      handle: "metodo-escala-pro",
      displayName: "Thiago Martins",
      tagline: "Estratégia Digital e Vendas Online",
      city: "Cursos e Mentoria",
      links: [
        {
          title: "Inscrições Abertas · Método Escala",
          subtitle: "Últimas vagas da turma com bônus",
          size: "full",
          accent: true,
        },
        {
          title: "Baixar Guia Gratuito",
          subtitle: "Checklist de funil em PDF",
          size: "half",
        },
        {
          title: "Aplicar para Mentoria",
          subtitle: "Acompanhamento individual",
          size: "half",
        },
        {
          title: "Aulas gratuitas no YouTube",
          subtitle: "Conteúdo aprofundado semanal",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Oferta principal / Lançamento ativo",
        impact:
          "Concentra atenção no CTA prioritário do momento com card em destaque no topo.",
      },
      {
        title: "Isca digital para captura de leads",
        impact:
          "Alimenta sua lista de e-mail e WhatsApp mesmo fora de períodos de carrinho aberto.",
      },
      {
        title: "Aplicação para mentoria ou consultoria",
        impact:
          "Gera reuniões comerciais recorrentes para produtos de ticket mais alto.",
      },
      {
        title: "Links rastreáveis (UTM) por perfil",
        impact:
          "Mede com clareza se o tráfego orgânico de Reels, TikTok ou YouTube está convertendo.",
      },
    ],
    technicalHighlights: [
      {
        title: "Construtor de links rastreáveis (UTM)",
        description:
          "Crie links rastreáveis em 1 clique no painel e acompanhe métricas de cliques e origem.",
      },
      {
        title: "Domínio próprio para autoridade",
        description:
          "Use bio.seudominio.com.br no plano Studio e mantenha consistência em todos os anúncios.",
      },
      {
        title: "Exportação de métricas em CSV",
        description:
          "Cruze dados de cliques com planilhas de lançamento e relatórios de tráfego.",
      },
    ],
    faqs: [
      {
        q: "Funciona com Hotmart, Kiwify, Eduzz e Greenn?",
        a: "Sim. Você pode conectar links de páginas de vendas, checkouts e áreas de membros de qualquer plataforma.",
      },
      {
        q: "Consigo trocar a oferta da bio rapidamente durante um lançamento?",
        a: "Sim. Você pode alterar título, ordem, destaque e URL em segundos e a página revalida instantaneamente.",
      },
      {
        q: "Posso ter uma página para mim e outra para o meu projeto/produto?",
        a: "Sim. O plano Studio inclui até 3 páginas publicadas na mesma assinatura.",
      },
    ],
    relatedSlugs: ["criadores-de-conteudo", "agencias-e-freelancers", "academias-e-personal"],
    recommendedComparisons: ["linkmural-vs-beacons", "linkmural-vs-linktree"],
  },
  {
    slug: "musicos-e-artistas",
    name: "Músicos e Artistas",
    vertical: "criadores-b2b",
    verticalLabel: VERTICAL_LABELS["criadores-b2b"],
    metaTitle: "Link na bio para Músicos e Artistas — Spotify, clipes e agenda de shows",
    metaDescription:
      "Crie o link na bio da sua banda ou carreira solo: Spotify, Apple Music, clipe do YouTube embutido, agenda de shows e contato para contratação.",
    h1: "Link na bio para Músicos e Artistas — leve ouvintes direto para o play",
    subtitle:
      "Centralize seu lançamento no Spotify e Apple Music, clipe oficial no YouTube, agenda de shows e WhatsApp de contratação em uma página visual.",
    aeoQuestion: "O que colocar no link na bio de um músico ou banda?",
    aeoAnswer:
      "O link na bio de um músico ou banda deve destacar o lançamento mais recente (Spotify, Apple Music e Deezer), exibir o clipe oficial do YouTube, listar a agenda de próximos shows com link para ingressos e manter um botão claro de contato/WhatsApp para contratantes e imprensa.",
    preview: {
      handle: "banda-horizonte",
      displayName: "Banda Horizonte",
      tagline: "Novo single 'Madrugada' já disponível",
      city: "Turnê Brasil",
      links: [
        {
          title: "Ouça 'Madrugada' no Spotify",
          subtitle: "Novo single + playlist oficial",
          size: "full",
          accent: true,
        },
        {
          title: "Apple Music & Deezer",
          subtitle: "Todas as plataformas",
          size: "half",
        },
        {
          title: "Ingressos e Shows",
          subtitle: "Datas da turnê",
          size: "half",
        },
        {
          title: "Shows e Contratação",
          subtitle: "Falar com a produção no WhatsApp",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Lançamento no Spotify, Apple Music e Deezer",
        impact:
          "Reduz cliques até o streaming e aumenta saves e reproduções na semana de estreia.",
      },
      {
        title: "Clipe oficial do YouTube embutido",
        impact:
          "Permite que fãs e contratantes assistam ao trabalho direto na sua página.",
      },
      {
        title: "Agenda de shows e ingressos",
        impact:
          "Centraliza links do Sympla, Eventim ou casas de show em um único lugar.",
      },
      {
        title: "Contato para contratação e press kit",
        impact:
          "Facilita o fechamento de datas por produtores, bares, casamentos e festivais.",
      },
    ],
    technicalHighlights: [
      {
        title: "Ícones oficiais das plataformas musicais",
        description:
          "Logos oficiais de Spotify, YouTube, Apple Music, Instagram e TikTok já prontos no painel.",
      },
      {
        title: "Capa personalizada com a arte do single",
        description:
          "Adapte cores e capa a cada lançamento para criar um mini-site do álbum em minutos.",
      },
      {
        title: "QR Code para palcos e telões",
        description:
          "Projete o QR Code nos shows para o público seguir suas plataformas na hora.",
      },
    ],
    faqs: [
      {
        q: "Consigo embutir meu clipe do YouTube direto na página?",
        a: "Sim. No plano Studio o vídeo do YouTube aparece em player 16:9 dentro do seu Bento Grid.",
      },
      {
        q: "Serve também para DJs e músicos de eventos/casamentos?",
        a: "Sim. Você pode colocar sets, vídeos de apresentações, depoimentos e botão direto para orçamento no WhatsApp.",
      },
      {
        q: "Posso usar gratuitamente?",
        a: "Sim. O plano Grátis já permite publicar até 5 links com capa, logo e cores da sua identidade.",
      },
    ],
    relatedSlugs: ["criadores-de-conteudo", "infoprodutores", "agencias-e-freelancers"],
    recommendedComparisons: ["linkmural-vs-bento", "linkmural-vs-linktree"],
  },
  {
    slug: "agencias-e-freelancers",
    name: "Agências e Freelancers",
    vertical: "criadores-b2b",
    verticalLabel: VERTICAL_LABELS["criadores-b2b"],
    metaTitle: "Link na bio para Agências e Freelancers — portfólio, cases e call",
    metaDescription:
      "Crie uma página em Bento Grid para agências, estúdios e freelancers: portfólio, cases de clientes, agendamento de call (Calendly) e domínio próprio.",
    h1: "Link na bio para Agências e Freelancers — converta visitantes em reuniões",
    subtitle:
      "Apresente cases, serviços com escopo, agendamento de call no Calendly, WhatsApp comercial e domínio próprio em um Bento Grid limpo.",
    aeoQuestion: "O que colocar no link na bio de uma agência ou freelancer?",
    aeoAnswer:
      "O link na bio de uma agência ou freelancer deve priorizar o agendamento de reunião diagnóstica (Calendly ou WhatsApp comercial), apresentar portfólio e cases de resultado, listar os serviços principais com clareza e incluir links para LinkedIn, Behance/GitHub e site institucional em domínio próprio.",
    preview: {
      handle: "norte-digital-studio",
      displayName: "Norte Digital Studio",
      tagline: "Design, Sites e Tráfego Pago para B2B",
      city: "Atendimento Brasil e Remoto",
      links: [
        {
          title: "Agendar reunião diagnóstica",
          subtitle: "30 min gratuitos via Google Meet",
          size: "full",
          accent: true,
        },
        {
          title: "Portfólio e Cases",
          subtitle: "Projetos recentes",
          size: "half",
        },
        {
          title: "WhatsApp Comercial",
          subtitle: "Orçamentos rápidos",
          size: "half",
        },
        {
          title: "Serviços e Pacotes",
          subtitle: "Branding, Web e Performance",
          size: "full",
        },
      ],
    },
    essentialLinks: [
      {
        title: "Agendamento de call (Calendly / Cal.com)",
        impact:
          "Elimina trocas intermináveis de mensagens para marcar uma reunião comercial.",
      },
      {
        title: "Portfólio e cases de sucesso",
        impact:
          "Demonstra capacidade técnica e retorno gerado para outros clientes.",
      },
      {
        title: "Cards de Serviços e escopo",
        impact:
          "Ajuda leads a entenderem como contratar (projeto fechado, retainer ou consultoria).",
      },
      {
        title: "LinkedIn, Behance ou GitHub",
        impact:
          "Conecta sua presença social à prova técnica profissional.",
      },
    ],
    technicalHighlights: [
      {
        title: "Domínio próprio e marca limpa",
        description:
          "Remova a marca do rodapé no Pro e publique no seu próprio domínio no Studio.",
      },
      {
        title: "Até 3 páginas na mesma conta",
        description:
          "Gerencie a página da agência e páginas individuais ou de projetos clientes no plano Studio.",
      },
      {
        title: "Exportação CSV e links UTM",
        description:
          "Acompanhe o desempenho de campanhas de prospecção e conteúdo no LinkedIn e Instagram.",
      },
    ],
    faqs: [
      {
        q: "Posso usar o linkmural para criar páginas para clientes da minha agência?",
        a: "Sim. O plano Studio permite até 3 páginas por conta, e cada cliente também pode manter sua própria conta com domínio customizado.",
      },
      {
        q: "O linkmural substitui um site institucional completo?",
        a: "Para freelancers e estúdios enxutos, funciona muito bem como cartão digital completo e página de conversão rápida; para agências maiores, complementa o site na bio e em assinaturas de e-mail.",
      },
      {
        q: "Posso integrar com Calendly, Notion e Typeform?",
        a: "Sim. Todos podem ser vinculados diretamente nos cards do Bento Grid.",
      },
    ],
    relatedSlugs: ["arquitetos", "infoprodutores", "criadores-de-conteudo"],
    recommendedComparisons: ["linkmural-vs-bento", "linkmural-vs-biosite"],
  },
];

export const NICHE_SLUGS = NICHES.map((n) => n.slug);

export function getNicheBySlug(slug: string): NicheItem | undefined {
  return NICHES.find((n) => n.slug === slug);
}

export function getNichesByVertical(vertical: NicheVertical): NicheItem[] {
  return NICHES.filter((n) => n.vertical === vertical);
}
