import Link from "next/link";
import { PageQuickBar } from "@/components/app/PageQuickBar";
import { Alert, Badge, Icon, Progress } from "@/components/ui";
import { getPanelContext } from "@/lib/panel-data";
import {
  calcDeltaPercent,
  formatDelta,
  formatMetricNumber,
} from "@/lib/panel-helpers";
import { planInfo } from "@/lib/plans";
import { siteUrl } from "@/lib/redirect";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

function isoDateOffset(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export default async function AppHomePage() {
  const { profile, page, plan } = await getPanelContext();
  const limits = planInfo(plan);
  const pageUrl = `${siteUrl()}/${page.slug}`;
  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? null;

  // Fetch 60 days of daily stats to compute last 30d + delta vs previous 30d.
  const supabase = await createClient();
  const { data: statsRows } = await supabase.rpc("page_stats_daily", {
    p_page: page.id,
    p_from: isoDateOffset(59),
    p_to: isoDateOffset(0),
  });

  const rows = statsRows ?? [];
  const prev30 = rows.slice(0, 30);
  const last30 = rows.slice(30);

  const views30 = last30.reduce((s, r) => s + Number(r.views ?? 0), 0);
  const clicks30 = last30.reduce((s, r) => s + Number(r.clicks ?? 0), 0);
  const prevViews = prev30.reduce((s, r) => s + Number(r.views ?? 0), 0);
  const prevClicks = prev30.reduce((s, r) => s + Number(r.clicks ?? 0), 0);

  const viewsDelta = formatDelta(calcDeltaPercent(views30, prevViews));
  const clicksDelta = formatDelta(calcDeltaPercent(clicks30, prevClicks));

  // Check onboarding_events for "link_copiado" and "qr_baixado" checklist items.
  let copiedLink = false;
  let downloadedQr = false;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: evs } = await createAdminClient()
        .from("onboarding_events")
        .select("event")
        .eq("page_id", page.id)
        .in("event", ["link_copiado", "qr_baixado"]);
      for (const e of evs ?? []) {
        if (e.event === "link_copiado") copiedLink = true;
        if (e.event === "qr_baixado") downloadedQr = true;
      }
    } catch {
      // Ignore if migration hasn't been applied yet
    }
  }

  const checklist = [
    {
      label: "Adicionar logo e descrição",
      done: Boolean(page.avatar_path && page.bio),
      href: "/app/informacoes",
    },
    {
      label: "Configurar WhatsApp e horários",
      done: Boolean(page.whatsapp && page.hours),
      href: "/app/informacoes",
    },
    {
      label: "Adicionar seu primeiro link",
      done: page.links.length > 0,
      href: "/app/pagina",
    },
    {
      label: "Escolher o modelo da página",
      done: page.onboarding_step >= 7 || page.template !== "balcao",
      href: "/app/aparencia",
    },
    {
      label: "Colocar o link na bio do Instagram",
      done: copiedLink,
      href: "#compartilhar",
    },
    {
      label: "Baixar o QR code para o balcão",
      done: downloadedQr,
      href: "#compartilhar",
    },
  ];

  const doneCount = checklist.filter((c) => c.done).length;
  const linkCount = page.links.length;
  const nearLinkLimit =
    limits.maxLinks !== null && linkCount >= limits.maxLinks - 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Olá{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-body text-ink-muted">
          Acompanhe sua página e mantenha tudo atualizado pelo celular ou
          computador.
        </p>
      </div>

      <div id="compartilhar">
        <PageQuickBar
          pageId={page.id}
          slug={page.slug}
          pageUrl={pageUrl}
          published={page.published}
        />
      </div>

      {nearLinkLimit && (
        <Alert tone="warning" title="Você está perto do limite do Grátis">
          Sua página já usa {linkCount} de {limits.maxLinks} links.{" "}
          <Link href="/app/plano" className="font-semibold underline">
            Ver planos
          </Link>
        </Alert>
      )}

      {/* KPI Cards */}
      <section
        aria-label="Resumo dos últimos 30 dias"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="flex flex-col justify-between gap-2 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption font-medium text-ink-muted">
            Cliques (30 dias)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-display-md">
              {formatMetricNumber(clicks30)}
            </span>
            {clicksDelta && <Badge variant="neutral">{clicksDelta}</Badge>}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption font-medium text-ink-muted">
            Visitas (30 dias)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-display-md">
              {formatMetricNumber(views30)}
            </span>
            {viewsDelta && <Badge variant="neutral">{viewsDelta}</Badge>}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 rounded-xl border border-line bg-surface p-4">
          <span className="text-caption font-medium text-ink-muted">Links</span>
          <div className="flex flex-col gap-2">
            <span className="font-display text-title">
              {limits.maxLinks !== null
                ? `${linkCount} de ${limits.maxLinks}`
                : formatMetricNumber(linkCount)}
            </span>
            {limits.maxLinks !== null && (
              <Progress
                value={linkCount}
                max={limits.maxLinks}
                label="Links usados no plano Grátis"
                tone={linkCount >= limits.maxLinks ? "warning" : "default"}
              />
            )}
          </div>
        </div>

        <Link
          href={plan === "free" ? "/app/plano" : "/app/metricas"}
          className="flex flex-col justify-between gap-2 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-ink"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-medium text-ink-muted">
              Link mais clicado
            </span>
            {plan === "free" && (
              <Badge variant="pro">
                <Icon name="lock" size={12} />
                Pro
              </Badge>
            )}
          </div>
          <p className="text-small text-ink-muted">
            {plan === "free"
              ? "Disponível no plano Pro"
              : "Ver detalhes em Métricas →"}
          </p>
        </Link>
      </section>

      {/* Checklist */}
      <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-title tracking-[-0.02em]">
              Deixe sua página completa
            </h2>
            <p className="text-small text-ink-muted">
              {doneCount} de {checklist.length} concluídos
            </p>
          </div>
          <div className="w-24">
            <Progress
              value={doneCount}
              max={checklist.length}
              label="Progresso do checklist"
            />
          </div>
        </div>

        <ul className="flex flex-col divide-y divide-line">
          {checklist.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex min-h-12 items-center justify-between gap-3 py-2.5 text-small transition-colors hover:text-ink"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                      item.done
                        ? "border-ink bg-ink text-lime"
                        : "border-line-strong bg-paper text-transparent"
                    }`}
                  >
                    <Icon name="check" size={14} />
                  </span>
                  <span
                    className={
                      item.done
                        ? "text-ink-muted line-through"
                        : "font-medium text-ink"
                    }
                  >
                    {item.label}
                  </span>
                </span>
                {!item.done && (
                  <Icon name="arrow" size={16} className="text-ink-muted" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
