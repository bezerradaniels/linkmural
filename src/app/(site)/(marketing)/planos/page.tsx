import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BillingIntervalProvider,
  BillingToggle,
} from "@/components/marketing/BillingInterval";
import { PlanPrice } from "@/components/marketing/PlanPrice";
import { SubscribeLink } from "@/components/marketing/SubscribeLink";
import { WaitlistButton } from "@/components/marketing/WaitlistButton";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { PLANS, SALE_PLANS, type Plan } from "@/lib/plans";
import { isBillingEnabled } from "@/lib/stripe";

// Whether billing is on depends on the environment at request time, not at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Comece grátis sem cartão. Conheça os planos Grátis e Pro do linkmural, com 50% de desconto de lançamento.",
};

const FEATURES: Record<Plan, string[]> = {
  free: [
    "1 página publicada",
    "Até 5 links (formato barra 2×1)",
    "Fonte, cores e fundo sólido ou gradiente",
    "Todos os 3 modelos com Logo e Capa",
    "Cliques e visitas com gráfico de 7 ou 30 dias",
  ],
  pro: [
    "Links ilimitados",
    "Bento Grid com cards 2×1, 1×1 e 2×2",
    "Transparência (Glass), Glossy, Doodles e Imagem",
    "Remover “Feito com linkmural” do rodapé",
    "Métricas por link e por período",
  ],
  business: [
    "Tudo do Pro + até 3 páginas",
    "Galeria de fotos em carrossel no Bento Grid",
    "Vídeo do YouTube embutido na página",
    "Cards de Serviços com preço, duração e CTA",
    "Domínio próprio e métricas completas + CSV",
  ],
};

export default function PlanosPage() {
  // Without Stripe keys in this environment the Pro plan is still "coming soon" (waiting list).
  const billingEnabled = isBillingEnabled();

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
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
            href="/entrar"
            className={buttonClasses({ variant: "ghost", size: "md" })}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            Criar grátis
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 pt-6 pb-20 sm:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge variant="neutral" dot="positive">
            Comece grátis, sem cartão
          </Badge>
          <h1 className="font-display text-display-md tracking-[-0.03em] sm:text-display-lg">
            Planos simples para crescer com você
          </h1>
          <p className="max-w-xl text-body text-ink-muted">
            {billingEnabled
              ? "O plano Grátis já tem tudo para colocar seu negócio no ar hoje. Quando precisar de mais, o Pro está com 50% de desconto de lançamento."
              : "O plano Grátis já tem tudo para colocar seu negócio no ar hoje. O Pro chega em breve, com 50% de desconto de lançamento — entre na lista de espera."}
          </p>
        </div>

        <BillingIntervalProvider>
          <div className="flex justify-center">
            <BillingToggle />
          </div>

          <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            {SALE_PLANS.map((key) => {
              const info = PLANS[key];
              return (
                <div
                  key={key}
                  className={`flex flex-col justify-between gap-6 rounded-xl border bg-surface p-6 ${
                    key === "pro" ? "border-ink shadow-sm" : "border-line"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-title">{info.label}</h2>
                      {key === "free" ? (
                        <Badge variant="neutral" dot="positive">
                          Disponível hoje
                        </Badge>
                      ) : billingEnabled ? (
                        <Badge variant="pro">
                          {key === "business" ? "Criadores & Negócios" : "Popular"}
                        </Badge>
                      ) : (
                        <Badge variant="pro">Em breve</Badge>
                      )}
                    </div>

                    <PlanPrice plan={key} />

                    <ul className="flex flex-col gap-2.5 text-small text-ink-muted">
                      {FEATURES[key].map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Icon
                            name="check"
                            size={16}
                            className="mt-0.5 shrink-0 text-positive"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {key === "free" ? (
                    <Link
                      href="/cadastro"
                      className={buttonClasses({
                        variant: "primary",
                        size: "md",
                        className: "w-full",
                      })}
                    >
                      Criar minha página grátis
                    </Link>
                  ) : billingEnabled ? (
                    <SubscribeLink plan={key} />
                  ) : (
                    <WaitlistButton
                      plan={key}
                      label="Quero ser avisado"
                      source="planos"
                      variant="secondary"
                    />
                  )}
                </div>
              );
            })}
          </section>
        </BillingIntervalProvider>
      </main>
    </div>
  );
}
