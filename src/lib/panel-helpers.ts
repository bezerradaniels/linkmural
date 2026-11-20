import { z } from "zod";
import { parseHours, type DayKey, type Hours } from "./hours";
import { ICON_GROUPS, ICON_SYNONYMS, resolveIcon } from "./icons";

/*
 * Pure helpers for the client dashboard (Phase 3):
 * - Hours editor <-> pages.hours conversion
 * - Link reordering
 * - IconPicker search with synonyms
 * - Metrics number & delta formatting
 */

// ---------------------------------------------------------------------------
// Hours editor
// ---------------------------------------------------------------------------

export const DAY_ORDER: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_NAMES_PT: Record<DayKey, string> = {
  mon: "Segunda",
  tue: "Terça",
  wed: "Quarta",
  thu: "Quinta",
  fri: "Sexta",
  sat: "Sábado",
  sun: "Domingo",
};

export type TimeRange = { open: string; close: string };

export type DaySchedule = {
  enabled: boolean;
  ranges: TimeRange[];
};

export type HoursEditorState = Record<DayKey, DaySchedule>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function hoursToEditorState(raw: unknown): HoursEditorState {
  const parsed = parseHours(raw) ?? {};
  const state = {} as HoursEditorState;
  for (const day of DAY_ORDER) {
    const intervals = parsed[day] ?? [];
    state[day] = {
      enabled: intervals.length > 0,
      ranges:
        intervals.length > 0
          ? intervals.slice(0, 2).map(([open, close]) => ({ open, close }))
          : [{ open: "09:00", close: "18:00" }],
    };
  }
  return state;
}

/** Converts editor state back to pages.hours (null if every day is disabled). */
export function editorStateToHours(state: HoursEditorState): Hours | null {
  const out: Hours = {};
  let hasAny = false;
  for (const day of DAY_ORDER) {
    const entry = state[day];
    if (!entry?.enabled) continue;
    const validRanges = entry.ranges
      .slice(0, 2)
      .filter((r) => TIME_RE.test(r.open) && TIME_RE.test(r.close))
      .map((r) => [r.open, r.close] as [string, string]);
    if (validRanges.length > 0) {
      out[day] = validRanges;
      hasAny = true;
    }
  }
  return hasAny ? out : null;
}

// ---------------------------------------------------------------------------
// Page actions toggle schema
// ---------------------------------------------------------------------------

export const pageActionsSchema = z.object({
  whatsapp: z.boolean(),
  contact: z.boolean(),
  directions: z.boolean(),
});

// ---------------------------------------------------------------------------
// Reordering
// ---------------------------------------------------------------------------

export function reorderById<T extends { id: string }>(
  items: readonly T[],
  activeId: string,
  overId: string,
): T[] {
  if (activeId === overId) return [...items];
  const from = items.findIndex((i) => i.id === activeId);
  const to = items.findIndex((i) => i.id === overId);
  if (from < 0 || to < 0) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// ---------------------------------------------------------------------------
// IconPicker search with synonyms
// ---------------------------------------------------------------------------

const LINE_LABELS_PT: Record<string, string> = {
  phone: "Telefone",
  mail: "E-mail",
  map: "Endereço",
  contact: "Contato",
  calendar: "Agenda",
  shop: "Loja",
  menu: "Cardápio",
  catalog: "Catálogo",
  portfolio: "Portfólio",
  site: "Site",
  coupon: "Cupom",
  pdf: "PDF",
  ticket: "Ingresso",
  linkedin: "LinkedIn",
  kwai: "Kwai",
  reviews: "Avaliações",
  payment: "Pagamento",
  link: "Link",
};

export function iconLabel(ref: string): string {
  const resolved = resolveIcon(ref);
  if (resolved.type === "brand") return resolved.title;
  return LINE_LABELS_PT[resolved.name] ?? resolved.name;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type IconGroupResult = {
  group: string;
  icons: string[];
};

/**
 * Filters ICON_GROUPS by query using icon refs, Portuguese/brand labels and
 * ICON_SYNONYMS ("zap", "insta", "cardápio", etc.).
 */
export function filterIconGroups(query: string): IconGroupResult[] {
  const q = normalizeSearch(query);
  if (!q) {
    return Object.entries(ICON_GROUPS).map(([group, icons]) => ({
      group,
      icons,
    }));
  }

  const matchedSynonyms = new Set<string>();
  for (const [term, ref] of Object.entries(ICON_SYNONYMS)) {
    if (term.includes(q) || q.includes(term)) {
      matchedSynonyms.add(ref);
    }
  }

  const results: IconGroupResult[] = [];
  for (const [group, icons] of Object.entries(ICON_GROUPS)) {
    const groupMatch = normalizeSearch(group).includes(q);
    const filtered = icons.filter((ref) => {
      if (groupMatch || matchedSynonyms.has(ref)) return true;
      const slug = ref.split(":")[1] ?? "";
      const label = normalizeSearch(iconLabel(ref));
      return slug.includes(q) || label.includes(q);
    });
    if (filtered.length > 0) {
      results.push({ group, icons: filtered });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Metrics formatting
// ---------------------------------------------------------------------------

/** Formats counts cleanly in pt-BR (e.g. 1.250, 12,4 mil). */
export function formatMetricNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  const rounded = Math.round(n);
  if (rounded >= 10_000) {
    return new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(rounded);
  }
  return new Intl.NumberFormat("pt-BR").format(rounded);
}

/** Percentage delta vs previous period, or null when previous is 0 and current is 0. */
export function calcDeltaPercent(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function formatDelta(delta: number | null): string | null {
  if (delta === null) return null;
  if (delta === 0) return "0%";
  return delta > 0 ? `+${delta}%` : `${delta}%`;
}

/**
 * When the page WhatsApp number changes, returns the WhatsApp link URL
 * pointing to the new number (keeping any ?text= message), or null when the
 * link points to a different number and must be left alone.
 * Handles wa.me/<digits> and api.whatsapp.com/send?phone=<digits>.
 */
export function retargetWhatsappUrl(
  url: string,
  oldDigits: string,
  newDigits: string,
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "wa.me") {
    const current = parsed.pathname.replace(/\D/g, "");
    if (current !== oldDigits) return null;
    parsed.pathname = `/${newDigits}`;
    return parsed.toString();
  }
  if (host === "api.whatsapp.com" || host === "whatsapp.com") {
    const current = (parsed.searchParams.get("phone") ?? "").replace(/\D/g, "");
    if (current !== oldDigits) return null;
    parsed.searchParams.set("phone", newDigits);
    return parsed.toString();
  }
  return null;
}
