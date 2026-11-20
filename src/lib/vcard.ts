import { phoneDigits } from "./public-actions";
import type { PublicPage } from "./public-page";

/** Escapes a vCard 3.0 text value (RFC 2426 §4). */
export function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Folds lines longer than 75 octets, as vCard requires. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const len = new TextEncoder().encode(char).length;
    if (size + len > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += len;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** "Salvar contato": vCard 3.0 with name, phone, e-mail, site, address and photo URL. */
export function buildVCard(page: PublicPage, pageUrl: string): string {
  const name = page.business_name.trim() || page.slug;
  const digits = phoneDigits(page.phone) ?? phoneDigits(page.whatsapp);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(name)}`,
    `N:${escapeVCard(name)};;;;`,
    `ORG:${escapeVCard(name)}`,
    page.kind && `TITLE:${escapeVCard(page.kind)}`,
    digits && `TEL;TYPE=CELL,VOICE:+${digits}`,
    page.email && `EMAIL;TYPE=INTERNET:${escapeVCard(page.email)}`,
    `URL:${pageUrl}`,
    (page.address || page.city) &&
      `ADR;TYPE=WORK:;;${escapeVCard(page.address ?? "")};${escapeVCard(page.city ?? "")};;;Brasil`,
    page.avatarUrl && `PHOTO;VALUE=URI:${page.avatarUrl}`,
    page.bio && `NOTE:${escapeVCard(page.bio)}`,
    "END:VCARD",
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n") + "\r\n";
}
