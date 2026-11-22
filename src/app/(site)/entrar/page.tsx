import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Alert, Icon } from "@/components/ui";
import { safeNext } from "@/lib/redirect";
import { createClient } from "@/utils/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no linkmural com Google ou com um link no seu e-mail.",
};

const ERRORS: Record<string, string> = {
  link: "Esse link expirou ou já foi usado. Peça outro abaixo.",
  google:
    "Não deu para entrar com o Google agora. Tente de novo ou use o e-mail.",
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const supabase = await createClient();
  // Verify the session against Auth server (not just local JWT claims) so a
  // deleted or revoked account never gets stuck redirecting away from /entrar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  const error = params.erro ? ERRORS[params.erro] : undefined;
  // Coming from "Assinar o Pro" on the price page.
  const wantsPlan = next === "/app/plano" || next.startsWith("/app/plano?");

  return (
    <AuthSplitLayout
      imageSrc="/images/creator-studio.jpg"
      imageAlt="Criador de conteúdo conferindo cliques no celular"
      imageClassName="object-cover object-[center_18%]"
      mobileBadge="Painel do criador"
      footerNote="Sem senha · Entre com Google ou link mágico no e-mail"
      asideContent={
        <div className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-pill border border-white/15 bg-black/55 px-4 py-2 text-small font-semibold text-white shadow-lg backdrop-blur-md">
            <span className="size-2.5 rounded-full bg-lime" />
            Cliques em tempo real · UTM ativo
          </div>

          <div className="w-full rounded-[24px] border border-white/15 bg-black/65 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-lime font-display text-title font-bold text-on-lime">
                  TH
                </span>
                <div>
                  <p className="font-display text-body font-bold text-white">
                    @thiago.sp
                  </p>
                  <p className="text-caption text-white/70">
                    São Paulo · Tech &amp; Lifestyle
                  </p>
                </div>
              </div>
              <span className="rounded-pill bg-lime px-2.5 py-1 text-[11px] font-bold text-on-lime">
                +42% hoje
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[12px] border border-white/12 bg-white/8 p-2.5 text-center">
                <p className="font-display text-title font-bold text-white">
                  1.4k
                </p>
                <p className="text-[11px] text-white/65">Visitas</p>
              </div>
              <div className="rounded-[12px] border border-white/12 bg-white/8 p-2.5 text-center">
                <p className="font-display text-title font-bold text-lime">
                  612
                </p>
                <p className="text-[11px] text-white/65">Cliques</p>
              </div>
              <div className="rounded-[12px] border border-white/12 bg-white/8 p-2.5 text-center">
                <p className="font-display text-title font-bold text-white">
                  43%
                </p>
                <p className="text-[11px] text-white/65">CTR</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-[12px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-caption text-white/85">
              <span>Origem principal: ?utm_source=tiktok</span>
              <Icon name="arrow" size={14} className="text-lime" />
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5 text-center lg:text-left">
        <span className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-pill bg-lime/25 px-3 py-1 text-[11.5px] font-semibold text-ink lg:mx-0">
          <span className="size-1.5 rounded-full bg-ink" />
          Bem-vindo de volta
        </span>
        <h1 className="mt-1 font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          Entrar no Linkmural
        </h1>
        <p className="text-body text-ink-muted">
          Sem senha: use o Google ou receba um link no e-mail.
        </p>
      </div>

      {wantsPlan && (
        <Alert tone="info" title="Para assinar seu plano">
          Entre ou crie a sua conta. Quem ainda não tem página monta a primeira
          em poucos passos e depois assina em “Plano”.
        </Alert>
      )}

      {error && (
        <Alert tone="error" title="Não foi possível entrar">
          {error}
        </Alert>
      )}

      <LoginForm next={next} />

      <div className="flex flex-col gap-2 text-center text-small text-ink-muted">
        <p>
          Não recebeu o link ou perdeu o acesso?{" "}
          <Link
            href="/recuperar-senha"
            className="font-semibold text-ink underline underline-offset-2"
          >
            Recuperar acesso
          </Link>
        </p>
        <p>
          Ainda não tem uma conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-ink underline underline-offset-2"
          >
            Cadastre-se grátis
          </Link>
        </p>
      </div>

      <p className="text-center text-caption text-ink-muted">
        Ao continuar, você concorda com os{" "}
        <Link href="/termos" className="underline underline-offset-2">
          Termos de uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="underline underline-offset-2">
          Política de Privacidade
        </Link>
        .
      </p>
    </AuthSplitLayout>
  );
}
