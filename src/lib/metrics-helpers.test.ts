import { describe, expect, it } from "vitest";
import {
  summarizeActionEvents,
  summarizeLinkClicks,
  type MetricClickEvent,
  type MetricLinkInput,
} from "./metrics-helpers";

const LINKS: MetricLinkInput[] = [
  {
    id: "l1",
    title: "Instagram",
    url: "https://instagram.com/loja",
    kind: "link",
    active: true,
    featured: false,
    position: 0,
  },
  {
    id: "l2",
    title: "Cardápio",
    url: "https://loja.com/cardapio",
    kind: "link",
    active: true,
    featured: true,
    position: 1,
  },
  {
    id: "l3",
    title: "Site antigo",
    url: "https://antigo.com",
    kind: "link",
    active: false,
    featured: false,
    position: 2,
  },
];

const BASE = Date.parse("2026-11-21T12:00:00Z");
const DAY = 86_400_000;

const EVENTS: MetricClickEvent[] = [
  { link_id: "l2", event: "click", occurred_at: new Date(BASE - DAY).toISOString() },
  { link_id: "l2", event: "click", occurred_at: new Date(BASE - 2 * DAY).toISOString() },
  { link_id: "l2", event: "click", occurred_at: new Date(BASE - 3 * DAY).toISOString() },
  { link_id: "l1", event: "click", occurred_at: new Date(BASE - DAY).toISOString() },
  // Outside 7-day window
  { link_id: "l1", event: "click", occurred_at: new Date(BASE - 10 * DAY).toISOString() },
  // Action events (no link_id)
  { link_id: null, event: "whatsapp", occurred_at: new Date(BASE - DAY).toISOString() },
  { link_id: null, event: "contact", occurred_at: new Date(BASE - DAY).toISOString() },
  { link_id: null, event: "qr", occurred_at: new Date(BASE - 2 * DAY).toISOString() },
  { link_id: null, event: "qr", occurred_at: new Date(BASE - 12 * DAY).toISOString() },
];

describe("summarizeLinkClicks", () => {
  it("counts and sorts links by clicks descending within the window", () => {
    const res = summarizeLinkClicks(LINKS, EVENTS, BASE - 7 * DAY);
    expect(res.map((r) => [r.id, r.clicks, r.sharePct])).toEqual([
      ["l2", 3, 75],
      ["l1", 1, 25],
      ["l3", 0, 0],
    ]);
  });

  it("returns 0% share when there are no clicks", () => {
    const res = summarizeLinkClicks(LINKS, [], BASE - 7 * DAY);
    expect(res.every((r) => r.clicks === 0 && r.sharePct === 0)).toBe(true);
  });
});

describe("summarizeActionEvents", () => {
  it("counts whatsapp, contact, and qr events within the window", () => {
    expect(summarizeActionEvents(EVENTS, BASE - 7 * DAY)).toEqual({
      whatsapp: 1,
      contact: 1,
      qr: 1,
    });
  });
});
