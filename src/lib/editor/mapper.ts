import type { Plan } from "@/lib/plans";
import {
  BG_GRADIENTS,
  BG_IMAGE_PRESETS,
  STYLES,
  type BgGradientKey,
  type BgImagePresetKey,
  type StyleKey,
  type TemplateKey,
} from "@/lib/styles";
import { parseTheme, resolveTheme, type ResolvedTheme, type Theme } from "@/lib/theme";
import {
  SUPPORT_PALETTE,
  type BlockGeometry,
  type CanvasNode,
  type MuralDocument,
  type MuralSettings,
  type SupportColorId,
  type WidgetItem,
  type WidgetType,
} from "./types";

type RawPageInput = {
  id: string;
  slug: string;
  updated_at: string;
  business_name: string;
  kind: string | null;
  bio: string | null;
  city: string | null;
  whatsapp: string | null;
  avatar_path: string | null;
  cover_path: string | null;
  published: boolean;
  show_branding: boolean;
  style: string;
  template: string;
  theme: unknown;
};

type RawLinkInput = {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  url: string;
  icon: string | null;
  featured: boolean;
  position: number;
  active: boolean;
  size: string;
  data: unknown;
};

function isSupportColor(val: unknown): val is SupportColorId {
  return typeof val === "string" && val in SUPPORT_PALETTE;
}

function isWidgetType(val: unknown): val is WidgetType {
  return (
    val === "link" ||
    val === "whatsapp" ||
    val === "map" ||
    val === "video" ||
    val === "mediakit" ||
    val === "shop" ||
    val === "newsletter" ||
    val === "note" ||
    val === "social_icon"
  );
}

function parseSpan(val: unknown, fallback: 1 | 2 | 4): 1 | 2 | 4 {
  if (val === 1 || val === 2 || val === 4) return val;
  return fallback;
}

function parseRowSpan(val: unknown, fallback: 1 | 2): 1 | 2 {
  if (val === 1 || val === 2) return val;
  return fallback;
}

function defaultGeometryFromSize(
  size: string,
  order: number,
): { mobile: BlockGeometry; desktop: BlockGeometry } {
  if (size === "1x1") {
    return {
      mobile: { colSpan: 1, rowSpan: 1, order },
      desktop: { colSpan: 1, rowSpan: 1, order },
    };
  }
  if (size === "2x2") {
    return {
      mobile: { colSpan: 2, rowSpan: 2, order },
      desktop: { colSpan: 2, rowSpan: 2, order },
    };
  }
  return {
    mobile: { colSpan: 2, rowSpan: 1, order },
    desktop: { colSpan: 2, rowSpan: 1, order },
  };
}

function parseStackItems(raw: unknown): WidgetItem[] {
  if (!Array.isArray(raw)) return [];
  const items: WidgetItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const id = typeof obj.id === "string" && obj.id ? obj.id : crypto.randomUUID();
    const title = typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : "Link";
    items.push({
      id,
      type: isWidgetType(obj.type) ? obj.type : "link",
      title,
      subtitle: typeof obj.subtitle === "string" ? obj.subtitle : undefined,
      url: typeof obj.url === "string" ? obj.url : "https://linkmural.com",
      icon: typeof obj.icon === "string" ? obj.icon : "lm:link",
      colorId: isSupportColor(obj.colorId) ? obj.colorId : "default",
    });
  }
  return items;
}

export function inferWidgetType(kind: string, icon: string | null, size: string): WidgetType {
  if (kind === "youtube") return "video";
  if (kind === "whatsapp" || icon === "si:whatsapp") return "whatsapp";
  if (kind === "map" || icon === "lm:pin" || icon === "lm:map") return "map";
  if (kind === "service" || icon === "lm:shop") return "shop";
  if (size === "1x1" && icon?.startsWith("si:")) return "social_icon";
  return "link";
}

