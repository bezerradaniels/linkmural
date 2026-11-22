import type { Metadata } from "next";
import { MetricsView } from "@/components/app/MetricsView";
import type { MetricLinkInput, MetricUtmEvent } from "@/lib/metrics-helpers";
import { getPanelContext } from "@/lib/panel-data";
import { siteUrl } from "@/lib/redirect";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Métricas",
};

function isoDateSaoPaulo(nowMs: number, daysAgo: number): string {
  const d = new Date(nowMs - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

function getDateWindow(maxDays: number) {
  const nowMs = Date.now();
  return {
    nowMs,
    from: isoDateSaoPaulo(nowMs, maxDays - 1),
    toToday: isoDateSaoPaulo(nowMs, 0),
    sinceIso: new Date(nowMs - maxDays * 86_400_000).toISOString(),
  };
}

export default async function MetricasPage() {
  const { page, plan } = await getPanelContext();
  const supabase = await createClient();
  // Pro/Business support up to 90d + previous 90d comparison (180d); Free up to 30d + 30d (60d).
  const windowDays = plan === "free" ? 60 : 180;
  const { nowMs, from, toToday, sinceIso } = getDateWindow(windowDays);

  const [dailyRes, eventsRes, utmRes] = await Promise.all([
    supabase.rpc("page_stats_daily", {
      p_page: page.id,
      p_from: from,
      p_to: toToday,
    }),
    supabase
      .from("click_events")
      .select("link_id, event, occurred_at")
      .eq("page_id", page.id)
      .neq("event", "view")
      .gte("occurred_at", sinceIso),
    supabase
      .from("click_events")
      .select("utm_source, occurred_at")
      .eq("page_id", page.id)
      .eq("event", "view")
      .not("utm_source", "is", null)
      .gte("occurred_at", sinceIso),
  ]);

  const daily = (dailyRes.data ?? []).map((r) => ({
    day: r.day,
    views: Number(r.views ?? 0),
    clicks: Number(r.clicks ?? 0),
  }));

  const clickEvents = (eventsRes.data ?? []).map((e) => ({
    link_id: e.link_id,
    event: e.event,
    occurred_at: e.occurred_at,
  }));

  const utmEvents: MetricUtmEvent[] = (utmRes.data ?? []).map((u) => ({
    utm_source: u.utm_source,
    occurred_at: u.occurred_at,
  }));

  const links: MetricLinkInput[] = (page.links ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    kind: l.kind,
    active: l.active,
    featured: l.featured,
    position: l.position,
  }));

  return (
    <MetricsView
      daily={daily}
      clickEvents={clickEvents}
      utmEvents={utmEvents}
      links={links}
      referenceMs={nowMs}
      plan={plan}
      pageUrl={`${siteUrl()}/${page.slug}`}
    />
  );
}
