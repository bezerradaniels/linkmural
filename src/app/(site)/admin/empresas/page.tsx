import type { Metadata } from "next";
import { PAID_STATUSES } from "@/lib/billing-core";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  EmpresasTable,
  type EmpresaOrigin,
  type EmpresaRow,
  type EmpresasKpis,
} from "./empresas-table";

export const metadata: Metadata = {
  title: "Empresas",
};

function getSnapshotTime() {
  const nowMs = Date.now();
  return {
    nowMs,
    thirtyDaysAgoIso: new Date(nowMs - 30 * 86_400_000).toISOString(),
  };
}

function hostFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function readStr(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export default async function AdminEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const admin = createAdminClient();
  const { nowMs, thirtyDaysAgoIso } = getSnapshotTime();

  const [
    profilesRes,
    pagesRes,
    subsRes,
    linksRes,
    clicksRes,
    domainsRes,
    originEventsRes,
    waitlistRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, full_name, email, plan, role, stripe_customer_id, created_at, suspended_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("pages")
      .select(
        "id, owner_id, slug, business_name, city, whatsapp, phone, published, blocked_at, onboarding_step, style, template",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("subscriptions")
      .select(
        "user_id, plan, billing_interval, status, current_period_end, cancel_at_period_end, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("links").select("page_id, active").limit(5000),
    admin
      .from("click_events")
      .select("page_id, event")
      .gte("occurred_at", thirtyDaysAgoIso)
      .limit(30000),
    admin.from("domains").select("page_id, hostname, status").limit(500),
    admin
      .from("onboarding_events")
      .select("user_id, metadata")
      .eq("event", "origem_capturada")
      .order("occurred_at", { ascending: false })
      .limit(1000),
    admin
      .from("waitlist")
      .select("email, source")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  // Primary page per owner
  type PageRecord = NonNullable<typeof pagesRes.data>[number];
  const pagesByOwner = new Map<string, PageRecord[]>();
  for (const p of pagesRes.data ?? []) {
    const arr = pagesByOwner.get(p.owner_id) ?? [];
    arr.push(p);
    pagesByOwner.set(p.owner_id, arr);
  }

  // Latest subscription per user
  type SubRecord = NonNullable<typeof subsRes.data>[number];
  const subByUser = new Map<string, SubRecord>();
  for (const s of subsRes.data ?? []) {
    if (!subByUser.has(s.user_id)) {
      subByUser.set(s.user_id, s);
    }
  }

  // Links count per page
  const linksCountByPage = new Map<string, number>();
  for (const l of linksRes.data ?? []) {
    if (!l.active) continue;
    linksCountByPage.set(l.page_id, (linksCountByPage.get(l.page_id) ?? 0) + 1);
  }

  // 30d views & clicks per page
  const trafficByPage = new Map<string, { views: number; clicks: number }>();
  for (const c of clicksRes.data ?? []) {
    const cur = trafficByPage.get(c.page_id) ?? { views: 0, clicks: 0 };
    if (c.event === "view") cur.views++;
    else cur.clicks++;
    trafficByPage.set(c.page_id, cur);
  }

  // Custom domain per page
  const domainByPage = new Map<string, { hostname: string; status: string }>();
  for (const d of domainsRes.data ?? []) {
    domainByPage.set(d.page_id, { hostname: d.hostname, status: d.status });
  }

  // Acquisition origin per user (from onboarding_events 'origem_capturada')
  const originByUser = new Map<string, EmpresaOrigin>();
  for (const ev of originEventsRes.data ?? []) {
    if (!ev.user_id || originByUser.has(ev.user_id)) continue;
    const meta =
      ev.metadata && typeof ev.metadata === "object" && !Array.isArray(ev.metadata)
        ? (ev.metadata as Record<string, unknown>)
        : {};
    const referer = readStr(meta, "referer");
    const source = readStr(meta, "utm_source");
    const medium = readStr(meta, "utm_medium");
    const campaign = readStr(meta, "utm_campaign");
    const content = readStr(meta, "utm_content");
    const term = readStr(meta, "utm_term");
    const label = source ?? hostFromReferer(referer) ?? "direto";
    originByUser.set(ev.user_id, {
      label,
      referer,
      campaign,
      content,
      medium,
      source,
      term,
    });
  }

  // Fallback waitlist source by email
  const waitlistSourceByEmail = new Map<string, string>();
  for (const w of waitlistRes.data ?? []) {
    const key = w.email.toLowerCase();
    if (!waitlistSourceByEmail.has(key) && w.source) {
      waitlistSourceByEmail.set(key, w.source);
    }
  }

  const paidSet = new Set<string>(PAID_STATUSES);

  let subscribersCount = 0;
  let overdueCount = 0;
  let publishedCount = 0;
  let withLinksCount = 0;
  let withTrafficCount = 0;

  const rows: EmpresaRow[] = (profilesRes.data ?? []).map((prof) => {
    const pages = pagesByOwner.get(prof.id) ?? [];
    const primary = pages[0] ?? null;
    const sub = subByUser.get(prof.id) ?? null;

    let linksCount = 0;
    let views30d = 0;
    let clicks30d = 0;
    let hasDomain = false;
    let hasWhatsapp = false;

    for (const p of pages) {
      linksCount += linksCountByPage.get(p.id) ?? 0;
      const t = trafficByPage.get(p.id);
      if (t) {
        views30d += t.views;
        clicks30d += t.clicks;
      }
      if (domainByPage.has(p.id)) hasDomain = true;
      if (p.whatsapp || p.phone) hasWhatsapp = true;
    }

    const isSubscriber = sub ? paidSet.has(sub.status) : false;
    const isOverdue =
      sub?.status === "past_due" ||
      sub?.status === "unpaid" ||
      Boolean(prof.suspended_at);
    const isPublished = Boolean(primary?.published && !primary?.blocked_at);

    if (isSubscriber) subscribersCount++;
    if (isOverdue) overdueCount++;
    if (isPublished) publishedCount++;
    if (linksCount > 0) withLinksCount++;
    if (views30d > 0 || clicks30d > 0) withTrafficCount++;

    const capturedOrigin = originByUser.get(prof.id);
    const waitlistSrc = prof.email
      ? (waitlistSourceByEmail.get(prof.email.toLowerCase()) ?? null)
      : null;
    const origin: EmpresaOrigin = capturedOrigin ?? {
      label: waitlistSrc ?? "direto",
      referer: null,
      campaign: null,
      content: null,
      medium: null,
      source: waitlistSrc,
      term: null,
    };

    return {
      id: prof.id,
      full_name: prof.full_name,
      email: prof.email,
      plan: prof.plan,
      role: prof.role,
      created_at: prof.created_at,
      suspended_at: prof.suspended_at,
      page_id: primary?.id ?? null,
      pages_count: pages.length,
      slug: primary?.slug ?? null,
      business_name: primary?.business_name ?? null,
      city: primary?.city ?? null,
      published: Boolean(primary?.published),
      blocked: Boolean(primary?.blocked_at),
      onboarding_step: primary?.onboarding_step ?? 0,
      template: primary?.template ?? null,
      sub_status: sub?.status ?? null,
      sub_interval: sub?.billing_interval ?? null,
      sub_period_end: sub?.current_period_end ?? null,
      sub_cancel_at_end: sub?.cancel_at_period_end ?? false,
      has_stripe: Boolean(prof.stripe_customer_id),
      links_count: linksCount,
      views_30d: views30d,
      clicks_30d: clicks30d,
      has_whatsapp: hasWhatsapp,
      has_domain: hasDomain,
      origin,
    };
  });

  const kpis: EmpresasKpis = {
    total: rows.length,
    subscribers: subscribersCount,
    overdue: overdueCount,
    published: publishedCount,
    withLinks: withLinksCount,
    withTraffic: withTrafficCount,
  };

  return (
    <EmpresasTable initialQuery={q} rows={rows} kpis={kpis} nowMs={nowMs} />
  );
}
