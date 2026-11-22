import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { Alert, Badge, buttonClasses, Icon } from "@/components/ui";
import type { IconName } from "@/components/ui/icons";
import { PLANS, formatBrl, monthlyEquivalent } from "@/lib/plans";
import { siteUrl } from "@/lib/redirect";
import { isBillingEnabled } from "@/lib/stripe";
import { STYLE_KEYS, STYLES } from "@/lib/styles";

export const metadata: Metadata = {
  // absolute: the root layout template would append " · linkmural" again
  title: {
    absolute:
      "linkmural — A página de links do seu negócio, pronta em 3 minutos",
  },
  description:
    "Transforme sua bio em uma vitrine que gera contatos no WhatsApp. Reúna agenda, cardápio, Pix, redes, Salvar contato e QR code num só link. Comece grátis pelo celular.",
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: "linkmural — A página de links do seu negócio",
    description:
      "WhatsApp, Salvar contato, Pix, QR code e 3 modelos prontos em menos de 3 minutos. Comece grátis, sem cartão.",
    url: siteUrl(),
    siteName: "linkmural",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "linkmural — A página de links do seu negócio",
    description:
      "WhatsApp, Salvar contato, Pix, QR code e 3 modelos prontos em menos de 3 minutos.",
  },
};

const NOTICES: Record<string, { title: string; message: string }> = {
  reserva_expirada: {
    title: "Sua reserva expirou",
    message:
      "A reserva dura 30 minutos. Confira se o endereço ainda está livre ou escolha uma sugestão abaixo.",
  },
  endereco_ocupado: {
    title: "Esse endereço foi ocupado",
    message:
      "Alguém registrou esse endereço antes de você concluir. Escolha outro ou use uma sugestão abaixo.",
  },
  escolha_endereco: {
    title: "Escolha seu endereço primeiro",
    message:
      "Digite como você quer que fique o link da sua página para começar.",
  },
  conta_excluida: {
    title: "Conta excluída",
    message:
      "Seus dados, página, links e imagens foram removidos permanentemente.",
  },
};

const NICHES = [
  {
    title: "Academias e estúdios",
    desc: "Aula experimental em destaque, horários de funcionamento e WhatsApp em 1 toque.",
  },
  {
    title: "Restaurantes e cafés",
    desc: "Cardápio digital, iFood, encomendas no WhatsApp e QR code pronto para as mesas.",
  },
  {
    title: "Clínicas e consultórios",
    desc: "Agendamento de consultas, localização no mapa e cartão de contato (.vcf) para o paciente salvar.",
  },
  {
    title: "Salões e barbearias",
    desc: "Link de agenda, tabela de serviços, Instagram e chave Pix para pagamento rápido.",
  },
  {
    title: "Lojas e e-commerce",
    desc: "Catálogo, lançamentos, trocas pelo WhatsApp e QR code para colar nas embalagens.",
  },
  {
    title: "Profissionais autônomos",
    desc: "Cartão de visita digital profissional para mandar no WhatsApp depois de cada reunião.",
  },
];

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: "phone",
    title: "WhatsApp e Salvar contato em 1 toque",
    desc: "Seu cliente abre conversa direto no WhatsApp ou salva seu telefone, e-mail e endereço na agenda (.vcf) sem digitar nada.",
  },
  {
    icon: "calendar",
    title: "Status de funcionamento automático",
    desc: "Mostra “Aberto agora · até 22h” ou o próximo horário de abertura calculado automaticamente no horário de Brasília.",
  },
  {
    icon: "payment",
    title: "Chave Pix pronta para copiar",
    desc: "Cole sua chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória) e ela vira um botão com cópia instantânea na página.",
  },
  {
    icon: "qr",
    title: "QR code em PNG e SVG incluso",
    desc: "Baixe o QR code da sua página em alta qualidade para imprimir no balcão, vitrine, cardápio ou cartão de visita.",
  },
  {
    icon: "link",
    title: "Ícones reconhecidos automaticamente",
    desc: "Colou um link do Instagram, iFood, Google Maps, Agenda ou YouTube? O Linkmural já preenche o ícone e o título na hora.",
  },
  {
    icon: "chart",
    title: "Métricas reais de visitas e cliques",
    desc: "Acompanhe quantas pessoas visitam sua página e clicam em cada canal, sem banners chatos nem configuração técnica.",
  },
];

