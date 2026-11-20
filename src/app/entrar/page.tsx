import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui";
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
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect(next);

  const error = params.erro ? ERRORS[params.erro] : undefined;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <Link
          href="/"
          className="self-center"
          aria-label="linkmural, página inicial"
        >
          <Image
            src="/brand/linkmural-logo.svg"
            alt=""
            width={176}
            height={26}
            priority
          />
        </Link>

        <div className="flex flex-col gap-5 rounded-xl bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="font-display text-display-md tracking-[-0.03em]">
              Entrar
            </h1>
            <p className="text-small text-ink-muted">
              Sem senha: use o Google ou receba um link no e-mail.
            </p>
          </div>

          {error && (
            <Alert tone="error" title="Não foi possível entrar">
              {error}
            </Alert>
          )}

          <LoginForm next={next} />
        </div>

        <p className="text-center text-caption text-ink-muted">
          Ao continuar, você concorda com os Termos de uso e a Política de
          Privacidade.
        </p>
      </div>
    </main>
  );
}
