import { describe, expect, it } from "vitest";
import { demoPage } from "./demo-page";
import { buildVCard, escapeVCard } from "./vcard";

describe("vCard", () => {
  it("escapes special characters", () => {
    expect(escapeVCard("Bar; Café, e\\ outros\nlinha")).toBe(
      "Bar\\; Café\\, e\\\\ outros\\nlinha",
    );
  });

  it("builds a vCard 3.0 with the page contact data", () => {
    const card = buildVCard(demoPage(), "https://linkmural.com/studioforca");
    expect(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(card).toContain("FN:Studio Força\r\n");
    expect(card).toContain("TEL;TYPE=CELL,VOICE:+5511999990000\r\n");
    expect(card).toContain("URL:https://linkmural.com/studioforca\r\n");
    expect(card).toContain("TITLE:Academia · Treino funcional\r\n");
    expect(card.endsWith("END:VCARD\r\n")).toBe(true);
  });

  it("leaves out fields the page does not have", () => {
    const page = {
      ...demoPage(),
      whatsapp: null,
      email: null,
      city: null,
      address: null,
      bio: null,
    };
    const card = buildVCard(page, "https://linkmural.com/x");
    expect(card).not.toMatch(/TEL|EMAIL|ADR|NOTE/);
  });

  it("folds long lines at 75 octets", () => {
    const page = { ...demoPage(), bio: "á".repeat(120) };
    const lines = buildVCard(page, "https://linkmural.com/x").split("\r\n");
    for (const line of lines)
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(lines.some((l) => l.startsWith(" "))).toBe(true);
  });
});