const MODELS = [
  {
    name: "Balcão",
    desc: "Lista direta com o link mais importante preso no topo pelo alfinete, atalhos rápidos e horário de funcionamento.",
    tag: "Ideal para academias, lojas e serviços",
    layout: "list" as const,
  },
  {
    name: "Mosaico",
    desc: "Grade visual em blocos estilo bento que destaca o canal principal e organiza o restante em cards compactos.",
    tag: "Ideal para restaurantes, marcas e portfólios",
    layout: "grid" as const,
  },
  {
    name: "Cartão",
    desc: "Visual de cartão de visita digital com ações grandes de contato e links organizados logo abaixo.",
    tag: "Ideal para clínicas, consultórios e autônomos",
    layout: "card" as const,
  },
];

const STEPS = [
  {
    num: "1",
    time: "30 segundos",
    title: "Crie sua conta grátis",
    desc: "Entre com Google ou e-mail em 1 toque — sem senha e sem cartão de crédito.",
  },
  {
    num: "2",
    time: "2 minutos",
    title: "Escolha seu endereço e visual",
    desc: "Defina linkmural.com/seunegocio, escolha entre 3 modelos e 8 estilos e adicione seus links.",
  },
  {
    num: "3",
    time: "Na hora",
    title: "Publique na bio e imprima o QR",
    desc: "Sua página já vai ao ar. Copie o link para o Instagram e WhatsApp Business e baixe o QR code.",
  },
];

