export type MetricLinkInput = {
  id: string;
  title: string;
  url: string;
  kind: string;
  active: boolean;
  featured: boolean;
  position: number;
};

export type MetricClickEvent = {
  link_id: string | null;
  event: string;
  occurred_at: string;
};

export type LinkClickSummary = {
  id: string;
  title: string;
  url: string;
  kind: string;
  active: boolean;
  featured: boolean;
  clicks: number;
  sharePct: number;
};

export type ActionBreakdown = {
  whatsapp: number;
  contact: number;
  qr: number;
};

/**
 * Aggregates non-view click events within `[sinceMs, Infinity)` by link,
 * sorted by clicks descending (then link position ascending).
 */
export function summarizeLinkClicks(
  links: MetricLinkInput[],
  events: MetricClickEvent[],
  sinceMs: number,
): LinkClickSummary[] {
  const counts = new Map<string, number>();
  let totalLinkClicks = 0;

  for (const ev of events) {
    if (!ev.link_id) continue;
    if (Date.parse(ev.occurred_at) < sinceMs) continue;
    counts.set(ev.link_id, (counts.get(ev.link_id) ?? 0) + 1);
    totalLinkClicks += 1;
  }

  return [...links]
    .sort((a, b) => {
      const diff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
      return diff !== 0 ? diff : a.position - b.position;
    })
    .map((link) => {
      const clicks = counts.get(link.id) ?? 0;
      return {
        id: link.id,
        title: link.title,
        url: link.url,
        kind: link.kind,
        active: link.active,
        featured: link.featured,
        clicks,
        sharePct:
          totalLinkClicks > 0 ? Math.round((clicks / totalLinkClicks) * 100) : 0,
      };
    });
}

/**
 * Counts header/footer action events (WhatsApp, vCard contact, QR) since `sinceMs`.
 */
export function summarizeActionEvents(
  events: MetricClickEvent[],
  sinceMs: number,
): ActionBreakdown {
  const out: ActionBreakdown = { whatsapp: 0, contact: 0, qr: 0 };
  for (const ev of events) {
    if (Date.parse(ev.occurred_at) < sinceMs) continue;
    if (ev.event === "whatsapp") out.whatsapp += 1;
    else if (ev.event === "contact") out.contact += 1;
    else if (ev.event === "qr") out.qr += 1;
  }
  return out;
}
