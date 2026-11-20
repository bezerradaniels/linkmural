import rawCities from "./br-cities.json";

/*
 * Brazilian phone/WhatsApp input mask (locked to 11 digits) and
 * complete IBGE list of all 5,571 Brazilian municipalities for autocomplete.
 */

/**
 * Formats a Brazilian phone number with a strict 11-digit lock:
 * - 10 digits: (11) 3333-4444
 * - 11 digits: (11) 99999-8888
 * Strips a leading country code 55 when loading 12–13 digit stored values.
 */
export function formatBrPhoneMask(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (
    digits.startsWith("55") &&
    (digits.length === 12 || digits.length === 13)
  ) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export const BR_CITIES: readonly string[] = rawCities;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

let indexedCities: { label: string; norm: string }[] | null = null;

function getIndexedCities() {
  if (!indexedCities) {
    indexedCities = BR_CITIES.map((label) => ({
      label,
      norm: normalizeText(label),
    }));
  }
  return indexedCities;
}

/** Accent-insensitive search across all 5,571 Brazilian municipalities (IBGE). */
export function searchBrCities(query: string, limit = 8): string[] {
  const q = normalizeText(query);
  if (!q) return [];

  const starts: string[] = [];
  const contains: string[] = [];

  for (const city of getIndexedCities()) {
    if (city.norm === q) continue;
    if (city.norm.startsWith(q)) {
      starts.push(city.label);
      if (starts.length >= limit) break;
    } else if (contains.length < limit && city.norm.includes(q)) {
      contains.push(city.label);
    }
  }

  return [...starts, ...contains].slice(0, limit);
}
