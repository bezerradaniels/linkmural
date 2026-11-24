export type ViewportKey = "mobile" | "desktop";

export type InteractionMode =
  | "IDLE"
  | "PRESS_PENDING"
  | "SCROLLING"
  | "SELECTED"
  | "DRAGGING"
  | "RESIZING"
  | "ZOOM_OUT";

export type WidgetType =
  | "link"
  | "whatsapp"
  | "map"
  | "video"
  | "mediakit"
  | "shop"
  | "newsletter"
  | "note"
  | "social_icon";

export type SupportColorId =
  | "default"
  | "ink"
  | "lime"
  | "chiclete"
  | "tangerina"
  | "anil"
  | "lavanda"
  | "paper"
  | "branco";

export interface BlockGeometry {
  colSpan: 1 | 2 | 4;
  rowSpan: 1 | 2;
  order: number;
}

export interface WidgetItem {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  url?: string;
  icon: string;
  colorId: SupportColorId;
  price?: string;
  duration?: string;
  ctaLabel?: string;
}

export interface CanvasNode {
  id: string;
  kind: "single" | "stack";
  activeStackIndex: number;
  featured?: boolean;
  items: WidgetItem[];
  layout: Record<ViewportKey, BlockGeometry>;
}

export interface MuralSettings {
  themeId: string;
  styleKey: string;
  templateKey: "balcao" | "mosaico" | "cartao";
  bgType: "solid" | "gradient" | "image";
  bgId: string;
  bgCustomUrl?: string;
  bgBlur: number;
  bgOpacity: number;
  customBgHex?: string;
  customAccentHex?: string;
  cardStyle: "solid" | "glass";
  grid: {
    mobileColumns: 2 | 4;
    desktopColumns: 4 | 6;
    scale: "compact" | "default" | "large";
  };
  labels: {
    showIconLabels: boolean;
    showSubtitles: boolean;
  };
}

export interface MuralProfileHeader {
  businessName: string;
  kind: string | null;
  bio: string | null;
  city: string | null;
  whatsapp: string | null;
  avatarPath: string | null;
  coverPath: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  published: boolean;
  showBranding: boolean;
}

export interface MuralDocument {
  id: string;
  slug: string;
  updatedAt: string;
  header: MuralProfileHeader;
  settings: MuralSettings;
  nodes: CanvasNode[];
}

export const SUPPORT_PALETTE: Record<
  SupportColorId,
  {
    label: string;
    bg: string;
    ink: string;
    muted: string;
    iconBg: string;
    iconInk: string;
  }
> = {
  default: {
    label: "Padrão do tema",
    bg: "",
    ink: "",
    muted: "",
    iconBg: "",
    iconInk: "",
  },
  ink: {
    label: "Ink",
    bg: "#0E0E0E",
    ink: "#F4F4EF",
    muted: "rgba(244, 244, 239, 0.72)",
    iconBg: "#FFFFFF",
    iconInk: "#0E0E0E",
  },
  lime: {
    label: "Lime",
    bg: "#CDF54A",
    ink: "#0E0E0E",
    muted: "rgba(14, 14, 14, 0.72)",
    iconBg: "#FFFFFF",
    iconInk: "#0E0E0E",
  },
  chiclete: {
    label: "Chiclete",
    bg: "#FF4D9A",
    ink: "#0E0E0E",
    muted: "rgba(14, 14, 14, 0.78)",
    iconBg: "#FFFFFF",
    iconInk: "#0E0E0E",
  },
  tangerina: {
    label: "Tangerina",
    bg: "#FF6B2C",
    ink: "#0E0E0E",
    muted: "rgba(14, 14, 14, 0.78)",
    iconBg: "#FFFFFF",
    iconInk: "#0E0E0E",
  },
  anil: {
    label: "Anil",
    bg: "#3D4CF5",
    ink: "#FFFFFF",
    muted: "rgba(255, 255, 255, 0.8)",
    iconBg: "#FFFFFF",
    iconInk: "#0E0E0E",
  },
  lavanda: {
    label: "Lavanda",
    bg: "#CBB8FF",
    ink: "#0E0E0E",
    muted: "rgba(14, 14, 14, 0.75)",
    iconBg: "#FFFFFF",
    iconInk: "#0E0E0E",
  },
  paper: {
    label: "Paper",
    bg: "#F4F4EF",
    ink: "#0E0E0E",
    muted: "#5F5F5A",
    iconBg: "#FFFFFF",
    iconInk: "#0E0E0E",
  },
  branco: {
    label: "Branco",
    bg: "#FFFFFF",
    ink: "#0E0E0E",
    muted: "#6B6B66",
    iconBg: "#F2F2EE",
    iconInk: "#0E0E0E",
  },
};