const FAQS = [
  {
    q: "Precisa de cartão de crédito para começar?",
    a: "Não. O plano Grátis é gratuito de verdade, sem cartão e sem prazo de teste. Você cria, publica e usa pelo tempo que quiser.",
  },
  {
    q: "Consigo montar e editar tudo só pelo celular?",
    a: "Sim. Tanto o cadastro em passos curtos quanto o painel de edição foram desenhados primeiro para o celular. Você atualiza links, horários e fotos em segundos.",
  },
  {
    q: "O que vem incluso no plano Grátis?",
    a: "1 página publicada, até 5 links, botão de WhatsApp, Salvar contato (.vcf), chave Pix, QR code em PNG e SVG, todos os 3 modelos, os 8 estilos e gráfico de visitas e cliques.",
  },
  {
    q: "Funciona na bio do Instagram e no WhatsApp Business?",
    a: "Sim. Assim que você publica, o Linkmural entrega seu link pronto para colar na bio do Instagram, no perfil do WhatsApp Business, no TikTok e no Google Meu Negócio.",
  },
  {
    q: "Qual a diferença do plano Pro e posso cancelar quando quiser?",
    a: "O Pro libera links ilimitados, personalização completa de fonte, cores e formato dos cards, métricas detalhadas por link (7, 30 e 90 dias) e remove o selo do rodapé. Você pode cancelar quando quiser em poucos cliques, sem multa.",
  },
  {
    q: "Se eu cancelar o Pro, perco meus links ou minha página?",
    a: "Nunca. Sua página continua no ar normalmente. Se você tiver mais de 5 links, os extras ficam apenas pausados (nunca apagados) até você escolher quais manter ativos.",
  },
  {
    q: "Posso trocar o endereço ou o visual depois de publicar?",
    a: "Sim. Você altera modelo, estilo, dados, horários, fotos e links quando quiser e a página pública atualiza na hora.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const params = await searchParams;
  const notice = params.aviso ? NOTICES[params.aviso] : undefined;
  const billingEnabled = isBillingEnabled();

  const proYearlyMonthly = monthlyEquivalent(PLANS.pro.price.yearly);
  const proYearlyTotal = formatBrl(PLANS.pro.price.yearly);
  const proMonthly = formatBrl(PLANS.pro.price.monthly);
  const proRegularYearly = formatBrl(
    PLANS.pro.listPrice?.yearly ?? PLANS.pro.price.yearly,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/" aria-label="linkmural, página inicial">
            <Image
              src="/brand/linkmural-logo.svg"
              alt="Linkmural"
              width={148}
              height={23}
              priority
            />
          </Link>

          <nav
            aria-label="Seções da página"
            className="hidden items-center gap-6 text-small font-medium text-ink-muted md:flex"
          >
            <a href="#recursos" className="hover:text-ink">
              Recursos
            </a>
            <a href="#modelos" className="hover:text-ink">
              Modelos
            </a>
            <a href="#planos" className="hover:text-ink">
              Planos
            </a>
            <a href="#duvidas" className="hover:text-ink">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/entrar"
              className={buttonClasses({ variant: "ghost", size: "md" })}
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className={buttonClasses({ variant: "primary", size: "md" })}
            >
              Criar grátis
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-5 pt-8 pb-20 sm:gap-24 sm:px-8 sm:pt-12">
        {/* 1. HERO (Above the fold CRO) */}
        <section
          id="criar"
          className="scroll-mt-24 flex flex-col gap-10 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3.5">
              <Badge
                variant="neutral"
                dot="positive"
                live
                className="self-start"
              >
                Pronta em menos de 3 minutos · Grátis, sem cartão
              </Badge>
              <h1 className="font-display text-display-md leading-[1.1] tracking-[-0.03em] sm:text-display-lg">
                Transforme sua bio em uma vitrine que traz clientes no WhatsApp.
              </h1>
              <p className="max-w-xl text-body leading-relaxed text-ink-muted">
                Reúna WhatsApp, agenda, cardápio, Pix, redes sociais e botão de
                salvar contato num só link bonito — feito para negócios locais e
                editável direto pelo celular.
              </p>
            </div>

            {notice && (
              <Alert tone="warning" title={notice.title}>
                {notice.message}
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/cadastro"
                  className={buttonClasses({
                    variant: "primary",
                    size: "lg",
                    className: "w-full sm:w-auto sm:px-7",
                  })}
                >
                  Criar minha página grátis
                </Link>
                <Link
                  href="/planos"
                  className={buttonClasses({
                    variant: "outline",
                    size: "lg",
                    className: "w-full sm:w-auto",
                  })}
                >
                  Ver planos
                </Link>
              </div>
              <p className="text-caption text-ink-muted">
                Leva menos de 3 minutos · Sem cartão de crédito · Edite quando
                quiser
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-small text-ink-muted sm:flex sm:flex-wrap sm:gap-x-6">
              <li className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-positive" />
                WhatsApp em 1 toque
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-positive" />
                Pix e Salvar contato
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-positive" />
                QR code para imprimir
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-positive" />3
                modelos × 8 estilos
              </li>
            </ul>
          </div>

          <aside
            aria-label="Prévia interativa dos 3 modelos"
            className="flex justify-center lg:justify-end"
          >
            <HeroShowcase />
          </aside>
        </section>

        {/* 2. SEGMENTAÇÃO POR NICHO (Identificação imediata) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-caption font-semibold tracking-wider text-ink-muted uppercase">
              Feito para negócios reais
            </span>
            <h2 className="font-display text-display-md tracking-[-0.03em]">
              Mais do que uma lista de links: um balcão digital para o seu
              cliente agir
            </h2>
            <p className="max-w-2xl text-body text-ink-muted">
              Quem clica no link da sua bio quer resolver rápido: chamar no
              WhatsApp, ver se está aberto, conferir o cardápio ou agendar um
              horário.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {NICHES.map((niche) => (
              <div
                key={niche.title}
                className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-5"
              >
                <h3 className="font-display text-body font-semibold text-ink">
                  {niche.title}
                </h3>
                <p className="text-small text-ink-muted">{niche.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. RECURSOS CONCRETOS (Bento de valor) */}
        <section id="recursos" className="scroll-mt-24 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-caption font-semibold tracking-wider text-ink-muted uppercase">
              Tudo incluso desde o Grátis
            </span>
            <h2 className="font-display text-display-md tracking-[-0.03em]">
              Recursos práticos que transformam visitas em mensagens e vendas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-lime-soft text-ink">
                  <Icon name={feat.icon} size={20} />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-body font-semibold text-ink">
                    {feat.title}
                  </h3>
                  <p className="text-small leading-relaxed text-ink-muted">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. MODELOS + 8 ESTILOS (Prova visual) */}
        <section id="modelos" className="scroll-mt-24 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-caption font-semibold tracking-wider text-ink-muted uppercase">
              Visual profissional sem designer
            </span>
            <h2 className="font-display text-display-md tracking-[-0.03em]">
              3 modelos e 8 estilos prontos — troque quando quiser
            </h2>
            <p className="max-w-2xl text-body text-ink-muted">
              Seu conteúdo fica salvo. Você muda o modelo ou o estilo em um
              toque e vê a prévia ao vivo antes de publicar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {MODELS.map((m) => (
              <div
                key={m.name}
                className="flex flex-col justify-between gap-5 rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex flex-col gap-4">
                  {/* Mini layout preview */}
                  <div
                    aria-hidden
                    className="flex h-28 flex-col justify-center gap-1.5 rounded-lg border border-line bg-paper p-3"
                  >
                    {m.layout === "list" && (
                      <>
                        <div className="h-5 w-full rounded-md bg-lime" />
                        <div className="h-4 w-full rounded-md bg-surface ring-1 ring-line" />
                        <div className="h-4 w-full rounded-md bg-surface ring-1 ring-line" />
                      </>
                    )}
                    {m.layout === "grid" && (
                      <>
                        <div className="h-6 w-full rounded-md bg-lime" />
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="h-9 rounded-md bg-surface ring-1 ring-line" />
                          <div className="h-9 rounded-md bg-surface ring-1 ring-line" />
                        </div>
                      </>
                    )}
                    {m.layout === "card" && (
                      <>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="h-8 rounded-md bg-lime" />
                          <div className="h-8 rounded-md bg-ink/90" />
                        </div>
                        <div className="h-3.5 w-full rounded-md bg-surface ring-1 ring-line" />
                        <div className="h-3.5 w-3/4 rounded-md bg-surface ring-1 ring-line" />
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-title">{m.name}</h3>
                    <p className="text-small text-ink-muted">{m.desc}</p>
                  </div>
                </div>
                <span className="text-caption font-semibold text-ink">
                  {m.tag}
                </span>
              </div>
            ))}
          </div>

          {/* 8 styles swatch bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-small font-semibold text-ink">
                8 estilos com fonte e contraste calibrados
              </p>
              <span className="text-caption text-ink-muted">
                No Pro, você também personaliza cores, fonte e cantos
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
              {STYLE_KEYS.map((key) => {
                const st = STYLES[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2"
                  >
                    <span
                      aria-hidden
                      className="flex size-6 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        backgroundColor: st.palette.bg,
                        borderColor: st.palette.line,
                      }}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: st.palette.accent }}
                      />
                    </span>
                    <span className="truncate text-caption font-semibold text-ink">
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. COMO FUNCIONA EM 3 PASSOS */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-caption font-semibold tracking-wider text-ink-muted uppercase">
                Simples de verdade
              </span>
              <h2 className="font-display text-display-md tracking-[-0.03em]">
                No ar em 3 passos rápidos
              </h2>
            </div>
            <Link
              href="/cadastro"
              className="text-small font-semibold text-ink underline underline-offset-4 hover:opacity-80"
            >
              Criar minha conta grátis →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-8 place-items-center rounded-pill bg-lime font-display text-small font-bold text-on-lime">
                    {s.num}
                  </span>
                  <span className="text-caption font-medium text-ink-muted">
                    {s.time}
                  </span>
                </div>
                <h3 className="font-display text-body font-semibold">
                  {s.title}
                </h3>
                <p className="text-small text-ink-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. PLANOS TRANSPARENTES (Remove objeção de preço) */}
        <section id="planos" className="scroll-mt-24 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Badge variant="neutral" dot="positive">
              Comece grátis, sem surpresas
            </Badge>
            <h2 className="font-display text-display-md tracking-[-0.03em]">
              Preço transparente para caber em qualquer negócio
            </h2>
            <p className="max-w-xl text-body text-ink-muted">
              O Grátis resolve hoje. Se quiser links ilimitados, visual 100% com
              a cara da sua marca e métricas por link, o Pro está com 50% off de
              lançamento.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
            {/* Free card */}
            <div className="flex flex-col justify-between gap-6 rounded-xl border border-line bg-surface p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-title">Grátis</h3>
                  <Badge variant="neutral" dot="positive">
                    Para sempre
                  </Badge>
                </div>
                <div>
                  <p className="font-display text-display-md">R$ 0</p>
                  <p className="text-caption text-ink-muted">
                    Sem cartão de crédito e sem prazo de teste.
                  </p>
                </div>
                <ul className="flex flex-col gap-2 text-small text-ink-muted">
                  {[
                    "1 página publicada no ar",
                    "Até 5 links com reconhecimento de ícones",
                    "WhatsApp, Salvar contato (.vcf), Pix e QR code",
                    "Todos os 3 modelos e 8 estilos prontos",
                    "Visitas e cliques com gráfico de 7 ou 30 dias",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Icon
                        name="check"
                        size={16}
                        className="mt-0.5 shrink-0 text-positive"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/cadastro"
                className={buttonClasses({
                  variant: "primary",
                  size: "lg",
                  className: "w-full",
                })}
              >
                Criar minha página grátis
              </Link>
            </div>

            {/* Pro card */}
            <div className="relative flex flex-col justify-between gap-6 rounded-xl border border-ink bg-surface p-6 shadow-sm">
              <span
                aria-hidden
                className="absolute -top-2 -right-2 size-5 rounded-full border-[3px] border-paper bg-lime"
              />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-title">Pro</h3>
                  <Badge variant="pro">50% off lançamento</Badge>
                </div>
                <div>
                  <p className="font-display text-display-md">
                    {formatBrl(proYearlyMonthly)}
                    <span className="font-sans text-small font-normal text-ink-muted">
                      /mês no anual
                    </span>
                  </p>
                  <p className="text-caption text-ink-muted">
                    {proYearlyTotal}/ano no 1º ano (ou {proMonthly}/mês). Depois
                    de 12 meses, valor regular de {proRegularYearly}/ano.
                  </p>
                </div>
                <ul className="flex flex-col gap-2 text-small text-ink-muted">
                  {[
                    "Tudo do plano Grátis + links ilimitados",
                    "Paleta personalizada, fonte, tamanho e cantos",
                    "Remover o selo “Feito com linkmural” do rodapé",
                    "Ranking de cliques por link e períodos de 7, 30 e 90 dias",
                    "Cancele quando quiser em poucos cliques",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Icon
                        name="check"
                        size={16}
                        className="mt-0.5 shrink-0 text-positive"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/planos"
                className={buttonClasses({
                  variant: "secondary",
                  size: "lg",
                  className: "w-full",
                })}
              >
                {billingEnabled
                  ? "Ver detalhes e assinar o Pro"
                  : "Ver detalhes do Pro"}
              </Link>
            </div>
          </div>
        </section>

        {/* 7. FAQ (Acordeão acessível, 0 JS) */}
        <section id="duvidas" className="scroll-mt-24 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-caption font-semibold tracking-wider text-ink-muted uppercase">
              Tire suas dúvidas
            </span>
            <h2 className="font-display text-display-md tracking-[-0.03em]">
              Perguntas frequentes
            </h2>
          </div>

          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-line bg-surface p-5 open:border-ink/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-body font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span>{f.q}</span>
                  <Icon
                    name="plus"
                    size={18}
                    className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                  />
                </summary>
                <p className="mt-3 text-small leading-relaxed text-ink-muted">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* 8. CTA FINAL DE ALTO CONTRASTE */}
        <section className="relative overflow-hidden rounded-[28px] border border-line bg-ink px-6 py-12 text-center text-paper sm:px-12 sm:py-14">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-pill bg-paper/10 px-3.5 py-1 text-caption font-semibold text-paper">
              <span className="size-2 rounded-full bg-lime" />
              Seu endereço com o nome do seu negócio
            </span>
            <h2 className="font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
              Coloque sua vitrine no ar nos próximos 3 minutos.
            </h2>
            <p className="max-w-md text-body text-paper/80">
              Garanta o link com o nome do seu negócio antes que alguém pegue.
              Comece grátis direto pelo celular.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/cadastro"
                className={buttonClasses({ variant: "primary", size: "lg" })}
              >
                Criar minha página grátis
              </Link>
              <Link
                href="/planos"
                className="inline-flex min-h-12 items-center justify-center rounded-pill border border-paper/25 px-5 text-small font-semibold text-paper transition-colors hover:border-paper/60"
              >
                Comparar planos
              </Link>
            </div>
            <p className="text-caption text-paper/65">
              Grátis de verdade · Sem cartão de crédito · Suporte em português
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-6 text-caption text-ink-muted sm:px-8">
        <span>© {new Date().getFullYear()} linkmural</span>
        <div className="flex flex-wrap items-center gap-5">
          <a href="#recursos" className="hover:text-ink">
            Recursos
          </a>
          <a href="#modelos" className="hover:text-ink">
            Modelos
          </a>
          <Link href="/planos" className="hover:text-ink">
            Planos
          </Link>
          <a
            href="mailto:oi@linkmural.com?subject=Ajuda%20no%20linkmural"
            className="hover:text-ink"
          >
            Ajuda
          </a>
          <Link href="/termos" className="hover:text-ink">
            Termos de uso
          </Link>
          <Link href="/privacidade" className="hover:text-ink">
            Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
