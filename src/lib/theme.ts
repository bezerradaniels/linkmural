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
  BG_DOODLES,
  BG_GRADIENTS,
  BG_IMAGE_PRESETS,
  CARD_SIZES,
  DEFAULT_STYLE,
  FONTS,
  LOGO_SIZES,
  RADIUS,
  STYLES,
  TEMPLATE_DEFAULTS,
  TEMPLATES,
  type BgDoodleKey,
  type BgGradientKey,
  type BgImagePresetKey,
  type BgType,
  type CardEffect,
  type CardFill,
  type CardSize,
  type CoverHeightKey,
  type CoverStyleKey,
  type FontName,
  type HeaderAlignKey,
  type LogoShapeKey,
  type LogoSizeKey,
  type Palette,
  type StyleKey,
  type TemplateKey,
} from "./styles";

const GRADIENT_KEYS = Object.keys(BG_GRADIENTS) as [
  BgGradientKey,
  ...BgGradientKey[],
];
const DOODLE_KEYS = Object.keys(BG_DOODLES) as [BgDoodleKey, ...BgDoodleKey[]];
const IMAGE_PRESET_KEYS = Object.keys(BG_IMAGE_PRESETS) as [
  BgImagePresetKey,
  ...BgImagePresetKey[],
];

/**
 * pages.theme:
 * - Free: font, palette/background/accent, bgType (solid|gradient), bgGradient, iconColor,
 *         plus header customization (coverHeight, coverStyle, logoShape, logoSize, headerAlign).
 * - Pro+: doodles/image backgrounds, cardEffect (glass|glossy), cardSize, cardFill, radius
 */