/** Converts database `pages` + `links` into a full `MuralDocument` for the Visual Editor. */
export function pageToMuralDocument(params: {
  page: RawPageInput;
  links: RawLinkInput[];
  avatarUrl: string | null;
  coverUrl: string | null;
}): MuralDocument {
  const { page, links, avatarUrl, coverUrl } = params;
  const parsedTheme = parseTheme(page.theme);

  const bgType: "solid" | "gradient" | "image" =
    parsedTheme.bgType === "gradient"
      ? "gradient"
      : parsedTheme.bgType === "image"
        ? "image"
        : "solid";

  const bgId =
    bgType === "gradient"
      ? (parsedTheme.bgGradient ?? "aurora")
      : bgType === "image"
        ? (parsedTheme.bgImage ?? "mesh-dark")
        : (page.style ?? "classic");

  const scale: "compact" | "default" | "large" =
    parsedTheme.cardSize === "compact"
      ? "compact"
      : parsedTheme.cardSize === "large"
        ? "large"
        : "default";

  const templateKey: TemplateKey =
    page.template === "mosaico" || page.template === "cartao"
      ? page.template
      : "balcao";

  const activeLinks = links
    .filter((l) => l.active)
    .sort((a, b) => a.position - b.position);

  const nodes: CanvasNode[] = activeLinks.map((link, idx) => {
    const rawData =
      link.data && typeof link.data === "object" && !Array.isArray(link.data)
        ? (link.data as Record<string, unknown>)
        : {};

    const fallbackLayout = defaultGeometryFromSize(link.size, idx);
    const rawLayout =
      rawData.layout && typeof rawData.layout === "object"
        ? (rawData.layout as Record<string, unknown>)
        : {};
    const rawMob =
      rawLayout.mobile && typeof rawLayout.mobile === "object"
        ? (rawLayout.mobile as Record<string, unknown>)
        : {};
    const rawDesk =
      rawLayout.desktop && typeof rawLayout.desktop === "object"
        ? (rawLayout.desktop as Record<string, unknown>)
        : {};

    const mobileGeo: BlockGeometry = {
      colSpan: parseSpan(rawMob.colSpan, fallbackLayout.mobile.colSpan),
      rowSpan: parseRowSpan(rawMob.rowSpan, fallbackLayout.mobile.rowSpan),
      order: idx,
    };
    const desktopGeo: BlockGeometry = {
      colSpan: parseSpan(rawDesk.colSpan, fallbackLayout.desktop.colSpan),
      rowSpan: parseRowSpan(rawDesk.rowSpan, fallbackLayout.desktop.rowSpan),
      order: idx,
    };

    const primaryItem: WidgetItem = {
      id: `${link.id}:0`,
      type: isWidgetType(rawData.widgetType)
        ? rawData.widgetType
        : inferWidgetType(link.kind, link.icon, link.size),
      title: link.title,
      subtitle: link.subtitle ?? undefined,
      url: link.url,
      icon: link.icon ?? "lm:link",
      colorId: isSupportColor(rawData.colorId) ? rawData.colorId : "default",
      price: typeof rawData.price === "string" ? rawData.price : undefined,
      duration:
        typeof rawData.duration === "string" ? rawData.duration : undefined,
      ctaLabel:
        typeof rawData.ctaLabel === "string" ? rawData.ctaLabel : undefined,
    };

    const extraStack = parseStackItems(rawData.stackItems);
    const allItems = [primaryItem, ...extraStack];

    return {
      id: link.id,
      kind: allItems.length > 1 ? "stack" : "single",
      activeStackIndex: 0,
      featured: link.featured,
      items: allItems,
      layout: {
        mobile: mobileGeo,
        desktop: desktopGeo,
      },
    };
  });

  return {
    id: page.id,
    slug: page.slug,
    updatedAt: page.updated_at,
    header: {
      businessName: page.business_name || page.slug,
      kind: page.kind,
      bio: page.bio,
      city: page.city,
      whatsapp: page.whatsapp,
      avatarPath: page.avatar_path,
      coverPath: page.cover_path,
      avatarUrl,
      coverUrl,
      published: page.published,
      showBranding: page.show_branding,
    },
    settings: {
      themeId: page.style || "classic",
      styleKey: page.style in STYLES ? page.style : "classic",
      templateKey,
      bgType,
      bgId,
      bgCustomUrl: parsedTheme.bgImageUrl,
      bgBlur: parsedTheme.bgBlur ?? 0,
      bgOpacity: parsedTheme.bgOpacity ?? 100,
      customBgHex:
        parsedTheme.palette === "custom" ? parsedTheme.background : undefined,
      customAccentHex:
        parsedTheme.palette === "custom" ? parsedTheme.accent : undefined,
      cardStyle: parsedTheme.cardEffect === "glass" ? "glass" : "solid",
      grid: {
        mobileColumns: parsedTheme.gridMobileCols ?? 2,
        desktopColumns: parsedTheme.gridDesktopCols ?? 4,
        scale,
      },
      labels: {
        showIconLabels: parsedTheme.showIconLabels ?? true,
        showSubtitles: parsedTheme.showSubtitles ?? true,
      },
    },
    nodes,
  };
}

