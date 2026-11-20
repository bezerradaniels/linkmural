import { describe, expect, it } from "vitest";
import { contrast } from "./color";
import { STYLE_KEYS, STYLES } from "./styles";
import { customPalette, parseTheme, resolveTheme } from "./theme";

const MIN = 4.5;

describe("style palettes", () => {
  it.each(STYLE_KEYS)("%s has readable text everywhere", (key) => {
    const p = STYLES[key].palette;
    expect(contrast(p.ink, p.bg)).toBeGreaterThanOrEqual(MIN);
    expect(contrast(p.ink, p.surface)).toBeGreaterThanOrEqual(MIN);
    expect(contrast(p.muted, p.bg)).toBeGreaterThanOrEqual(MIN);
    expect(contrast(p.muted, p.surface)).toBeGreaterThanOrEqual(MIN);
    expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(MIN);
  });

  it.each(STYLE_KEYS)("%s keeps card text readable in every fill", (key) => {
    for (const cardFill of ["solid", "outline", "tint", "accent"] as const) {
      const { vars } = resolveTheme(key, { cardFill }, "pro");
      const cardBg =
        vars["--card-bg"] === "transparent" ? vars["--bg"] : vars["--card-bg"];
      expect(
        contrast(vars["--card-ink"], cardBg),
        cardFill,
      ).toBeGreaterThanOrEqual(MIN);
      expect(
        contrast(vars["--card-muted"], cardBg),
        cardFill,
      ).toBeGreaterThanOrEqual(MIN);
    }
  });
});

describe("custom palette", () => {
  // Deterministic pseudo-random colors so failures are reproducible.
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
  const color = () =>
    "#" +
    Array.from({ length: 3 }, () =>
      Math.floor(rand() * 256)
        .toString(16)
        .padStart(2, "0"),
    ).join("");

  it("always meets 4.5:1 for text, muted text and text on the accent", () => {
    for (let i = 0; i < 500; i++) {
      const bg = color();
      const accent = color();
      const p = customPalette(bg, accent);
      const label = `bg ${bg} accent ${accent}`;
      expect(contrast(p.ink, p.bg), label).toBeGreaterThanOrEqual(MIN);
      expect(contrast(p.ink, p.surface), label).toBeGreaterThanOrEqual(MIN);
      expect(contrast(p.muted, p.bg), label).toBeGreaterThanOrEqual(MIN);
      expect(contrast(p.muted, p.surface), label).toBeGreaterThanOrEqual(MIN);
      expect(contrast(p.onAccent, p.accent), label).toBeGreaterThanOrEqual(MIN);
    }
  });
});

describe("resolveTheme and plans", () => {
  const paidTheme = {
    font: "Inter",
    palette: "custom",
    accent: "#FF0000",
    background: "#000000",
    cardSize: "large",
    cardFill: "outline",
    radius: 8,
    iconColor: "style",
  };

  it("ignores Pro+ fields on Free but keeps the icon color", () => {
    const t = resolveTheme("calm", paidTheme, "free");
    expect(t.font).toBe("Plus Jakarta Sans");
    expect(t.palette).toEqual(STYLES.calm.palette);
    expect(t.cardSize).toBe("regular");
    expect(t.cardFill).toBe("solid");
    expect(t.radius).toBe(20);
    expect(t.iconColor).toBe("style");
  });

  it("applies Pro+ fields on paid plans", () => {
    const t = resolveTheme("calm", paidTheme, "pro");
    expect(t.font).toBe("Inter");
    expect(t.palette.bg).toBe("#000000");
    expect(t.cardSize).toBe("large");
    expect(t.cardFill).toBe("outline");
    expect(t.vars["--r"]).toBe("8px");
  });

  it("falls back to Classic for an unknown style", () => {
    expect(resolveTheme("nope", {}, "free").style).toBe("classic");
    expect(resolveTheme(null, null, null).font).toBe("Fraunces");
  });

  it("drops malformed theme fields instead of failing", () => {
    expect(
      parseTheme({
        font: "Comic Sans",
        radius: 99,
        accent: "red",
        cardFill: "tint",
        extra: 1,
      }),
    ).toEqual({ cardFill: "tint" });
    expect(parseTheme("oops")).toEqual({});
  });
});