export interface ThemePreset {
  id: string;
  label: string;
  tagline: string;
  styleKey: string;
  bgType: "solid" | "gradient" | "image";
  bgId: string;
  customBgHex?: string;
  customAccentHex?: string;
  cardStyle: "solid" | "glass";
  previewBg: string;
  previewCard: string;
  previewAccent: string;
}

export const EDITOR_THEME_PRESETS: ThemePreset[] = [
  {
    id: "ink-lime",
    label: "Ink Lime",
    tagline: "Contraste marcante escuro com destaque em lima",
    styleKey: "sport",
    bgType: "solid",
    bgId: "ink",
    customBgHex: "#0E0E0E",
    customAccentHex: "#CDF54A",
    cardStyle: "solid",
    previewBg: "#0E0E0E",
    previewCard: "#1B1C20",
    previewAccent: "#CDF54A",
  },
  {
    id: "paper-pop",
    label: "Paper Pop",
    tagline: "Editorial claro com energia vibrante",
    styleKey: "pop",
    bgType: "solid",
    bgId: "paper",
    customBgHex: "#F4F4EF",
    customAccentHex: "#FF6B2C",
    cardStyle: "solid",
    previewBg: "#F4F4EF",
    previewCard: "#FFFFFF",
    previewAccent: "#FF6B2C",
  },
  {
    id: "clinica-clean",
    label: "Clínica Clean",
    tagline: " sereno, confiável e minimalista",
    styleKey: "calm",
    bgType: "gradient",
    bgId: "ocean",
    cardStyle: "glass",
    previewBg: "#EEF6FF",
    previewCard: "#FFFFFF",
    previewAccent: "#2563EB",
  },
  {
    id: "creator-neon",
    label: "Creator Neon",
    tagline: "Fundo estúdio com cards translúcidos",
    styleKey: "dark",
    bgType: "image",
    bgId: "mesh-dark",
    cardStyle: "glass",
    previewBg: "#14161D",
    previewCard: "rgba(255,255,255,0.12)",
    previewAccent: "#CBB8FF",
  },
  {
    id: "classic-editorial",
    label: "Clássico",
    tagline: "Tipografia elegante em tons naturais",
    styleKey: "classic",
    bgType: "solid",
    bgId: "classic",
    cardStyle: "solid",
    previewBg: "#F6F4EF",
    previewCard: "#FFFFFF",
    previewAccent: "#2D4A3E",
  },
  {
    id: "aurora-glass",
    label: "Aurora",
    tagline: "Degradê suave com acabamento em vidro",
    styleKey: "fresh",
    bgType: "gradient",
    bgId: "aurora",
    cardStyle: "glass",
    previewBg: "#E3F2C1",
    previewCard: "rgba(255,255,255,0.7)",
    previewAccent: "#0E0E0E",
  },
];

export interface WidgetTemplateSpec {
  type: WidgetType;
  label: string;
  description: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultUrl: string;
  defaultIcon: string;
  defaultColor: SupportColorId;
  defaultMobileSpan: { colSpan: 1 | 2; rowSpan: 1 | 2 };
}

