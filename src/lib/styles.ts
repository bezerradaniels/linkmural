/**
 * The 8 public page styles. Source: design/styles.json (keep in sync).
 * A style sets the font and palette; paid plans can override them with pages.theme.
 */

export type Palette = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
  line: string;
  soft: string;
};

export const FONTS = [
  "Inter",
  "DM Sans",
  "Plus Jakarta Sans",
  "Space Grotesk",
  "Sora",
  "Fraunces",
] as const;
export type FontName = (typeof FONTS)[number];

export const STYLES = {
  sport: {
    label: "Sport",
    font: "Space Grotesk",
    palette: {
      bg: "#0F1012",
      surface: "#1B1C20",
      ink: "#F4F4F5",
      muted: "#A1A1AA",
      accent: "#C8F25A",
      onAccent: "#0F1012",
      line: "#2E2F35",
      soft: "#26272C",
    },
  },
  calm: {
    label: "Calm",
    font: "Plus Jakarta Sans",
    palette: {
      bg: "#F2F5F9",
      surface: "#FFFFFF",
      ink: "#0E2148",
      muted: "#55607A",
      accent: "#2563EB",
      onAccent: "#FFFFFF",
      line: "#DCE3EE",
      soft: "#E8EEF8",
    },
  },
  classic: {
    label: "Classic",
    font: "Fraunces",
    palette: {
      bg: "#F6F4EF",
      surface: "#FFFFFF",
      ink: "#1C1C1A",
      muted: "#5F5A52",
      accent: "#2D4A3E",
      onAccent: "#FFFFFF",
      line: "#E2DDD3",
      soft: "#EFEBE3",
    },
  },
  pop: {
    label: "Pop",
    font: "Sora",
    palette: {
      bg: "#FFF6EE",
      surface: "#FFFFFF",
      ink: "#1A1A1A",
      muted: "#5E5650",
      accent: "#FF6A3D",
      onAccent: "#1A1A1A",
      line: "#F1E1D3",
      soft: "#FCEADC",
    },
  },
  bold: {
    label: "Bold",
    font: "Space Grotesk",
    palette: {
      bg: "#FFFFFF",
      surface: "#F2F2F2",
      ink: "#111111",
      muted: "#5E5E5E",
      accent: "#FF6B00",
      onAccent: "#111111",
      line: "#EBEBEB",
      soft: "#ECECEC",
    },
  },
  fresh: {
    label: "Fresh",
    font: "DM Sans",
    palette: {
      bg: "#EEF0F3",
      surface: "#FFFFFF",
      ink: "#111111",
      muted: "#5E5E5E",
      accent: "#D9F24F",
      onAccent: "#111111",
      line: "#DADDE2",
      soft: "#E4E7EB",
    },
  },
  zen: {
    label: "Zen",
    font: "DM Sans",
    palette: {
      bg: "#F4F2EC",
      surface: "#FFFFFF",
      ink: "#1C1C1A",
      muted: "#6B645B",
      accent: "#C9DB9F",
      onAccent: "#1C1C1A",
      line: "#E2DDD3",
      soft: "#ECE8E0",
    },
  },
  dark: {
    label: "Dark",
    font: "Sora",
    palette: {
      bg: "#111214",
      surface: "#1C1D21",
      ink: "#F2F2F2",
      muted: "#A1A1AA",
      accent: "#A78BFA",
      onAccent: "#111214",
      line: "#2E2F35",
      soft: "#26272C",
    },
  },
} as const satisfies Record<
  string,
  { label: string; font: FontName; palette: Palette }
>;

export type StyleKey = keyof typeof STYLES;
export const STYLE_KEYS = Object.keys(STYLES) as StyleKey[];
export const DEFAULT_STYLE: StyleKey = "classic";

export const CARD_SIZES = {
  compact: {
    label: "Compacto",
    py: 10,
    padX: 14,
    icon: 36,
    title: 14,
    sub: 12,
    gap: 8,
    tile: 104,
  },
  regular: {
    label: "Regular",
    py: 14,
    padX: 16,
    icon: 44,
    title: 16,
    sub: 13,
    gap: 10,
    tile: 128,
  },
  large: {
    label: "Grande",
    py: 20,
    padX: 18,
    icon: 56,
    title: 18,
    sub: 14,
    gap: 12,
    tile: 160,
  },
} as const;
export type CardSize = keyof typeof CARD_SIZES;

export const CARD_FILLS = {
  solid: "Sólido",
  outline: "Contorno",
  tint: "Tinta",
  accent: "Destaque",
} as const;
export type CardFill = keyof typeof CARD_FILLS;

export const RADIUS = { min: 0, max: 32, step: 2, default: 20 } as const;

export const TEMPLATES = {
  balcao: "Balcão",
  mosaico: "Mosaico",
  cartao: "Cartão",
} as const;
export type TemplateKey = keyof typeof TEMPLATES;
