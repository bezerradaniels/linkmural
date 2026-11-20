import type { Metadata } from "next";
import { Badge, Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { signOut } from "../auth/actions";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

/** Placeholder until the dashboard (Phase 3). */
export default async function AppHome() {
  const { supabase, userId, email } = await requireUser("/app");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan")
    .eq("id", userId)
    .maybeSingle();

  const plan = profile?.plan ?? "free";
  const planLabel = { free: "Grátis", pro: "Pro", business: "Negócios" }[plan];
  const planVariant = {
    free: "neutral",
    pro: "pro",
    business: "business",
  } as const;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-3 rounded-xl bg-surface p-6">
        <Badge variant={planVariant[plan]} className="self-start">
          {planLabel}
        </Badge>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Olá{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-ink-muted">
          Você entrou como <strong className="text-ink">{email}</strong>. O
          painel chega na Fase 3.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </div>
    </main>
  );
}
