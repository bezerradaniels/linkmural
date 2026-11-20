import Image from "next/image";
import Link from "next/link";
import { SlugClaimForm } from "@/components/landing/SlugClaimForm";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { finalizeSlug } from "@/lib/slug";

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
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; slug?: string }>;
}) {
  const params = await searchParams;
  const notice = params.aviso ? NOTICES[params.aviso] : undefined;
  const initialSlug = params.slug ? finalizeSlug(params.slug) : "";

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
        <Link
          href="/entrar"
          className={buttonClasses({ variant: "ghost", size: "md" })}
        >
          Entrar
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-5 pt-4 pb-16 sm:px-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="neutral" dot="positive" live className="self-start">
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
            <SlugClaimForm initialSlug={initialSlug} notice={notice} />
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
              <Icon name="check" size={16} className="text-positive" />8 estilos
              e 3 modelos
            </li>
          </ul>
        </section>

        <aside
          aria-label="Exemplo ao vivo"
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

            <div className="mt-5 flex items-center justify-between border-t border-[#2E2F35] pt-4 text-caption text-[#A1A1AA]">
              <span>linkmural.com/studioforca</span>
              <Link
                href="/studioforca"
                className="inline-flex min-h-11 items-center gap-1 font-semibold text-[#C8F25A] underline-offset-2 hover:underline"
              >
                Ver exemplo ao vivo
                <Icon name="arrow" size={14} />
              </Link>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-6 text-caption text-ink-muted sm:px-8">
        <span>© {new Date().getFullYear()} linkmural</span>
        <div className="flex items-center gap-5">
          <Link href="/studioforca" className="hover:text-ink">
            Exemplo
          </Link>
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
