import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SlugClaimForm } from "@/components/landing/SlugClaimForm";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { siteUrl } from "@/lib/redirect";
import { finalizeSlug } from "@/lib/slug";

export const metadata: Metadata = {
  // absolute: the root layout template would append " · linkmural" again
  title: {
    absolute:
      "linkmural — A página de links do seu negócio, pronta em 3 minutos",
  },
  description:
    "Reúna WhatsApp, agenda, cardápio, redes e contato num só link bonito. Comece grátis pelo celular, sem cartão.",
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: "linkmural — A página de links do seu negócio",
    description:
      "WhatsApp, Salvar contato, QR code e 3 modelos prontos em menos de 3 minutos. Comece grátis.",
    url: siteUrl(),
    siteName: "linkmural",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "linkmural — A página de links do seu negócio",
    description:
      "WhatsApp, Salvar contato, QR code e 3 modelos prontos em menos de 3 minutos.",
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

const MODELS = [
  {
    name: "Balcão",
    desc: "Lista direta com botão principal em destaque, atalhos rápidos e horários.",
    tag: "Ideal para serviços e lojas locais",
  },
  {
    name: "Mosaico",
    desc: "Grade visual em blocos estilo bento para dar presença a cada canal.",
    tag: "Ideal para marcas, cardápios e portfólios",
  },
  {
    name: "Cartão",
    desc: "Cartão de visita digital com telefone, endereço, e-mail e salvar contato.",
    tag: "Ideal para profissionais e consultórios",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Escolha seu endereço",
    desc: "Digite linkmural.com/seunegocio e garanta seu link na hora.",
  },
  {
    num: "2",
    title: "Coloque seus dados e links",
    desc: "Escolha um dos 8 estilos, adicione WhatsApp, Instagram, site ou Pix.",
  },
  {
    num: "3",
    title: "Publique e compartilhe",
    desc: "Coloque na bio do Instagram e baixe o QR code pronto para o balcão.",
  },
];

const FAQS = [
  {
    q: "Precisa de cartão de crédito para começar?",
    a: "Não. O plano Grátis é gratuito de verdade, sem cartão e sem prazo de teste.",
  },
  {
    q: "Consigo montar e editar tudo pelo celular?",
    a: "Sim. Tanto o cadastro quanto o painel de edição foram feitos primeiro para o celular.",
  },
  {
    q: "O que vem incluso no Grátis?",
    a: "1 página publicada, até 5 links, botão de WhatsApp, Salvar contato (.vcf), QR code em PNG e SVG, 3 modelos, 8 estilos e gráfico de cliques.",
  },
  {
    q: "Posso trocar o endereço ou o visual depois?",
    a: "Sim. Você pode alterar estilo, modelo, dados, horários e links a qualquer momento e a mudança vai ao ar na hora.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; slug?: string; ref?: string }>;
}) {
  const params = await searchParams;
  const notice = params.aviso ? NOTICES[params.aviso] : undefined;
  const initialSlug = params.slug ? finalizeSlug(params.slug) : "";
  const referralSlug = params.ref ? finalizeSlug(params.ref) : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="linkmural, página inicial">
          <Image
            src="/brand/linkmural-logo.svg"
            alt="Linkmural"
            width={154}
            height={24}
            priority
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/planos"
            className={buttonClasses({ variant: "ghost", size: "md" })}
          >
            Planos
          </Link>
          <Link
            href="/entrar"
            className={buttonClasses({ variant: "outline", size: "md" })}
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-5 pt-4 pb-20 sm:px-8">
        {/* Hero */}
        <section
          id="criar"
          className="flex flex-col justify-center gap-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Badge
                variant="neutral"
                dot="positive"
                live
                className="self-start"
              >
                Pronta em menos de 3 minutos
              </Badge>
              <h1 className="font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
                A página de links do seu negócio, direto pelo celular.
              </h1>
              <p className="max-w-lg text-body text-ink-muted">
                Reúna WhatsApp, agenda, cardápio, redes e contato num só link
                bonito. Comece grátis, sem cartão.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <SlugClaimForm
                initialSlug={initialSlug}
                referralSlug={referralSlug}
                notice={notice}
              />
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-small text-ink-muted">
              <li className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-positive" />
                WhatsApp em 1 toque
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-positive" />
                QR code pronto para imprimir
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Icon name="check" size={16} className="text-positive" />8
                estilos e 3 modelos
              </li>
            </ul>
          </div>

          <aside
            aria-label="Exemplo de página"
            className="flex flex-col items-center gap-4"
          >
            <div className="w-full max-w-[340px] overflow-hidden rounded-xl border border-line bg-[#0F1012] p-5 text-[#F4F4F5] shadow-md">
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden
                  className="grid size-13 shrink-0 place-items-center rounded-[16px] bg-[#C8F25A] font-display text-title font-bold text-[#0F1012]"
                >
                  SF
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-body font-semibold text-[#F4F4F5]">
                    Studio Força
                  </p>
                  <p className="truncate text-small text-[#A1A1AA]">
                    Academia · Treino funcional
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-[#26272C] px-3 py-1 text-caption font-medium text-[#F4F4F5]">
                  <span className="size-2 rounded-full bg-[#22C55E]" />
                  Aberto agora · até 22h
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                <div className="relative flex items-center justify-between rounded-lg bg-[#C8F25A] px-4 py-3 text-small font-semibold text-[#0F1012]">
                  <span>Agendar aula experimental</span>
                  <Icon name="arrow" size={16} />
                  <span
                    aria-hidden
                    className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 border-[#0F1012] bg-[#CDF54A]"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#2E2F35] bg-[#1B1C20] px-4 py-3 text-small font-medium text-[#F4F4F5]">
                  <span>Chamar no WhatsApp</span>
                  <Icon name="arrow" size={16} className="text-[#A1A1AA]" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#2E2F35] bg-[#1B1C20] px-4 py-3 text-small font-medium text-[#F4F4F5]">
                  <span>Instagram · @studioforca</span>
                  <Icon name="arrow" size={16} className="text-[#A1A1AA]" />
                </div>
              </div>

              <div className="mt-5 border-t border-[#2E2F35] pt-4 text-caption text-[#A1A1AA]">
                <span>linkmural.com/studioforca</span>
              </div>
            </div>
          </aside>
        </section>

        {/* 3 Models */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-display-md tracking-[-0.03em]">
              3 modelos pensados para negócios reais
            </h2>
            <p className="text-body text-ink-muted">
              Combine qualquer modelo com 8 estilos prontos. Troque quando
              quiser sem perder seus links.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {MODELS.map((m) => (
              <div
                key={m.name}
                className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-title">{m.name}</h3>
                  <p className="text-small text-ink-muted">{m.desc}</p>
                </div>
                <span className="text-caption font-medium text-ink">
                  {m.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-6">
          <h2 className="font-display text-display-md tracking-[-0.03em]">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-5"
              >
                <span className="grid size-8 place-items-center rounded-pill bg-lime font-display text-small font-bold text-on-lime">
                  {s.num}
                </span>
                <h3 className="font-display text-body font-semibold">
                  {s.title}
                </h3>
                <p className="text-small text-ink-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-display-md tracking-[-0.03em]">
            Perguntas frequentes
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-5"
              >
                <h3 className="text-body font-semibold text-ink">{f.q}</h3>
                <p className="text-small text-ink-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="flex flex-col items-center gap-4 rounded-xl border border-line bg-ink px-6 py-10 text-center text-paper">
          <h2 className="font-display text-display-md tracking-[-0.03em]">
            Coloque seu negócio no ar hoje
          </h2>
          <p className="max-w-md text-body text-paper/80">
            Leva menos de 3 minutos pelo celular. Grátis, sem cartão.
          </p>
          <a
            href="#criar"
            className={buttonClasses({ variant: "primary", size: "lg" })}
          >
            Criar minha página grátis
          </a>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-6 text-caption text-ink-muted sm:px-8">
        <span>© {new Date().getFullYear()} linkmural</span>
        <div className="flex flex-wrap items-center gap-5">
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
