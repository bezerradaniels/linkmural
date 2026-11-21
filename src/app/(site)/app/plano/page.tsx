import type { Metadata } from "next";
import { PendingActivation } from "@/components/app/PendingActivation";
import {
  BillingIntervalProvider,
  BillingToggle,
} from "@/components/marketing/BillingInterval";
import { PlanPrice } from "@/components/marketing/PlanPrice";
import { SubscribeButton } from "@/components/marketing/SubscribeButton";
import { WaitlistButton } from "@/components/marketing/WaitlistButton";
import { Alert, Badge, Button, Icon, Progress } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPanelContext } from "@/lib/panel-data";
import { PLANS, SALE_PLANS, type Plan } from "@/lib/plans";
import { isBillingEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Plano e cobrança",
};

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    "1 página publicada",
    "Até 5 links",
    "WhatsApp, Salvar contato e QR code",
    "Todos os 3 modelos e 8 estilos",
    "Total de cliques e gráfico de 7 ou 30 dias",
  ],
  pro: [
    "Links ilimitados",
    "Fonte, paleta, tamanho e cantos personalizados",
    "Remover “Feito com linkmural” do rodapé",
    "Métricas por link e qualquer período",
  ],
  business: [
    "Tudo do Pro + até 3 páginas",
    "Domínio próprio (links.suaempresa.com.br)",
    "Origem dos visitantes e exportação CSV",
    "Recursos de negócio (horários, catálogo e pixel)",
  ],
};

/** Messages for the ?erro= codes set by the /api/stripe routes. */
const ERROR_MESSAGES: Record<string, string> = {
  indisponivel:
    "A assinatura ainda não está disponível. Entre na lista de espera para ser avisado.",
  checkout:
    "Não conseguimos abrir o pagamento agora. Tente de novo em instantes.",
  ja_assinante:
    "Você já tem um plano pago. Use “Gerenciar assinatura” para fazer mudanças.",
  suspensa: "Sua conta está suspensa. Fale com o suporte em oi@linkmural.com.",
  sem_assinatura: "Não encontramos uma assinatura para gerenciar.",
  portal:
    "Não conseguimos abrir o gerenciamento agora. Tente de novo em instantes.",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/** Opens the Stripe Customer Portal (card, invoices, cancel at period end). */
function ManageButton({
  variant = "outline",
}: {
  variant?: "outline" | "primary";
}) {
  return (
    <form method="post" action="/api/stripe/portal" className="w-full">
      <Button type="submit" variant={variant} size="md" className="w-full">
        Gerenciar assinatura
      </Button>
    </form>
  );
}

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; cancelado?: string; erro?: string }>;
}) {
  const [{ plan, page, email }, params, { supabase }] = await Promise.all([
    getPanelContext(),
    searchParams,
    requireUser("/app/plano"),
  ]);
  const billingEnabled = isBillingEnabled();
  const current = PLANS[plan];
  const linkCount = page.links.length;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "status, billing_interval, current_period_end, cancel_at_period_end",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paid = plan !== "free";
  const periodEnd = formatDate(subscription?.current_period_end ?? null);
  const errorMessage = params.erro ? ERROR_MESSAGES[params.erro] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Plano e cobrança
        </h1>
        <p className="text-body text-ink-muted">
          Você está no plano{" "}
          <strong className="text-ink">{current.label}</strong>.
        </p>
      </div>

      {params.ok === "1" &&
        (paid ? (
          <Alert tone="success" title="Assinatura ativa">
            Obrigado! Seu plano {current.label} já está valendo.
          </Alert>
        ) : (
          <PendingActivation />
        ))}
      {params.cancelado === "1" && (
        <Alert tone="info" title="Pagamento cancelado">
          Nenhuma cobrança foi feita. Você pode assinar quando quiser.
        </Alert>
      )}
      {errorMessage && (
        <Alert tone="error" title="Não deu certo">
          {errorMessage}
        </Alert>
      )}
      {paid && subscription?.status === "past_due" && (
        <Alert
          tone="warning"
          title="Pagamento pendente"
          action={<ManageButton variant="primary" />}
        >
          Não conseguimos cobrar a sua assinatura. Atualize o cartão para não
          perder o plano {current.label}.
        </Alert>
      )}
      {paid && subscription?.cancel_at_period_end && periodEnd && (
        <Alert tone="info" title={`Seu plano termina em ${periodEnd}`}>
          Até lá, tudo continua funcionando. Para manter o plano, reative em
          “Gerenciar assinatura”.
        </Alert>
      )}

      {/* Current Usage */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-small font-semibold">Páginas</span>
            <span className="text-small text-ink-muted">
              1 de {current.maxPages}
            </span>
          </div>
          <Progress value={1} max={current.maxPages} label="Páginas usadas" />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-small font-semibold">Links</span>
            <span className="text-small text-ink-muted">
              {current.maxLinks !== null
                ? `${linkCount} de ${current.maxLinks}`
                : `${linkCount} (ilimitados)`}
            </span>
          </div>
          {current.maxLinks !== null && (
            <Progress
              value={linkCount}
              max={current.maxLinks}
              label="Links usados"
              tone={linkCount >= current.maxLinks ? "warning" : "default"}
            />
          )}
        </div>
      </section>

      <BillingIntervalProvider>
        <BillingToggle />

        {/* Plans grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SALE_PLANS.map((key) => {
            const info = PLANS[key];
            const isCurrent = plan === key;

            return (
              <div
                key={key}
                className={`flex flex-col justify-between gap-5 rounded-xl border p-5 ${
                  isCurrent
                    ? "border-ink bg-surface shadow-sm"
                    : "border-line bg-surface"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-title">{info.label}</h2>
                    {isCurrent ? (
                      <Badge variant="neutral">Plano atual</Badge>
                    ) : key === "pro" ? (
                      <Badge variant="pro">Popular</Badge>
                    ) : null}
                  </div>

                  <PlanPrice plan={key} />
                  <ul className="flex flex-col gap-2 text-small text-ink-muted">
                    {PLAN_FEATURES[key].map((feat) => (
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

                {isCurrent ? (
                  key !== "free" && billingEnabled ? (
                    <ManageButton />
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full"
                      disabled
                    >
                      Seu plano atual
                    </Button>
                  )
                ) : key !== "free" ? (
                  billingEnabled ? (
                    <SubscribeButton />
                  ) : (
                    <WaitlistButton
                      plan="pro"
                      label="Entrar na lista de espera"
                      source="painel"
                      defaultEmail={email ?? ""}
                      variant="primary"
                    />
                  )
                ) : (
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full"
                    disabled
                  >
                    Plano Grátis
                  </Button>
                )}
              </div>
            );
          })}
        </section>
      </BillingIntervalProvider>
    </div>
  );
}
