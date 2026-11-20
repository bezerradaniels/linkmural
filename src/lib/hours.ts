/*
 * Opening hours → "Aberto agora · até 22h" (docs/HANDOFF.md §7.2).
 * pages.hours: {"mon": [["08:00","18:00"]], "sat": [["09:00","13:00"]], ...}
 * A close time at or before the open time means it closes after midnight.
 * Always computed in America/Sao_Paulo.
 */

export const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAYS)[number];

const DAY_LABEL: Record<DayKey, string> = {
  sun: "dom",
  mon: "seg",
  tue: "ter",
  wed: "qua",
  thu: "qui",
  fri: "sex",
  sat: "sáb",
};

// Plain checks instead of zod: this module also runs in the browser
// (live status pill) and the public page must stay light.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export type Hours = Partial<Record<DayKey, [string, string][]>>;

export function parseHours(raw: unknown): Hours | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Hours = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!(DAYS as readonly string[]).includes(key)) return null;
    if (!Array.isArray(value) || value.length > 4) return null;
    for (const pair of value) {
      if (!Array.isArray(pair) || pair.length !== 2) return null;
      if (!pair.every((t) => typeof t === "string" && TIME_RE.test(t)))
        return null;
    }
    out[key as DayKey] = value as [string, string][];
  }
  return out;
}

export type OpenStatus = { open: boolean; label: string };

const TIME_ZONE = "America/Sao_Paulo";

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** 22:00 → "22h", 08:30 → "8h30", 00:00 → "meia-noite". */
export function formatTime(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  if (m === 0) return "meia-noite";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min ? `${h}h${String(min).padStart(2, "0")}` : `${h}h`;
}

/** Day of week index (0 = Sunday) and minutes since midnight in São Paulo. */
export function localNow(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function intervals(hours: Hours, day: number) {
  return (hours[DAYS[(day + 7) % 7]] ?? [])
    .map(([open, close]) => {
      const start = toMinutes(open);
      let end = toMinutes(close);
      if (end <= start) end += 1440; // closes after midnight
      return { start, end };
    })
    .sort((a, b) => a.start - b.start);
}

function closesAt(end: number) {
  return end >= 1440 && end % 1440 === 0 ? "meia-noite" : formatTime(end);
}

/** Status for the header pill, or null when there are no hours at all. */
export function openStatus(
  rawHours: unknown,
  now: Date = new Date(),
): OpenStatus | null {
  const hours = parseHours(rawHours);
  if (!hours) return null;
  const hasAny = DAYS.some((d) => (hours[d]?.length ?? 0) > 0);
  if (!hasAny) return null;

  const { day, minutes } = localNow(now);

  // Still inside yesterday's late-night interval?
  for (const i of intervals(hours, day - 1)) {
    if (i.end > 1440 && minutes < i.end - 1440) {
      return { open: true, label: `Aberto agora · até ${closesAt(i.end)}` };
    }
  }
  for (const i of intervals(hours, day)) {
    if (minutes >= i.start && minutes < i.end) {
      return { open: true, label: `Aberto agora · até ${closesAt(i.end)}` };
    }
  }

  // Next opening within the coming week.
  for (let offset = 0; offset < 7; offset++) {
    const next = intervals(hours, day + offset).find(
      (i) => offset > 0 || i.start > minutes,
    );
    if (next) {
      const when =
        offset === 0
          ? "hoje"
          : offset === 1
            ? "amanhã"
            : DAY_LABEL[DAYS[(day + offset) % 7]];
      return {
        open: false,
        label: `Fechado · abre ${when} às ${formatTime(next.start)}`,
      };
    }
  }
  return { open: false, label: "Fechado" };
}