export const themeSchema = z.object({
  font: z.enum(FONTS).optional(), // all plans
  palette: z.enum(["style", "custom"]).optional(), // all plans
  accent: z.string().refine(isHex).optional(), // all plans, with palette = custom
  background: z.string().refine(isHex).optional(), // all plans, with palette = custom
  bgType: z.enum(["solid", "gradient", "doodles", "image"]).optional(), // solid|gradient all plans; doodles|image Pro+
  bgGradient: z.enum(GRADIENT_KEYS).optional(), // all plans
  bgDoodle: z.enum(DOODLE_KEYS).optional(), // Pro+
  bgImage: z.enum(IMAGE_PRESET_KEYS).optional(), // Pro+
  coverHeight: z.enum(["compact", "regular", "tall"]).optional(), // all plans
  coverStyle: z.enum(["clean", "fade", "tint"]).optional(), // all plans
  logoShape: z.enum(["rounded", "circle", "square"]).optional(), // all plans
  logoSize: z.enum(["sm", "md", "lg"]).optional(), // all plans
  headerAlign: z.enum(["left", "center"]).optional(), // all plans
  cardEffect: z.enum(["none", "glass", "glossy"]).optional(), // Pro+
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
  bgType: BgType;
  bgGradient: BgGradientKey;
  bgDoodle: BgDoodleKey;
  bgImage: BgImagePresetKey;
  bgCss: string;
  coverHeight: CoverHeightKey;
  coverStyle: CoverStyleKey;
  logoShape: LogoShapeKey;
  logoSize: LogoSizeKey;
  logoPx: number;
  headerAlign: HeaderAlignKey;
  cardEffect: CardEffect;
  cardSize: CardSize;
  cardFill: CardFill;
  radius: number;
  iconColor: "brand" | "style";
  /** True when the owner's plan allows Bento resizing (1x1 / 2x2). */
  allowBentoResize: boolean;
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

function isTemplate(value: unknown): value is TemplateKey {
  return typeof value === "string" && value in TEMPLATES;
}

/**
 * Turns a style + page theme + plan (+ optional template) into everything the public page needs.
 * The plan rule lives here, not in the UI: on Free the Pro+ fields are ignored.
 */
export function resolveTheme(
  styleKey: string | null | undefined,
  rawTheme: unknown,
  plan: Plan | null | undefined,
  templateKey?: string | null,
): ResolvedTheme {
  const style = isStyle(styleKey) ? styleKey : DEFAULT_STYLE;
  const tpl = isTemplate(templateKey) ? templateKey : "balcao";
  const tplDefaults = TEMPLATE_DEFAULTS[tpl];
  const base = STYLES[style];
  const theme = parseTheme(rawTheme);
  const paid = planInfo(plan).customTheme;

  // Background type: Free gets solid & gradient; Pro+ unlocks doodles & image.
  const requestedBgType = theme.bgType ?? "solid";
  const bgType: BgType =
    !paid && (requestedBgType === "doodles" || requestedBgType === "image")
      ? "solid"
      : requestedBgType;
  const bgGradient: BgGradientKey = theme.bgGradient ?? "aurora";
  const bgDoodle: BgDoodleKey = theme.bgDoodle ?? "dots";
  const bgImage: BgImagePresetKey = theme.bgImage ?? "mesh-lime";

  // Accent can be customized on all plans; background hex follows solid/doodle or preset baseHex.
  const customAccent =
    theme.palette === "custom" ? theme.accent : base.palette.accent;
  let palette: Palette;
  let bgCss: string;

  if (bgType === "gradient") {
    const grad = BG_GRADIENTS[bgGradient];
    palette = customPalette(grad.baseHex, customAccent ?? base.palette.accent);
    bgCss = grad.css;
  } else if (bgType === "image") {
    const img = BG_IMAGE_PRESETS[bgImage];
    palette = customPalette(img.baseHex, customAccent ?? base.palette.accent);
    bgCss = img.css;
  } else if (theme.palette === "custom") {
    palette = customPalette(
      theme.background ?? base.palette.bg,
      theme.accent ?? base.palette.accent,
    );
    bgCss = palette.bg;
  } else {
    palette = { ...base.palette };
    bgCss = palette.bg;
  }

  // Header (Logo & Cover) settings fall back to the chosen template's defaults
  const coverHeight: CoverHeightKey =
    theme.coverHeight ?? tplDefaults.header.coverHeight;
  const coverStyle: CoverStyleKey =
    theme.coverStyle ?? tplDefaults.header.coverStyle;
  const logoShape: LogoShapeKey =
    theme.logoShape ?? tplDefaults.header.logoShape;
  const logoSize: LogoSizeKey = theme.logoSize ?? tplDefaults.header.logoSize;
  const logoPx = LOGO_SIZES[logoSize].px;
  const headerAlign: HeaderAlignKey =
    theme.headerAlign ?? tplDefaults.header.headerAlign;

  // Link card visual settings (Pro+ overrides template defaults)
  const font: FontName = theme.font ?? base.font;
  const cardEffect: CardEffect =
    (paid && theme.cardEffect) || tplDefaults.cards.cardEffect;
  const cardSize: CardSize =
    (paid && theme.cardSize) || tplDefaults.cards.cardSize;
  const cardFill: CardFill =
    (paid && theme.cardFill) || tplDefaults.cards.cardFill;
  const radius =
    paid && theme.radius !== undefined
      ? theme.radius
      : tplDefaults.cards.radius;
  const iconColor = theme.iconColor ?? "brand";
  const size = CARD_SIZES[cardSize];

  const card = cardColors(palette, cardFill, cardEffect);
  const px = (n: number) => `${Math.round(n * 10) / 10}px`;
  const logoRadiusCss =
    logoShape === "circle"
      ? "9999px"
      : logoShape === "square"
        ? "6px"
        : px(Math.min(radius + 4, 24));

  return {
    style,
    font,
    palette,
    bgType,
    bgGradient,
    bgDoodle,
    bgImage,
    bgCss,
    coverHeight,
    coverStyle,
    logoShape,
    logoSize,
    logoPx,
    headerAlign,
    cardEffect,
    cardSize,
    cardFill,
    radius,
    iconColor,
    allowBentoResize: paid,
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
      "--r-logo": logoRadiusCss,
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

function cardColors(p: Palette, fill: CardFill, effect: CardEffect) {
  if (effect === "glass") {
    const dark = luminance(p.bg) < 0.35;
    return {
      bg: dark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.62)",
      border: dark ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.78)",
      ink: p.ink,
      muted: p.muted,
      iconBg: dark ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.82)",
      iconInk: p.ink,
    };
  }

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
