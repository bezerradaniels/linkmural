import type { Metadata } from "next";
import { MetricsView } from "@/components/app/MetricsView";
import { getPanelContext } from "@/lib/panel-data";
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

function getDateWindow() {
  const nowMs = Date.now();
  return {
    nowMs,
    from60: isoDateSaoPaulo(nowMs, 59),
    toToday: isoDateSaoPaulo(nowMs, 0),
    sinceIso: new Date(nowMs - 60 * 86_400_000).toISOString(),
  };
}

export default async function MetricasPage() {
  const { page, plan } = await getPanelContext();
  const supabase = await createClient();
  const { nowMs, from60, toToday, sinceIso } = getDateWindow();

  const [dailyRes, waEventsRes] = await Promise.all([
    supabase.rpc("page_stats_daily", {
      p_page: page.id,
      p_from: from60,
      p_to: toToday,
    }),
    supabase
      .from("click_events")
      .select("occurred_at")
      .eq("page_id", page.id)
      .eq("event", "whatsapp")
      .gte("occurred_at", sinceIso),
  ]);

  const daily = (dailyRes.data ?? []).map((r) => ({
    day: r.day,
    views: Number(r.views ?? 0),
    clicks: Number(r.clicks ?? 0),
  }));

  const waTimestamps = (waEventsRes.data ?? []).map((e) => e.occurred_at);

  return (
    <MetricsView
      daily60={daily}
      waTimestamps={waTimestamps}
      referenceMs={nowMs}
      plan={plan}
    />
  );
}
