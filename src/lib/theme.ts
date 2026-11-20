import { z } from "zod";
import {
  bestOn,
  contrast,
  ensureContrast,
  isHex,
  luminance,
  mix,
} from "./color";
import { planInfo, type Plan } from "./plans";
import {
  CARD_SIZES,
  DEFAULT_STYLE,
  FONTS,
  RADIUS,
  STYLES,
  type CardFill,
  type CardSize,
  type FontName,
  type Palette,
  type StyleKey,
} from "./styles";

/** pages.theme (docs/HANDOFF.md §7.3). Fields marked Pro+ are ignored on Free. */
export const themeSchema = z.object({
  font: z.enum(FONTS).optional(), // Pro+
  palette: z.enum(["style", "custom"]).optional(), // Pro+
  accent: z.string().refine(isHex).optional(), // Pro+, with palette = custom
  background: z.string().refine(isHex).optional(), // Pro+, with palette = custom
  cardSize: z.enum(["compact", "regular", "large"]).optional(), // Pro+
  cardFill: z.enum(["solid", "outline", "tint", "accent"]).optional(), // Pro+
  radius: z.number().min(RADIUS.min).max(RADIUS.max).optional(), // Pro+
  iconColor: z.enum(["brand", "style"]).optional(), // all plans
});

export type Theme = z.infer<typeof themeSchema>;

/** Keeps only valid fields; anything malformed is dropped, never thrown. */
export function parseTheme(raw: unknown): Theme {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  const shape = themeSchema.shape;
  for (const [key, value] of Object.entries(raw)) {
    const field = shape[key as keyof typeof shape];
    if (field && field.safeParse(value).success) out[key] = value;
  }
  return out as Theme;
}

export type ResolvedTheme = {
  style: StyleKey;
  font: FontName;
  palette: Palette;
  cardSize: CardSize;
  cardFill: CardFill;
  radius: number;
  iconColor: "brand" | "style";
  /** CSS custom properties for the page root. */
  vars: Record<`--${string}`, string>;
};

const LIGHT_INK = "#F4F4F5";
const DARK_INK = "#151515";

/** Palette from a custom background and accent, with readable text. */
export function customPalette(background: string, accent: string): Palette {
  const bg = background;
  const ink = bestOn(bg, [DARK_INK, LIGHT_INK]);
  const dark = ink === LIGHT_INK;
  const extreme = dark ? "#FFFFFF" : "#000000";
  let surface = dark
    ? mix(bg, "#FFFFFF", 0.08)
    : luminance(bg) > 0.92
      ? "#FFFFFF"
      : mix(bg, "#FFFFFF", 0.65);
  // Mid-tone backgrounds: a lighter surface can sink below 4.5:1 for light
  // text. Then cards share the page background (solid cards get a border).
  if (contrast(extreme, surface) < 4.5) surface = bg;
  const finalInk = ensureContrast(ink, [bg, surface], extreme);
  // Prefer the softer #111111; pure black or white always reaches 4.5:1.
  const soft = bestOn(accent, ["#FFFFFF", "#111111"]);
  const onAccent =
    contrast(soft, accent) >= 4.5
      ? soft
      : bestOn(accent, ["#FFFFFF", "#000000"]);
  return {
    bg,
    surface,
    ink: finalInk,
    muted: ensureContrast(
      dark ? "#B4B4BC" : "#55555A",
      [bg, surface],
      finalInk,
    ),
    accent,
    onAccent,
    line: dark ? mix(bg, "#FFFFFF", 0.16) : mix(bg, "#000000", 0.12),
    soft: dark ? mix(bg, "#FFFFFF", 0.12) : mix(bg, "#000000", 0.06),
  };
}

function isStyle(value: unknown): value is StyleKey {
  return typeof value === "string" && value in STYLES;
}

/**
 * Turns a style + page theme + plan into everything the public page needs.
 * The plan rule lives here, not in the UI: on Free the Pro+ fields are ignored.
 */
export function resolveTheme(
  styleKey: string | null | undefined,
  rawTheme: unknown,
  plan: Plan | null | undefined,
): ResolvedTheme {
  const style = isStyle(styleKey) ? styleKey : DEFAULT_STYLE;
  const base = STYLES[style];
  const theme = parseTheme(rawTheme);
  const paid = planInfo(plan).customTheme;

  const palette: Palette =
    paid && theme.palette === "custom"
      ? customPalette(theme.background ?? "#FFFFFF", theme.accent ?? "#5B3FFF")
      : { ...base.palette };

  const font: FontName = (paid && theme.font) || base.font;
  const cardSize: CardSize = (paid && theme.cardSize) || "regular";
  const cardFill: CardFill = (paid && theme.cardFill) || "solid";
  const radius =
    paid && theme.radius !== undefined ? theme.radius : RADIUS.default;
  const iconColor = theme.iconColor ?? "brand";
  const size = CARD_SIZES[cardSize];

  const card = cardColors(palette, cardFill);
  const px = (n: number) => `${Math.round(n * 10) / 10}px`;

  return {
    style,
    font,
    palette,
    cardSize,
    cardFill,
    radius,
    iconColor,
    vars: {
      "--bg": palette.bg,
      "--surface": palette.surface,
      "--ink": palette.ink,
      "--muted": palette.muted,
      "--accent": palette.accent,
      "--on-accent": palette.onAccent,
      "--line": palette.line,
      "--soft": palette.soft,
      "--accent-on-bg":
        contrast(palette.accent, palette.bg) >= 3
          ? palette.accent
          : palette.ink,
      "--chip-on-accent":
        palette.onAccent.toUpperCase() === "#FFFFFF"
          ? "rgba(255,255,255,0.2)"
          : "rgba(0,0,0,0.1)",
      "--r": px(radius),
      "--r-big": px(radius + 6),
      "--r-logo": px(Math.min(radius + 4, 32)),
      "--card-bg": card.bg,
      "--card-border": card.border,
      "--card-ink": card.ink,
      "--card-muted": card.muted,
      "--card-icon-bg": card.iconBg,
      "--card-icon-ink": card.iconInk,
      "--card-py": px(size.py),
      "--card-px": px(size.padX),
      "--card-icon": px(size.icon),
      "--card-icon-r": px(Math.min(radius * 0.7, size.icon / 2)),
      "--card-title": px(size.title),
      "--card-sub": px(size.sub),
      "--card-gap": px(size.gap),
      "--card-tile": px(size.tile),
    },
  };
}

function cardColors(p: Palette, fill: CardFill) {
  switch (fill) {
    case "outline":
      return {
        bg: "transparent",
        border: p.line,
        ink: p.ink,
        muted: p.muted,
        iconBg: p.soft,
        iconInk: p.ink,
      };
    case "tint":
      return {
        bg: mix(p.bg, p.accent, 0.14),
        border: "transparent",
        ink: p.ink,
        muted: ensureContrast(p.muted, [mix(p.bg, p.accent, 0.14)], p.ink),
        iconBg: mix(p.bg, p.accent, 0.3),
        iconInk: p.ink,
      };
    case "accent":
      return {
        bg: p.accent,
        border: "transparent",
        ink: p.onAccent,
        muted: p.onAccent,
        iconBg: mix(p.accent, p.onAccent, 0.14),
        iconInk: p.onAccent,
      };
    default:
      return {
        bg: p.surface,
        border: contrast(p.surface, p.bg) < 1.08 ? p.line : "transparent",
        ink: p.ink,
        muted: p.muted,
        iconBg: p.soft,
        iconInk: p.ink,
      };
  }
}