/** Builds a `Theme` object ready to persist in `pages.theme` or pass to `resolveTheme`. */
export function muralSettingsToTheme(
  settings: MuralSettings,
  existingRawTheme?: unknown,
): Theme {
  const prev = parseTheme(existingRawTheme);
  const bgGradient: BgGradientKey =
    settings.bgId in BG_GRADIENTS
      ? (settings.bgId as BgGradientKey)
      : (prev.bgGradient ?? "aurora");
  const bgImage: BgImagePresetKey =
    settings.bgId in BG_IMAGE_PRESETS
      ? (settings.bgId as BgImagePresetKey)
      : (prev.bgImage ?? "mesh-dark");

  const hasCustomHex = Boolean(settings.customBgHex || settings.customAccentHex);
  const styleFallback =
    STYLES[(settings.styleKey as StyleKey) ?? "classic"] ?? STYLES.classic;

  return {
    ...prev,
    bgType: settings.bgType,
    bgGradient,
    bgImage,
    bgImageUrl: settings.bgCustomUrl || undefined,
    bgBlur: settings.bgBlur,
    bgOpacity: settings.bgOpacity,
    palette: hasCustomHex ? "custom" : "style",
    background: hasCustomHex
      ? (settings.customBgHex ?? styleFallback.palette.bg)
      : undefined,
    accent: hasCustomHex
      ? (settings.customAccentHex ?? styleFallback.palette.accent)
      : undefined,
    cardEffect: settings.cardStyle === "glass" ? "glass" : "none",
    cardSize:
      settings.grid.scale === "compact"
        ? "compact"
        : settings.grid.scale === "large"
          ? "large"
          : "regular",
    gridMobileCols: settings.grid.mobileColumns,
    gridDesktopCols: settings.grid.desktopColumns,
    showIconLabels: settings.labels.showIconLabels,
    showSubtitles: settings.labels.showSubtitles,
  };
}

/** Resolves `ResolvedTheme` synchronously on the client for instant 60fps WYSIWYG. */
export function resolveEditorTheme(
  settings: MuralSettings,
  plan: Plan,
): ResolvedTheme {
  const themeObj = muralSettingsToTheme(settings);
  // In the visual editor preview we resolve with at least Pro preview capabilities
  // while server save enforces plan rules safely.
  const effectivePlan: Plan = plan === "free" ? "pro" : plan;
  return resolveTheme(
    settings.styleKey,
    themeObj,
    effectivePlan,
    settings.templateKey,
  );
}

/** Maps a `BlockGeometry` back to the legacy `size` column ('1x1' | '2x1' | '2x2'). */
export function geometryToLegacySize(
  geo: BlockGeometry,
): "1x1" | "2x1" | "2x2" {
  if (geo.colSpan === 1 && geo.rowSpan === 1) return "1x1";
  if (geo.rowSpan >= 2) return "2x2";
  return "2x1";
}
