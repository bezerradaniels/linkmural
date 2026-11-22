import type { Metadata } from "next";
import { BillingEventTracker } from "@/components/app/BillingEventTracker";
import { ManageSubscriptionButton } from "@/components/app/ManageSubscriptionButton";
import { PendingActivation } from "@/components/app/PendingActivation";
import { SubscriptionSummary } from "@/components/app/SubscriptionSummary";
import {
  BillingIntervalProvider,
  BillingToggle,
} from "@/components/marketing/BillingInterval";
import { PlanPrice } from "@/components/marketing/PlanPrice";
import { SubscribeButton } from "@/components/marketing/SubscribeButton";
import { WaitlistButton } from "@/components/marketing/WaitlistButton";
import { Alert, Badge, Button, Icon, Progress } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { summarizeSubscription } from "@/lib/billing-core";
import { getPanelContext } from "@/lib/panel-data";
import { PLANS, SALE_PLANS, formatBrl, type Plan } from "@/lib/plans";
import { isBillingEnabled } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Plano e cobrança",
};

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    "1 página publicada",
    "Até 5 links (barra 2×1)",
    "Fonte, cores e fundo sólido ou gradiente",
    "Todos os 3 modelos com Logo e Capa",
    "Total de cliques e gráfico de 7 ou 30 dias",
  ],
  pro: [
    "Links ilimitados",
    "Bento Grid com cards 2×1, 1×1 e 2×2",
    "Transparência (Glass), Glossy, Doodles e Imagem",
    "Remover “Feito com linkmural” do rodapé",
    "Métricas por link e qualquer período",
  ],
  business: [
    "Tudo do Pro + até 3 páginas",
    "Galeria de fotos em carrossel no Bento Grid",
    "Vídeo do YouTube embutido na página",
    "Cards de Serviços com preço, duração e CTA",
    "Domínio próprio e métricas completas + CSV",
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

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    cancelado?: string;
    erro?: string;
    periodo?: string;
  }>;
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
      "id, status, billing_interval, current_period_end, cancel_at_period_end, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const paid = plan !== "free";
  const paidPlan: "pro" | "business" = plan === "business" ? "business" : "pro";
  const errorMessage = params.erro ? ERROR_MESSAGES[params.erro] : undefined;

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const summary = subscription
    ? summarizeSubscription(
        {
          interval:
            subscription.billing_interval === "year" ||
            subscription.billing_interval === "month"
              ? subscription.billing_interval
              : null,
          createdAt: new Date(subscription.created_at),
          periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          now: new Date(),
        },
        PLANS[paidPlan],
      )
    : null;

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
          <>
            {subscription && summary && (
              <BillingEventTracker
                kind="purchase"
                transactionId={subscription.id}
                value={summary.currentPrice / 100}
                plan={paidPlan}
                interval={summary.interval}
              />
            )}
            <Alert tone="success" title="Assinatura ativa">
              Obrigado! Seu plano {current.label} já está valendo.
            </Alert>
          </>
        ) : (
          <PendingActivation />
        ))}
      {params.cancelado === "1" && (
        <>
          <BillingEventTracker kind="checkout_canceled" />
          <Alert tone="info" title="Pagamento cancelado">
            Nenhuma cobrança foi feita. Você pode assinar quando quiser.
          </Alert>
        </>
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
          action={<ManageSubscriptionButton plan={paidPlan} variant="primary" />}
        >
          Não conseguimos cobrar a sua assinatura. Atualize o cartão para não
          perder o plano {current.label}.
        </Alert>
      )}
      {paid &&
        subscription?.status !== "past_due" &&
        summary?.priceIncreaseNotice && (
          <Alert
            tone="warning"
            title="Sua próxima renovação terá o valor regular"
            action={
              billingEnabled ? (
                <ManageSubscriptionButton plan={paidPlan} />
              ) : undefined
            }
          >
            O desconto de lançamento termina antes da próxima cobrança. Em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "long",
              timeZone: "America/Sao_Paulo",
            }).format(summary.priceIncreaseNotice.at)}
            , a assinatura renova por{" "}
            <strong>
              {formatBrl(summary.priceIncreaseNotice.newPrice)}
              {summary.interval === "year" ? "/ano" : "/mês"}
            </strong>
            . Você pode cancelar antes da data pelo botão ao lado sem novas
            cobranças.
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

      {paid ? (
        /* A customer already paying sees the subscription, not the price comparison. */
        <SubscriptionSummary
          planLabel={current.label}
          status={subscription?.status ?? "active"}
          cancelAtPeriodEnd={subscription?.cancel_at_period_end ?? false}
          endsOn={periodEnd}
          summary={summary}
          discountPercent={current.promo?.percentOff ?? null}
          features={PLAN_FEATURES[plan]}
          actions={
            billingEnabled ? (
              <ManageSubscriptionButton plan={paidPlan} />
            ) : null
          }
        />
      ) : (
        <BillingIntervalProvider
          initial={params.periodo === "month" ? "month" : "year"}
        >
          <BillingToggle />

          {/* Plans grid */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                      ) : key === "business" ? (
                        <Badge variant="pro">Completo</Badge>
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
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full"
                      disabled
                    >
                      Seu plano atual
                    </Button>
                  ) : billingEnabled ? (
                    <SubscribeButton plan={key} />
                  ) : (
                    <WaitlistButton
                      plan={key}
                      label="Entrar na lista de espera"
                      source="painel"
                      defaultEmail={email ?? ""}
                      variant="primary"
                    />
                  )}
                </div>
              );
            })}
          </section>
        </BillingIntervalProvider>
      )}
    </div>
  );
}
