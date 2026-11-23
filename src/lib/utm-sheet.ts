import { buildUrlWithUtm, normalizeUtmValue } from "@/lib/utm";

export type UtmSheetRow = {
  id: string;
  label: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  createdAt: string;
};

export type UtmPreset = {
  id: string;
  label: string;
  source: string;
  medium: string;
  hint: string;
};

export const UTM_PRESETS: UtmPreset[] = [
  {
    id: "ig-bio",
    label: "Instagram Bio",
    source: "instagram",
    medium: "bio",
    hint: "Link principal no perfil",
  },
  {
    id: "ig-stories",
    label: "Instagram Stories",
    source: "instagram",
    medium: "stories",
    hint: "Adesivo de link nos Stories",
  },
  {
    id: "ig-reels",
    label: "Instagram Reels",
    source: "instagram",
    medium: "reels",
    hint: "CTA na legenda ou comentário",
  },
  {
    id: "meta-ads",
    label: "Meta Ads",
    source: "meta_ads",
    medium: "cpc",
    hint: "Tráfego pago no Facebook/Instagram",
  },
  {
    id: "google-ads",
    label: "Google Ads",
    source: "google",
    medium: "cpc",
    hint: "Pesquisa, Display ou Performance Max",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    source: "whatsapp",
    medium: "mensagem",
    hint: "Grupos, listas ou atendimento",
  },
  {
    id: "email",
    label: "E-mail",
    source: "email",
    medium: "newsletter",
    hint: "Disparos e automações",
  },
  {
    id: "tiktok",
    label: "TikTok",
    source: "tiktok",
    medium: "bio",
    hint: "Perfil ou vídeo no TikTok",
  },
  {
    id: "youtube",
    label: "YouTube",
    source: "youtube",
    medium: "descricao",
    hint: "Descrição ou comentário fixado",
  },
  {
    id: "qrcode",
    label: "QR Code",
    source: "qrcode",
    medium: "impresso",
    hint: "Cartões, balcão ou eventos",
  },
];

export const UTM_SHEET_STORAGE_KEY = "lm_public_utm_sheet_v1";

/** Builds the final URL for a spreadsheet row, or returns empty string if invalid. */
export function computeRowUrl(row: Omit<UtmSheetRow, "id" | "label" | "createdAt">): string {
  return (
    buildUrlWithUtm(row.baseUrl, {
      source: row.source,
      medium: row.medium,
      campaign: row.campaign,
      content: row.content,
      term: row.term,
    }) ?? ""
  );
}

const SHEET_HEADERS = [
  "Rótulo",
  "URL Final",
  "URL Base",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function rowValues(row: UtmSheetRow): string[] {
  return [
    row.label,
    computeRowUrl(row),
    row.baseUrl,
    normalizeUtmValue(row.source),
    normalizeUtmValue(row.medium),
    normalizeUtmValue(row.campaign),
    normalizeUtmValue(row.content),
    normalizeUtmValue(row.term),
  ];
}

function escapeCsvCell(value: string): string {
  const safe = value.replace(/\r?\n/g, " ");
  if (/[",;\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/** Exports rows to UTF-8 BOM CSV compatible with Excel and Google Sheets. */
export function rowsToCsv(rows: ReadonlyArray<UtmSheetRow>): string {
  const lines = [
    SHEET_HEADERS.map(escapeCsvCell).join(","),
    ...rows.map((row) => rowValues(row).map(escapeCsvCell).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

function escapeTsvCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").trim();
}

/** Exports rows to TSV so users can paste directly into Google Sheets or Excel. */
export function rowsToTsv(rows: ReadonlyArray<UtmSheetRow>): string {
  const lines = [
    SHEET_HEADERS.join("\t"),
    ...rows.map((row) => rowValues(row).map(escapeTsvCell).join("\t")),
  ];
  return lines.join("\n");
}

/** Safely parses rows stored in localStorage. */
export function parseStoredRows(raw: string | null): UtmSheetRow[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => {
        return typeof item === "object" && item !== null;
      })
      .map((item, idx) => ({
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : `row-${idx}`,
        label: typeof item.label === "string" ? item.label : "",
        baseUrl: typeof item.baseUrl === "string" ? item.baseUrl : "",
        source: typeof item.source === "string" ? item.source : "",
        medium: typeof item.medium === "string" ? item.medium : "",
        campaign: typeof item.campaign === "string" ? item.campaign : "",
        content: typeof item.content === "string" ? item.content : "",
        term: typeof item.term === "string" ? item.term : "",
        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date(0).toISOString(),
      }))
      .filter((r) => r.baseUrl.trim().length > 0);
  } catch {
    return [];
  }
}
