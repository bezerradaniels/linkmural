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

export const LINK_SIZES = {
  "2x1": "Barra (2×1)",
  "1x1": "Quadrado (1×1)",
  "2x2": "Grande (2×2)",
} as const;
export type LinkSize = keyof typeof LINK_SIZES;

export const BG_TYPES = ["solid", "gradient", "doodles", "image"] as const;
export type BgType = (typeof BG_TYPES)[number];

export const BG_GRADIENTS = {
  aurora: {
    label: "Aurora",
    css: "linear-gradient(145deg, #F4F7EE 0%, #E3F2C1 52%, #D4EAF7 100%)",
    baseHex: "#ECF3DC",
  },
  sunset: {
    label: "Pôr do sol",
    css: "linear-gradient(145deg, #FFF3E8 0%, #FFE0C9 52%, #FAD3D3 100%)",
    baseHex: "#FFE6D5",
  },
  ocean: {
    label: "Oceano",
    css: "linear-gradient(145deg, #EEF6FF 0%, #D6E9FF 52%, #C9E2F8 100%)",
    baseHex: "#DDEEFF",
  },
  lavender: {
    label: "Lavanda",
    css: "linear-gradient(145deg, #F6F2FF 0%, #E9DFFF 55%, #F7E8FF 100%)",
    baseHex: "#EFE7FF",
  },
  forest: {
    label: "Floresta",
    css: "linear-gradient(145deg, #13221C 0%, #1C352B 55%, #0E1915 100%)",
    baseHex: "#162921",
  },
  midnight: {
    label: "Noite",
    css: "linear-gradient(145deg, #0F1014 0%, #1B1F2E 55%, #111218 100%)",
    baseHex: "#141720",
  },
} as const;
export type BgGradientKey = keyof typeof BG_GRADIENTS;

export const BG_DOODLES = {
  dots: { label: "Pontinhos" },
  grid: { label: "Quadriculado" },
  waves: { label: "Ondas" },
  organic: { label: "Formas" },
} as const;
export type BgDoodleKey = keyof typeof BG_DOODLES;

export const BG_IMAGE_PRESETS = {
  "mesh-lime": {
    label: "Lima suave",
    css: "radial-gradient(at 15% 15%, #DDF87A 0px, transparent 52%), radial-gradient(at 85% 20%, #B8E7F5 0px, transparent 48%), radial-gradient(at 50% 90%, #EEF4D4 0px, transparent 55%), #F6F7F2",
    baseHex: "#EDF3DF",
  },
  "mesh-warm": {
    label: "Areia editorial",
    css: "radial-gradient(at 20% 20%, #F7D9BC 0px, transparent 52%), radial-gradient(at 85% 30%, #F2C6B4 0px, transparent 48%), radial-gradient(at 45% 85%, #EFE6DA 0px, transparent 55%), #FAF6F0",
    baseHex: "#F4ECE2",
  },
  "mesh-ocean": {
    label: "Vidro azul",
    css: "radial-gradient(at 18% 18%, #93C5FD 0px, transparent 50%), radial-gradient(at 85% 22%, #A5F3FC 0px, transparent 48%), radial-gradient(at 50% 85%, #E0E7FF 0px, transparent 55%), #EFF6FF",
    baseHex: "#DFECFD",
  },
  "mesh-dark": {
    label: "Estúdio escuro",
    css: "radial-gradient(at 15% 15%, rgba(205, 245, 74, 0.24) 0px, transparent 48%), radial-gradient(at 85% 25%, rgba(99, 102, 241, 0.28) 0px, transparent 50%), radial-gradient(at 50% 90%, rgba(20, 184, 166, 0.2) 0px, transparent 52%), #0F1014",
    baseHex: "#14161D",
  },
} as const;
export type BgImagePresetKey = keyof typeof BG_IMAGE_PRESETS;

export const CARD_EFFECTS = {
  none: "Padrão",
  glass: "Transparência",
  glossy: "Glossy",
} as const;
export type CardEffect = keyof typeof CARD_EFFECTS;

export const COVER_HEIGHTS = {
  compact: { label: "Compacta", h: "h-28" },
  regular: { label: "Média", h: "h-36" },
  tall: { label: "Destaque", h: "h-48" },
} as const;
export type CoverHeightKey = keyof typeof COVER_HEIGHTS;

export const COVER_STYLES = {
  clean: "Limpa",
  fade: "Degradê na base",
  tint: "Película de cor",
} as const;
export type CoverStyleKey = keyof typeof COVER_STYLES;

export const LOGO_SHAPES = {
  rounded: "Arredondado",
  circle: "Redondo",
  square: "Quadrado",
} as const;
export type LogoShapeKey = keyof typeof LOGO_SHAPES;

export const LOGO_SIZES = {
  sm: { label: "Pequeno", px: 68 },
  md: { label: "Médio", px: 76 },
  lg: { label: "Grande", px: 92 },
} as const;
export type LogoSizeKey = keyof typeof LOGO_SIZES;

export const HEADER_ALIGNS = {
  left: "Esquerda",
  center: "Centralizado",
} as const;
export type HeaderAlignKey = keyof typeof HEADER_ALIGNS;

export const TEMPLATE_DEFAULTS: Record<
  TemplateKey,
  {
    description: string;
    header: {
      coverHeight: CoverHeightKey;
      coverStyle: CoverStyleKey;
      logoShape: LogoShapeKey;
      logoSize: LogoSizeKey;
      headerAlign: HeaderAlignKey;
    };
    cards: {
      cardEffect: CardEffect;
      cardSize: CardSize;
      cardFill: CardFill;
      radius: number;
    };
  }
> = {
  balcao: {
    description:
      "Ação principal em destaque, atalhos rápidos e barra fixa de contato.",
    header: {
      coverHeight: "regular",
      coverStyle: "clean",
      logoShape: "rounded",
      logoSize: "md",
      headerAlign: "left",
    },
    cards: {
      cardEffect: "none",
      cardSize: "regular",
      cardFill: "solid",
      radius: 20,
    },
  },
  mosaico: {
    description:
      "Capa ampla com degradê, perfil centralizado e foco visual no Bento Grid.",
    header: {
      coverHeight: "tall",
      coverStyle: "fade",
      logoShape: "circle",
      logoSize: "lg",
      headerAlign: "center",
    },
    cards: {
      cardEffect: "none",
      cardSize: "regular",
      cardFill: "solid",
      radius: 22,
    },
  },
  cartao: {
    description:
      "Cartão de visita digital no topo com capa integrada e links logo abaixo.",
    header: {
      coverHeight: "compact",
      coverStyle: "clean",
      logoShape: "rounded",
      logoSize: "sm",
      headerAlign: "left",
    },
    cards: {
      cardEffect: "none",
      cardSize: "compact",
      cardFill: "solid",
      radius: 16,
    },
  },
};
