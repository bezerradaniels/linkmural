import type { Metadata } from "next";
import { WaitlistButton } from "@/components/marketing/WaitlistButton";
import { Badge, Button, Icon, Progress } from "@/components/ui";
import { getPanelContext } from "@/lib/panel-data";
import { PLANS, type Plan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Plano e cobrança",
};

function formatBrl(cents: number): string {
  if (cents === 0) return "R$ 0";
  return `R$ ${Math.round(cents / 100)}`;
}

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

export default async function PlanoPage() {
  const { plan, page, email } = await getPanelContext();
  const current = PLANS[plan];
  const linkCount = page.links.length;

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

      {/* Plans grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(["free", "pro", "business"] as Plan[]).map((key) => {
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

                <div>
                  <span className="font-display text-display-md">
                    {formatBrl(info.price.monthly)}
                  </span>
                  {info.price.monthly > 0 && (
                    <span className="text-small text-ink-muted">/mês</span>
                  )}
                  {info.price.yearly > 0 && (
                    <p className="mt-0.5 text-caption text-ink-muted">
                      ou {formatBrl(info.price.yearly)}/ano (2 meses grátis)
                    </p>
                  )}
                </div>

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
                <Button variant="outline" size="md" className="w-full" disabled>
                  Seu plano atual
                </Button>
              ) : key !== "free" ? (
                <WaitlistButton
                  plan={key}
                  label="Entrar na lista de espera"
                  source="painel"
                  defaultEmail={email ?? ""}
                  variant={key === "pro" ? "primary" : "secondary"}
                />
              ) : (
                <Button variant="outline" size="md" className="w-full" disabled>
                  Plano Grátis
                </Button>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
