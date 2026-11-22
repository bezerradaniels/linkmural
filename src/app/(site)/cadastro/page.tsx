import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Alert, Icon } from "@/components/ui";
import { safeNext } from "@/lib/redirect";
import { createClient } from "@/utils/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Cadastre-se grátis",
  description:
    "Crie sua conta grátis no Linkmural sem senha e sem cartão. Depois escolha o endereço e publique sua página em Bento Grid em 3 minutos.",
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
    <AuthSplitLayout
      imageSrc="/images/creator-bento.jpg"
      imageAlt="Criadora de conteúdo usando o celular"
      imageClassName="object-cover object-[center_18%]"
      mobileBadge="Pronta em 3 min"
      footerNote="Sem senha · Sem cartão de crédito · Pronta em menos de 3 minutos"
      asideContent={
        <div className="flex flex-col gap-4">
          {/* Floating slug badge */}
          <div className="inline-flex w-fit items-center gap-2 rounded-pill border border-white/15 bg-black/55 px-4 py-2 text-small font-semibold text-white shadow-lg backdrop-blur-md">
            <span className="size-2.5 rounded-full bg-lime" />
            linkmural.com/<strong>seunome</strong>
          </div>

          {/* TikTok Creator Bento Preview Card */}
          <div className="w-full rounded-[24px] border border-white/15 bg-black/65 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-lime font-display text-title font-bold text-on-lime">
                  CL
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-body font-bold text-white">
                    @clara.cria
                  </p>
                  <p className="truncate text-caption text-white/70">
                    Creator · Beauty &amp; Lifestyle
                  </p>
                </div>
              </div>
              <span className="rounded-pill bg-lime/15 px-2.5 py-1 text-[11px] font-semibold text-lime">
                Bento Grid
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-[14px] border border-white/12 bg-white/8 p-3">
                <span className="text-[10.5px] font-bold tracking-wider text-lime uppercase">
                  TikTok
                </span>
                <p className="mt-1 text-small font-semibold text-white">
                  Meu kit de luz
                </p>
                <p className="text-[11px] text-white/65">Cupom CLARA15</p>
              </div>
              <div className="rounded-[14px] border border-white/12 bg-white/8 p-3">
                <span className="text-[10.5px] font-bold tracking-wider text-white/60 uppercase">
                  YouTube
                </span>
                <p className="mt-1 text-small font-semibold text-white">
                  Vlog novo no ar
                </p>
                <p className="text-[11px] text-white/65">Player 16:9</p>
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-[14px] bg-lime px-4 py-3 text-small font-semibold text-on-lime">
                <span>Publis e parcerias no WhatsApp</span>
                <Icon name="arrow" size={16} />
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {["Bento 1×1 e 2×2", "Unsplash integrado", "Gerador de UTM"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-pill border border-white/15 bg-black/45 px-3 py-1 text-caption font-medium text-white/85 backdrop-blur-md"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5 text-center lg:text-left">
        <span className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-pill bg-lime/25 px-3 py-1 text-[11.5px] font-semibold text-ink lg:mx-0">
          <span className="size-1.5 rounded-full bg-ink" />
          Para criadores e negócios
        </span>
        <h1 className="mt-1 font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          Crie sua vitrine grátis
        </h1>
        <p className="text-body text-ink-muted">
          Sua bio em Bento Grid pronta em menos de 3 minutos.
        </p>
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
    </AuthSplitLayout>
  );
}
