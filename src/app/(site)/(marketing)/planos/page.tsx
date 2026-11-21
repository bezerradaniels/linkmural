import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BillingIntervalProvider,
  BillingToggle,
} from "@/components/marketing/BillingInterval";
import { PlanPrice } from "@/components/marketing/PlanPrice";
import { WaitlistButton } from "@/components/marketing/WaitlistButton";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { PLANS, SALE_PLANS, type Plan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Comece grátis sem cartão. Conheça os planos Grátis e Pro do linkmural, com 50% de desconto de lançamento.",
};

const FEATURES: Record<Plan, string[]> = {
  free: [
    "1 página publicada",
    "Até 5 links",
    "WhatsApp, Salvar contato e QR code",
    "Todos os 3 modelos e 8 estilos",
    "Cliques e visitas com gráfico de 7 ou 30 dias",
  ],
  pro: [
    "Links ilimitados",
    "Fonte, paleta, tamanho e cantos personalizados",
    "Remover “Feito com linkmural” do rodapé",
    "Métricas por link e por período",
  ],
  business: [
    "Tudo do Pro + até 3 páginas",
    "Domínio próprio (links.suaempresa.com.br)",
    "Origem dos visitantes e exportação CSV",
    "Horários para agendar, catálogo e pixel",
  ],
};

export default function PlanosPage() {
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
            href="/"
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
            O plano Grátis já tem tudo para colocar seu negócio no ar hoje. O
            Pro chega em breve, com 50% de desconto de lançamento — entre na
            lista de espera.
          </p>
        </div>

        <BillingIntervalProvider>
          <div className="flex justify-center">
            <BillingToggle />
          </div>

          <section className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
            {SALE_PLANS.map((key) => {
              const info = PLANS[key];
              return (
                <div
                  key={key}
                  className={`flex flex-col justify-between gap-6 rounded-xl border bg-surface p-6 ${
                    key === "free" ? "border-ink shadow-sm" : "border-line"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-title">{info.label}</h2>
                      {key === "free" ? (
                        <Badge variant="neutral" dot="positive">
                          Disponível hoje
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
                      href="/"
                      className={buttonClasses({
                        variant: "primary",
                        size: "md",
                        className: "w-full",
                      })}
                    >
                      Criar minha página grátis
                    </Link>
                  ) : (
                    <WaitlistButton
                      plan="pro"
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