export const WIDGET_LIBRARY: WidgetTemplateSpec[] = [
  {
    type: "whatsapp",
    label: "WhatsApp direto",
    description: "Abre conversa imediata com sua equipe",
    defaultTitle: "Falar no WhatsApp",
    defaultSubtitle: "Resposta rápida em horário comercial",
    defaultUrl: "https://wa.me/5511999999999",
    defaultIcon: "si:whatsapp",
    defaultColor: "lime",
    defaultMobileSpan: { colSpan: 2, rowSpan: 1 },
  },
  {
    type: "link",
    label: "Link em destaque",
    description: "Botão para site, agenda ou catálogo",
    defaultTitle: "Agendar horário",
    defaultSubtitle: "Escolha o melhor dia online",
    defaultUrl: "https://linkmural.com",
    defaultIcon: "lm:calendar",
    defaultColor: "default",
    defaultMobileSpan: { colSpan: 2, rowSpan: 1 },
  },
  {
    type: "video",
    label: "Último vídeo",
    description: "Player do YouTube integrado na grade",
    defaultTitle: "Assista à apresentação",
    defaultSubtitle: "Conheça nosso trabalho em 1 minuto",
    defaultUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    defaultIcon: "si:youtube",
    defaultColor: "ink",
    defaultMobileSpan: { colSpan: 2, rowSpan: 2 },
  },
  {
    type: "mediakit",
    label: "Mídia Kit",
    description: "Portfólio ou apresentação comercial",
    defaultTitle: "Mídia Kit e Parcerias",
    defaultSubtitle: " Números, formatos e contato comercial",
    defaultUrl: "https://linkmural.com",
    defaultIcon: "lm:portfolio",
    defaultColor: "lavanda",
    defaultMobileSpan: { colSpan: 2, rowSpan: 2 },
  },
  {
    type: "map",
    label: "Mapa e endereço",
    description: "Rota rápida no Google Maps ou Waze",
    defaultTitle: "Como chegar",
    defaultSubtitle: "Ver rota no mapa",
    defaultUrl: "https://maps.google.com",
    defaultIcon: "lm:pin",
    defaultColor: "paper",
    defaultMobileSpan: { colSpan: 1, rowSpan: 1 },
  },
  {
    type: "shop",
    label: "Loja e Drops",
    description: "Vitrine de produto, serviço ou promoção",
    defaultTitle: "Coleção de lançamento",
    defaultSubtitle: "Disponível para pedido online",
    defaultUrl: "https://linkmural.com",
    defaultIcon: "lm:shop",
    defaultColor: "tangerina",
    defaultMobileSpan: { colSpan: 2, rowSpan: 2 },
  },
  {
    type: "newsletter",
    label: "Lista VIP",
    description: "Convite para grupo, canal ou newsletter",
    defaultTitle: "Entrar na Lista VIP",
    defaultSubtitle: "Novidades e cupons toda semana",
    defaultUrl: "https://linkmural.com",
    defaultIcon: "lm:mail",
    defaultColor: "anil",
    defaultMobileSpan: { colSpan: 2, rowSpan: 1 },
  },
  {
    type: "note",
    label: "Nota rápida",
    description: "Aviso, horário especial ou recado curto",
    defaultTitle: "Aviso da semana",
    defaultSubtitle: "Atendimento especial neste sábado até as 16h.",
    defaultUrl: "https://linkmural.com/#nota",
    defaultIcon: "lm:info",
    defaultColor: "branco",
    defaultMobileSpan: { colSpan: 2, rowSpan: 1 },
  },
  {
    type: "social_icon",
    label: "Ícone de rede (1x1)",
    description: "Bloco compacto estilo aplicativo",
    defaultTitle: "Instagram",
    defaultSubtitle: "@seuperfil",
    defaultUrl: "https://instagram.com",
    defaultIcon: "si:instagram",
    defaultColor: "default",
    defaultMobileSpan: { colSpan: 1, rowSpan: 1 },
  },
];
