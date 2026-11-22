import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert, Icon } from "@/components/ui";
import { safeNext } from "@/lib/redirect";
import { createClient } from "@/utils/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Cadastre-se grátis",
  description:
    "Crie sua conta grátis no Linkmural sem senha e sem cartão. Depois escolha o endereço e publique sua página em 3 minutos.",
};

const ERRORS: Record<string, string> = {
  link: "Esse link expirou ou já foi usado. Peça outro abaixo.",
  google:
    "Não deu para entrar com o Google agora. Tente de novo ou use o e-mail.",
};

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next, "/onboarding/iniciar");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  const error = params.erro ? ERRORS[params.erro] : undefined;

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-surface text-ink lg:grid-cols-2">
      {/* Left column: clean signup form */}
      <main className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex justify-center lg:justify-start">
          <Link href="/" aria-label="linkmural, página inicial">
            <Image
              src="/brand/linkmural-logo.svg"
              alt="Linkmural"
              width={148}
              height={23}
              priority
            />
          </Link>
        </div>

        <div className="mx-auto my-8 flex w-full max-w-[400px] flex-col gap-6">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
              Entre para o linkmural
            </h1>
            <p className="text-body text-ink-muted">Cadastre-se grátis!</p>
          </div>

          {error && (
            <Alert tone="error" title="Não foi possível continuar">
              {error}
            </Alert>
          )}

          <SignupForm next={next} />

          <p className="text-center text-small text-ink-muted">
            Já tem uma conta?{" "}
            <Link
              href="/entrar"
              className="font-semibold text-ink underline underline-offset-2"
            >
              Entrar
            </Link>
          </p>
        </div>

        <div className="text-center text-caption text-ink-muted lg:text-left">
          Sem senha · Sem cartão de crédito · Pronta em menos de 3 minutos
        </div>
      </main>

      {/* Right column (desktop only): editorial brand showcase */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:items-center lg:justify-center"
      >
        {/* Subtle decorative lime glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-lime/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-lime/10 blur-3xl" />

        <div className="relative flex w-full max-w-[380px] flex-col items-center gap-6">
          {/* Floating slug badge */}
          <div className="self-start rounded-pill border border-paper/15 bg-paper px-4 py-2 text-small font-semibold text-ink shadow-md">
            <span className="mr-2 inline-block size-2.5 rounded-full bg-lime" />
            linkmural.com/<strong>seunegocio</strong>
          </div>

          {/* Phone mockup */}
          <div className="w-full rounded-[28px] border border-paper/15 bg-[#16171A] p-6 shadow-2xl">
            <div className="flex items-center gap-3.5">
              <span className="grid size-13 shrink-0 place-items-center rounded-[16px] bg-lime font-display text-title font-bold text-on-lime">
                SF
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-body font-semibold text-paper">
                  Studio Força
                </p>
                <p className="truncate text-caption text-paper/65">
                  Academia · Treino funcional
                </p>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-pill bg-paper/10 px-3 py-1 text-caption font-medium text-paper">
              <span className="size-2 rounded-full bg-[#22C55E]" />
              Aberto agora · até 22h
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <div className="relative flex items-center justify-between rounded-lg bg-lime px-4 py-3 text-small font-semibold text-on-lime">
                <span>Agendar aula experimental</span>
                <Icon name="arrow" size={16} />
                <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 border-[#16171A] bg-lime" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-paper/12 bg-paper/5 px-4 py-3 text-small font-medium text-paper">
                <span>Chamar no WhatsApp</span>
                <Icon name="arrow" size={16} className="text-paper/50" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-paper/12 bg-paper/5 px-4 py-3 text-small font-medium text-paper">
                <span>Pagar com Pix · copiar chave</span>
                <Icon name="copy" size={15} className="text-paper/50" />
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {["WhatsApp em 1 toque", "QR code pronto", "3 modelos × 8 estilos"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-pill border border-paper/15 bg-paper/5 px-3 py-1 text-caption font-medium text-paper/80"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
