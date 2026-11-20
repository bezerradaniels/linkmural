import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/(site)/entrar/login-form";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert } from "@/components/ui";
import { parseHoldCookie, SLUG_HOLD_COOKIE } from "@/lib/slug";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Crie sua conta · Onboarding",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  link: "Esse link expirou ou já foi usado. Peça outro abaixo.",
  google:
    "Não deu para entrar com o Google agora. Tente de novo ou use o e-mail.",
};

export default async function OnboardingStep2Page({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) {
    redirect("/onboarding/iniciar");
  }

  const params = await searchParams;
  const cookieStore = await cookies();
  const hold = parseHoldCookie(cookieStore.get(SLUG_HOLD_COOKIE)?.value);

  if (!hold && !params.erro) {
    redirect("/?aviso=escolha_endereco");
  }

  const error = params.erro ? ERRORS[params.erro] : undefined;

  return (
    <OnboardingShell
      step={2}
      title="Crie sua conta em 1 toque"
      subtitle="Sem senha e sem cartão. Seu endereço fica reservado por 30 minutos."
      backHref="/"
      slug={hold?.slug}
    >
      <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
        {error && (
          <Alert tone="error" title="Não foi possível entrar">
            {error}
          </Alert>
        )}

        <LoginForm next="/onboarding/iniciar" />
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
    </OnboardingShell>
  );
}
