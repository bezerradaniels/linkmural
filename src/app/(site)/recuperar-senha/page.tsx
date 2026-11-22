import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Alert, Icon } from "@/components/ui";
import { safeNext } from "@/lib/redirect";
import { createClient } from "@/utils/supabase/server";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = {
  title: "Recuperar acesso",
  description:
    "Esqueceu ou perdeu o acesso ao Linkmural? Receba um novo link mágico no seu e-mail ou entre direto com Google.",
};

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <AuthSplitLayout
      imageSrc="/images/hero-influencers-desktop.jpg"
      imageAlt="Criadores de conteúdo usando o celular"
      imageClassName="object-cover object-[75%_20%]"
      mobileBadge="Acesso sem senha"
      footerNote="Sem senha para decorar · Link válido por 1 hora · Entrada segura"
      asideContent={
        <div className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-pill border border-white/15 bg-black/55 px-3.5 py-1.5 text-caption font-semibold text-white backdrop-blur-md">
            <span className="size-2 rounded-full bg-lime" />
            Acesso instantâneo sem senha
          </div>

          <div className="rounded-[24px] border border-white/15 bg-black/65 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-lime text-on-lime">
                <Icon name="mail" size={20} />
              </span>
              <div>
                <p className="font-display text-body font-bold text-white">
                  Link mágico em segundos
                </p>
                <p className="text-caption text-white/70">
                  Zero senha para esquecer ou resetar
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-semibold tracking-wider text-lime uppercase">
                  Passo 1
                </p>
                <p className="mt-1 text-caption font-medium text-white">
                  Digite seu e-mail cadastrado
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-semibold tracking-wider text-lime uppercase">
                  Passo 2
                </p>
                <p className="mt-1 text-caption font-medium text-white">
                  Toque no link e volte pro painel
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5 text-center lg:text-left">
        <span className="mx-auto inline-flex w-fit items-center gap-1.5 rounded-pill bg-lime/20 px-3 py-1 text-[11.5px] font-semibold text-ink lg:mx-0">
          <span className="size-1.5 rounded-full bg-ink" />
          Recuperar acesso
        </span>
        <h1 className="mt-1 font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
          Volte para sua vitrine
        </h1>
        <p className="text-body text-ink-muted">
          No Linkmural você não usa senha. Informe seu e-mail para receber um
          novo link de acesso na hora.
        </p>
      </div>

      <Alert tone="info" title="Dica rápida">
        Se você criou sua conta com o Google, basta tocar em{" "}
        <strong>Entrar direto com Google</strong> abaixo.
      </Alert>

      <RecoverForm next={next} />

      <div className="flex flex-col gap-2 text-center text-small text-ink-muted">
        <p>
          Quer tentar entrar normalmente?{" "}
          <Link
            href="/entrar"
            className="font-semibold text-ink underline underline-offset-2"
          >
            Ir para o login
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
    </AuthSplitLayout>
  );
}
