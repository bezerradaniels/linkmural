import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FeatureBentoAnimations } from "@/components/landing/FeatureBentoAnimations";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { Alert, Badge, buttonClasses, Icon } from "@/components/ui";
import { PLANS, formatBrl, monthlyEquivalent } from "@/lib/plans";
import { siteUrl } from "@/lib/redirect";
import { isBillingEnabled } from "@/lib/stripe";
import { STYLE_KEYS, STYLES } from "@/lib/styles";

export const metadata: Metadata = {
  title: {
    absolute:
      "linkmural — Sua bio transformada em uma vitrine em Bento Grid que converte",
  },
  description:
    "Crie sua página em Bento Grid com logo e capa personalizados, fotos gratuitas do Unsplash, WhatsApp, galeria em carrossel, vídeo do YouTube, cards de serviços e gerador de UTM. Comece grátis.",
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: "linkmural — Sua bio em Bento Grid que converte",
    description:
      "Bento Grid drag-and-drop, Logo & Capa com Unsplash, Galeria, YouTube, Serviços, WhatsApp, Pix e Gerador de UTM em menos de 3 minutos.",
    url: siteUrl(),
    siteName: "linkmural",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "linkmural — Sua bio em Bento Grid que converte",
    description:
      "Bento Grid drag-and-drop, Logo & Capa com Unsplash, Galeria, YouTube, Serviços e Gerador de UTM.",
  },
};

const NOTICES: Record<string, { title: string; message: string }> = {
  reserva_expirada: {
    title: "Sua reserva expirou",
    message:
      "A reserva dura 30 minutos. Crie sua conta grátis abaixo para escolher seu endereço.",
  },
  endereco_ocupado: {
    title: "Esse endereço foi ocupado",
    message:
      "Alguém registrou esse endereço antes de você concluir. Crie sua conta para escolher outro nome.",
  },
  escolha_endereco: {
    title: "Crie sua conta primeiro",
    message:
      "Cadastre-se em 1 toque e escolha o endereço da sua página logo em seguida.",
  },
  conta_excluida: {
    title: "Conta excluída",
    message:
      "Seus dados, página, links e imagens foram removidos permanentemente.",
  },
};

