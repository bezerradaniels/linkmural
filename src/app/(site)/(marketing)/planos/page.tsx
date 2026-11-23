import type { Metadata } from "next";
import Link from "next/link";
import {
  BillingIntervalProvider,
  BillingToggle,
} from "@/components/marketing/BillingInterval";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { PlanPrice } from "@/components/marketing/PlanPrice";
import { SubscribeLink } from "@/components/marketing/SubscribeLink";
import { WaitlistButton } from "@/components/marketing/WaitlistButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, buttonClasses, Icon } from "@/components/ui";
import { PLANS, SALE_PLANS, type Plan } from "@/lib/plans";
import { siteUrl } from "@/lib/redirect";
import { buildSoftwareApplicationSchema } from "@/lib/seo";
import { isBillingEnabled } from "@/lib/stripe";

// Whether billing is on depends on the environment at request time, not at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Comece grátis sem cartão. Conheça os planos Grátis e Pro do linkmural, com 50% de desconto de lançamento.",
  alternates: { canonical: `${siteUrl()}/planos` },
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
    <MarketingChrome>
      <JsonLd data={buildSoftwareApplicationSchema(siteUrl())} />
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
    </MarketingChrome>
  );
}