const FAQS = [
  {
    q: "Precisa de cartão de crédito para criar minha página?",
    a: "Não. O Grátis é gratuito para sempre, com fontes, cores, gradientes, Logo & Capa e fotos do Unsplash.",
  },
  {
    q: "Qual a diferença entre Grátis, Pro e Studio?",
    a: "No Grátis os cards são 2×1 (barra). O Pro libera links ilimitados, cards 1×1 e 2×2 no Bento Grid, efeitos Glass e Glossy, Doodles e remove a marca. O Studio adiciona Galeria em carrossel, Vídeo do YouTube, Cards de Serviços, 3 páginas e domínio próprio.",
  },
  {
    q: "Como funcionam o Unsplash e o Gerador de UTM?",
    a: "Você busca fotos profissionais gratuitas do Unsplash direto no painel (Capa, Fundo e Galeria) e gera links com UTM em 1 clique para ver qual rede social (TikTok, Instagram, WhatsApp) traz mais visitas.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, em 1 clique pelo painel, sem multa. Sua página continua no ar.",
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

  const studioYearlyMonthly = monthlyEquivalent(PLANS.business.price.yearly);
  const studioYearlyTotal = formatBrl(PLANS.business.price.yearly);
  const studioMonthly = formatBrl(PLANS.business.price.monthly);

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      {/* ===================================================================== */}
      {/* 1. 100VH FULL-BLEED HERO                                              */}
      {/* ===================================================================== */}
      <section className="relative flex min-h-screen min-h-dvh w-full flex-col justify-between overflow-hidden bg-[#0B0C10] text-white">
        <picture className="pointer-events-none absolute inset-0 size-full select-none">
          <source
            media="(min-width: 1024px)"
            srcSet="/images/hero-influencers-desktop.jpg"
          />
          <img
            src="/images/hero-influencers-mobile.jpg"
            alt="Influenciadores sorrindo enquanto usam o celular"
            fetchPriority="high"
            className="size-full object-cover object-[center_18%] lg:object-[82%_22%]"
          />
        </picture>

        {/* Diagonal & bottom gradients */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,12,16,0.55) 0%, rgba(11,12,16,0.12) 28%, rgba(11,12,16,0.78) 54%, rgba(11,12,16,0.97) 74%, #0B0C10 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(112deg, #0B0C10 0%, rgba(11,12,16,0.95) 34%, rgba(11,12,16,0.72) 52%, rgba(11,12,16,0.22) 74%, rgba(11,12,16,0.08) 100%), linear-gradient(180deg, rgba(11,12,16,0.6) 0%, transparent 22%, transparent 80%, rgba(11,12,16,0.85) 100%)",
          }}
        />

        {/* Top Bar */}
        <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 pt-5 pb-3 sm:gap-4 sm:px-8 sm:pt-7">
          <Link
            href="/"
            aria-label="linkmural, página inicial"
            className="shrink-0"
          >
            <Image
              src="/brand/linkmural-logo-negativo.svg"
              alt="Linkmural"
              width={152}
              height={24}
              className="h-[21px] w-auto sm:h-6"
              priority
            />
          </Link>

          <nav
            aria-label="Seções da página"
            className="hidden items-center gap-7 text-small font-medium text-white/80 md:flex"
          >
            <a
              href="#funcionalidades"
              className="transition-colors hover:text-white"
            >
              Funcionalidades
            </a>
            <a href="#modelos" className="transition-colors hover:text-white">
              Modelos
            </a>
            <a href="#planos" className="transition-colors hover:text-white">
              Planos
            </a>
            <a href="#duvidas" className="transition-colors hover:text-white">
              Dúvidas
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <Link
              href="/entrar"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-pill px-2.5 text-small font-medium whitespace-nowrap text-white/85 no-underline transition-colors hover:bg-white/10 hover:text-white sm:h-10 sm:px-3.5"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-pill border border-white/30 bg-white/10 px-3.5 text-small font-semibold whitespace-nowrap text-white no-underline backdrop-blur-md transition-colors hover:border-lime hover:bg-lime hover:text-on-lime sm:h-10 sm:px-4"
            >
              Cadastre-se
            </Link>
          </div>
        </header>

        {/* Hero Copy */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pt-36 pb-[max(2.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-56 sm:pb-16 lg:justify-center lg:py-16">
          <div className="flex max-w-xl flex-col gap-3.5 sm:gap-4">
            <span className="inline-flex items-center gap-2 self-start rounded-pill border border-white/20 bg-white/10 px-3.5 py-1.5 text-caption font-medium text-white/90 backdrop-blur-md">
              <span className="size-2 rounded-full bg-lime" />
              Para criadores e negócios · Grátis, sem cartão
            </span>

            <h1 className="font-display text-[36px] leading-[1.08] font-bold tracking-[-0.03em] text-white sm:text-[50px] lg:text-[56px]">
              Sua bio transformada em uma vitrine que{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(95deg, #C8F547 0%, #6EE7B7 55%, #FDE047 100%)",
                }}
              >
                converte.
              </span>
            </h1>

            <p className="max-w-lg text-body leading-relaxed text-white/80">
              Bento Grid redimensionável, Logo & Capa com fotos do Unsplash,
              Galeria, YouTube, Serviços e Gerador de UTM — tudo no celular.
            </p>

            {notice && (
              <div className="max-w-md">
                <Alert tone="warning" title={notice.title}>
                  {notice.message}
                </Alert>
              </div>
            )}

            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/cadastro"
                className={buttonClasses({
                  variant: "primary",
                  size: "lg",
                  className:
                    "w-full gap-2 px-7 text-body font-bold shadow-[0_12px_32px_rgba(200,245,71,0.28)] sm:w-auto",
                })}
              >
                <span>Cadastre-se grátis</span>
                <Icon name="arrow" size={18} />
              </Link>
              <a
                href="#funcionalidades"
                className="inline-flex h-12 items-center justify-center rounded-pill border border-white/20 bg-white/5 px-6 text-small font-semibold text-white/90 no-underline backdrop-blur-xs transition-colors hover:border-white/45 hover:bg-white/10"
              >
                Ver na prática
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* COMPACT, VISUAL SECTIONS BELOW HERO                                   */}
      {/* ===================================================================== */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-5 pt-14 pb-16 sm:gap-16 sm:px-8 sm:pt-16">
        {/* 2. INTERACTIVE ANIMATED FEATURE BENTO (4 visual cards + CTA) */}
        <section
          id="funcionalidades"
          className="scroll-mt-16 flex flex-col gap-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-caption font-bold tracking-wider text-ink-muted uppercase">
                Veja cada recurso em ação
              </span>
              <h2 className="mt-1 font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
                Feito para a geração TikTok, Instagram e negócios digitais
              </h2>
            </div>
            <Link
              href="/cadastro"
              className={buttonClasses({
                variant: "primary",
                size: "md",
                className: "gap-1.5 font-bold",
              })}
            >
              <span>Criar minha página grátis</span>
              <Icon name="arrow" size={16} />
            </Link>
          </div>

          <FeatureBentoAnimations />
        </section>

        {/* 3. INTERACTIVE TEMPLATES & 8 STYLES (Compact + Creator Photos + CTA) */}
        <section
          id="modelos"
          className="scroll-mt-16 grid grid-cols-1 items-center gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr]"
        >
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-caption font-bold tracking-wider text-ink-muted uppercase">
                3 Modelos × 8 Estilos
              </span>
              <h2 className="mt-1 font-display text-display-md tracking-[-0.03em]">
                Edite Logo & Capa separado dos Cards — tudo guiado pelo modelo
              </h2>
              <p className="mt-1.5 text-small text-ink-muted">
                Alterne entre <strong>Mosaico</strong>, <strong>Balcão</strong>{" "}
                e <strong>Cartão</strong> ao lado. Cada modelo adapta o
                cabeçalho e o Bento Grid automaticamente.
              </p>
            </div>

            {/* 8 styles compact pills */}
            <div className="grid grid-cols-4 gap-2">
              {STYLE_KEYS.map((key) => {
                const st = STYLES[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5"
                  >
                    <span
                      aria-hidden
                      className="size-3.5 shrink-0 rounded-full border"
                      style={{
                        backgroundColor: st.palette.accent,
                        borderColor: st.palette.line,
                      }}
                    />
                    <span className="truncate text-[11px] font-semibold text-ink">
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cadastro"
                className={buttonClasses({
                  variant: "primary",
                  size: "lg",
                  className: "gap-2 font-bold",
                })}
              >
                <span>Testar nos meus links grátis</span>
                <Icon name="arrow" size={16} />
              </Link>
              <Link
                href="/entrar"
                className={buttonClasses({ variant: "ghost", size: "md" })}
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroShowcase />
          </div>
        </section>

        {/* 4. COMPACT 3-PLAN GRID (Grátis, Pro, Studio — all with direct CTAs) */}
        <section id="planos" className="scroll-mt-16 flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Badge variant="neutral" dot="positive">
                50% off de lançamento no Pro e Studio
              </Badge>
              <h2 className="mt-1.5 font-display text-display-md tracking-[-0.03em]">
                Comece grátis. Evolua quando quiser.
              </h2>
            </div>
            <Link
              href="/planos"
              className="text-small font-semibold text-ink underline underline-offset-4"
            >
              Ver comparativo completo →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Grátis */}
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-title">Grátis</h3>
                  <Badge variant="neutral" dot="positive">
                    Para sempre
                  </Badge>
                </div>
                <p className="font-display text-display-md">R$ 0</p>
                <ul className="flex flex-col gap-1.5 text-small text-ink-muted">
                  {[
                    "Até 5 links (barra 2×1)",
                    "Fontes, cores e fundo gradiente",
                    "Logo & Capa + fotos do Unsplash",
                    "WhatsApp, Pix, QR Code e UTM",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Icon
                        name="check"
                        size={15}
                        className="shrink-0 text-positive"
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
                  size: "md",
                  className: "w-full font-bold",
                })}
              >
                Cadastre-se grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col justify-between gap-5 rounded-2xl border-2 border-ink bg-surface p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-title">Pro</h3>
                  <Badge variant="pro">Popular · 50% off</Badge>
                </div>
                <div>
                  <p className="font-display text-display-md">
                    {formatBrl(proYearlyMonthly)}
                    <span className="font-sans text-caption font-normal text-ink-muted">
                      /mês no anual
                    </span>
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {proYearlyTotal}/ano ou {proMonthly}/mês
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5 text-small text-ink-muted">
                  {[
                    "Links ilimitados + Bento 1×1 e 2×2",
                    "Efeitos Glass (Transparência) e Glossy",
                    "Fundos com Doodles e Fotos",
                    "Sem marca no rodapé + cliques por link",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Icon
                        name="check"
                        size={15}
                        className="shrink-0 text-positive"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/cadastro"
                className={buttonClasses({
                  variant: "secondary",
                  size: "md",
                  className: "w-full font-bold",
                })}
              >
                {billingEnabled ? "Começar no Pro" : "Criar conta grátis"}
              </Link>
            </div>

            {/* Studio */}
            <div className="flex flex-col justify-between gap-5 rounded-2xl border border-ink bg-[#0E1015] p-5 text-white">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-title text-white">Studio</h3>
                  <span className="rounded-pill bg-lime px-2.5 py-0.5 text-[11px] font-bold text-on-lime">
                    Criadores & Marcas
                  </span>
                </div>
                <div>
                  <p className="font-display text-display-md text-white">
                    {formatBrl(studioYearlyMonthly)}
                    <span className="font-sans text-caption font-normal text-white/70">
                      /mês no anual
                    </span>
                  </p>
                  <p className="text-[11px] text-white/65">
                    {studioYearlyTotal}/ano ou {studioMonthly}/mês
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5 text-small text-white/80">
                  {[
                    "Tudo do Pro + até 3 páginas",
                    "Galeria de fotos em carrossel",
                    "Vídeo do YouTube 16:9 no grid",
                    "Cards de Serviços + Domínio próprio",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Icon
                        name="check"
                        size={15}
                        className="shrink-0 text-lime"
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
                  size: "md",
                  className: "w-full font-bold",
                })}
              >
                {billingEnabled ? "Começar no Studio" : "Criar conta grátis"}
              </Link>
            </div>
          </div>
        </section>

        {/* 5. COMPACT FAQ + INTEGRATED CTA BANNER */}
        <section
          id="duvidas"
          className="scroll-mt-16 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="flex flex-col gap-2.5">
            <h2 className="mb-1 font-display text-title tracking-[-0.02em]">
              Dúvidas rápidas
            </h2>
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-line bg-surface px-4 py-3.5 open:border-ink/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-small font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span>{f.q}</span>
                  <Icon
                    name="plus"
                    size={16}
                    className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                  />
                </summary>
                <p className="mt-2 text-caption leading-relaxed text-ink-muted">
                  {f.a}
                </p>
              </details>
            ))}
          </div>

          <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-ink bg-[#0E1015] p-6 text-white sm:p-7">
            <div className="flex items-center gap-3">
              <img
                src="/images/creator-bento.jpg"
                alt="Criadora"
                className="size-12 rounded-full border-2 border-lime object-cover"
              />
              <img
                src="/images/creator-studio.jpg"
                alt="Criador"
                className="-ml-5 size-12 rounded-full border-2 border-[#0E1015] object-cover"
              />
              <span className="text-caption font-semibold text-white/85">
                Pronta em menos de 3 minutos
              </span>
            </div>
            <div>
              <h3 className="font-display text-display-md leading-tight tracking-[-0.03em]">
                Coloque sua vitrine no ar agora.
              </h3>
              <p className="mt-1.5 text-small text-white/75">
                Garanta seu endereço antes que alguém pegue. Grátis e sem
                cartão.
              </p>
            </div>
            <Link
              href="/cadastro"
              className={buttonClasses({
                variant: "primary",
                size: "lg",
                className: "w-full gap-2 font-bold",
              })}
            >
              <span>Cadastre-se grátis</span>
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-5 text-caption text-ink-muted sm:px-8">
        <span>© {new Date().getFullYear()} linkmural</span>
        <div className="flex flex-wrap items-center gap-5">
          <a href="#funcionalidades" className="hover:text-ink">
            Funcionalidades
          </a>
          <a href="#modelos" className="hover:text-ink">
            Modelos
          </a>
          <Link href="/planos" className="hover:text-ink">
            Planos
          </Link>
          <Link href="/termos" className="hover:text-ink">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-ink">
            Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
