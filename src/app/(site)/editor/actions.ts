"use server";

import { z } from "zod";
import { refreshPublicPage } from "@/app/(site)/app/actions/revalidate";
import { requireUser } from "@/lib/auth";
import {
  geometryToLegacySize,
  muralSettingsToTheme,
} from "@/lib/editor/mapper";
import type { MuralDocument } from "@/lib/editor/types";
import { detectLink, linkUrlSchema } from "@/lib/link-detect";
import { friendlyDbError } from "@/lib/onboarding";
import { planInfo } from "@/lib/plans";
import { extractYoutubeId } from "@/lib/rich-blocks";
import { STYLE_KEYS, type StyleKey } from "@/lib/styles";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database, Json } from "@/utils/supabase/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const geometrySchema = z.object({
  colSpan: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  rowSpan: z.union([z.literal(1), z.literal(2)]),
  order: z.number().int().min(0).max(500),
});

const widgetItemSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum([
    "link",
    "whatsapp",
    "map",
    "video",
    "mediakit",
    "shop",
    "newsletter",
    "note",
    "social_icon",
  ]),
  title: z.string().trim().min(1).max(80),
  subtitle: z.string().trim().max(120).optional(),
  url: z.string().trim().max(2048).optional(),
  icon: z.string().max(60),
  colorId: z.enum([
    "default",
    "ink",
    "lime",
    "chiclete",
    "tangerina",
    "anil",
    "lavanda",
    "paper",
    "branco",
  ]),
  price: z.string().max(40).optional(),
  duration: z.string().max(40).optional(),
  ctaLabel: z.string().max(40).optional(),
});

const canvasNodeSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(["single", "stack"]),
  activeStackIndex: z.number().int().min(0).max(20),
  featured: z.boolean().optional(),
  items: z.array(widgetItemSchema).min(1).max(12),
  layout: z.object({
    mobile: geometrySchema,
    desktop: geometrySchema,
  }),
});

const settingsSchema = z.object({
  themeId: z.string().max(60),
  styleKey: z.string().max(40),
  templateKey: z.enum(["balcao", "mosaico", "cartao"]),
  bgType: z.enum(["solid", "gradient", "image"]),
  bgId: z.string().max(60),
  bgCustomUrl: z.string().max(600).optional(),
  bgBlur: z.number().min(0).max(24),
  bgOpacity: z.number().min(20).max(100),
  customBgHex: z.string().max(16).optional(),
  customAccentHex: z.string().max(16).optional(),
  cardStyle: z.enum(["solid", "glass"]),
  grid: z.object({
    mobileColumns: z.union([z.literal(2), z.literal(4)]),
    desktopColumns: z.union([z.literal(4), z.literal(6)]),
    scale: z.enum(["compact", "default", "large"]),
  }),
  labels: z.object({
    showIconLabels: z.boolean(),
    showSubtitles: z.boolean(),
  }),
});

const headerPatchSchema = z
  .object({
    businessName: z.string().trim().min(1, "Digite um nome.").max(60),
    bio: z.string().trim().max(160).nullable().optional(),
    avatarPath: z.string().trim().max(300).nullable().optional(),
    coverPath: z.string().trim().max(600).nullable().optional(),
  })
  .optional();

const savePayloadSchema = z.object({
  muralId: z.string().uuid(),
  header: headerPatchSchema,
  settings: settingsSchema,
  nodes: z.array(canvasNodeSchema).max(200),
});

export type SaveMuralResult =
  | {
      ok: true;
      updatedAt: string;
      /** Maps temporary client node IDs to newly created DB UUIDs */
      createdIdMap: Record<string, string>;
    }
  | {
      ok: false;
      error: string;
    };

function normalizeWidgetUrl(rawUrl: string | undefined, type: string): {
  kind: Database["public"]["Enums"]["link_kind"];
  url: string;
  iconFallback: string;
  videoId?: string;
} {
  if (type === "note") {
    const candidate = rawUrl?.trim();
    if (candidate && linkUrlSchema.safeParse(candidate).success) {
      const det = detectLink(candidate);
      if (det) return { kind: det.kind, url: det.url, iconFallback: "lm:info" };
    }
    return {
      kind: "link",
      url: "https://linkmural.com/#nota",
      iconFallback: "lm:info",
    };
  }

  const trimmed = rawUrl?.trim() || "https://linkmural.com";
  if (type === "video") {
    const vid = extractYoutubeId(trimmed);
    if (vid) {
      return {
        kind: "youtube",
        url: `https://www.youtube.com/watch?v=${vid}`,
        iconFallback: "si:youtube",
        videoId: vid,
      };
    }
  }

  const checked = linkUrlSchema.safeParse(trimmed);
  const safeInput = checked.success ? checked.data : "https://linkmural.com";
  const detected = detectLink(safeInput);
  if (detected) {
    return {
      kind: detected.kind,
      url: detected.url,
      iconFallback: detected.icon,
    };
  }
  return {
    kind: "link",
    url: "https://linkmural.com",
    iconFallback: "lm:link",
  };
}

export async function saveMuralDocumentAction(input: {
  muralId: string;
  header?: {
    businessName: string;
    bio?: string | null;
    avatarPath?: string | null;
    coverPath?: string | null;
  };
  settings: MuralDocument["settings"];
  nodes: MuralDocument["nodes"];
}): Promise<SaveMuralResult> {
  const parsed = savePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Não foi possível validar as alterações do mural.",
    };
  }

  const { muralId, header, settings, nodes } = parsed.data;
  const { supabase, userId } = await requireUser(`/editor/${muralId}`);

  // Check if user owns the page or is an admin
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role, plan")
    .eq("id", userId)
    .maybeSingle();

  const isAdmin = viewerProfile?.role === "admin";
  const db = isAdmin ? createAdminClient() : supabase;

  const { data: page } = await db
    .from("pages")
    .select("id, owner_id, slug, theme")
    .eq("id", muralId)
    .maybeSingle();

  if (!page || (!isAdmin && page.owner_id !== userId)) {
    return { ok: false, error: "Mural não encontrado ou sem permissão." };
  }

  // Resolve owner's plan for feature guards
  let ownerPlan = viewerProfile?.plan ?? "free";
  if (page.owner_id !== userId) {
    const { data: ownerProf } = await createAdminClient()
      .from("profiles")
      .select("plan")
      .eq("id", page.owner_id)
      .maybeSingle();
    ownerPlan = ownerProf?.plan ?? "free";
  }
  const limits = planInfo(ownerPlan);

  if (limits.maxLinks !== null && nodes.length > limits.maxLinks) {
    return {
      ok: false,
      error: `O plano Grátis permite até ${limits.maxLinks} blocos. Assine o Pro para adicionar mais.`,
    };
  }

  const styleKey: StyleKey = STYLE_KEYS.includes(settings.styleKey as StyleKey)
    ? (settings.styleKey as StyleKey)
    : "classic";

  const nextTheme = muralSettingsToTheme(settings, page.theme);

  if (
    header?.avatarPath &&
    !header.avatarPath.startsWith(`${page.owner_id}/`)
  ) {
    return { ok: false, error: "Caminho de logo inválido." };
  }
  if (
    header?.coverPath &&
    !header.coverPath.startsWith(`${page.owner_id}/`) &&
    !header.coverPath.startsWith("https://images.unsplash.com/")
  ) {
    return { ok: false, error: "Caminho de capa inválido." };
  }

  const pageUpdate: Database["public"]["Tables"]["pages"]["Update"] = {
    style: styleKey,
    template: settings.templateKey,
    theme: nextTheme as unknown as Json,
  };
  if (header) {
    pageUpdate.business_name = header.businessName;
    if (header.bio !== undefined) pageUpdate.bio = header.bio || null;
    if (header.avatarPath !== undefined)
      pageUpdate.avatar_path = header.avatarPath || null;
    if (header.coverPath !== undefined)
      pageUpdate.cover_path = header.coverPath || null;
  }

  const { error: pageErr } = await db
    .from("pages")
    .update(pageUpdate)
    .eq("id", page.id);

  if (pageErr) {
    return { ok: false, error: friendlyDbError(pageErr.message) };
  }

  // Sync links: fetch existing active links on this page
  const { data: existingLinks } = await db
    .from("links")
    .select("id, kind, data")
    .eq("page_id", page.id);

  const existingIds = new Set((existingLinks ?? []).map((l) => l.id));
  const incomingUuidSet = new Set(
    nodes.map((n) => n.id).filter((id) => UUID_RE.test(id)),
  );

  // Delete links removed in the editor
  const toDelete = [...existingIds].filter((id) => !incomingUuidSet.has(id));
  if (toDelete.length > 0) {
    await db.from("links").delete().eq("page_id", page.id).in("id", toDelete);
  }

  const createdIdMap: Record<string, string> = {};
  let featuredAssigned = false;

  for (let idx = 0; idx < nodes.length; idx++) {
    const node = nodes[idx];
    const primary = node.items[0];
    const stackItems = node.items.slice(1).map((item) => {
      const norm = normalizeWidgetUrl(item.url, item.type);
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle ?? "",
        url: norm.url,
        icon: item.icon || norm.iconFallback,
        colorId: item.colorId,
      };
    });

    const normPrimary = normalizeWidgetUrl(primary.url, primary.type);
    const resolvedKind: Database["public"]["Enums"]["link_kind"] =
      normPrimary.kind === "youtube" && !limits.businessFeatures
        ? "link"
        : normPrimary.kind;

    const legacySize = limits.customTheme
      ? geometryToLegacySize(node.layout.mobile)
      : "2x1";

    const isFeatured = Boolean(node.featured) && !featuredAssigned;
    if (isFeatured) featuredAssigned = true;

    const existingRow = (existingLinks ?? []).find((l) => l.id === node.id);
    const prevData =
      existingRow?.data &&
      typeof existingRow.data === "object" &&
      !Array.isArray(existingRow.data)
        ? (existingRow.data as Record<string, unknown>)
        : {};

    const dataPayload: Record<string, unknown> = {
      ...prevData,
      widgetType: primary.type,
      colorId: primary.colorId,
      layout: {
        mobile: { ...node.layout.mobile, order: idx },
        desktop: { ...node.layout.desktop, order: idx },
      },
      stackItems: node.kind === "stack" ? stackItems : [],
    };
    if (normPrimary.videoId) {
      dataPayload.videoId = normPrimary.videoId;
    }

    const validIcon = /^(si|lm):[a-z0-9-]+$/.test(primary.icon)
      ? primary.icon
      : normPrimary.iconFallback;

    if (UUID_RE.test(node.id) && existingIds.has(node.id)) {
      const { error: updErr } = await db
        .from("links")
        .update({
          kind: resolvedKind,
          title: primary.title,
          subtitle: primary.subtitle?.trim() || null,
          url: normPrimary.url,
          icon: validIcon,
          featured: isFeatured,
          size: legacySize,
          position: idx,
          active: true,
          data: dataPayload as unknown as Json,
        })
        .eq("id", node.id)
        .eq("page_id", page.id);

      if (updErr) {
        return { ok: false, error: friendlyDbError(updErr.message) };
      }
    } else {
      const { data: inserted, error: insErr } = await db
        .from("links")
        .insert({
          page_id: page.id,
          kind: resolvedKind,
          title: primary.title,
          subtitle: primary.subtitle?.trim() || null,
          url: normPrimary.url,
          icon: validIcon,
          featured: isFeatured,
          size: legacySize,
          position: idx,
          active: true,
          data: dataPayload as unknown as Json,
        })
        .select("id")
        .single();

      if (insErr || !inserted) {
        return { ok: false, error: friendlyDbError(insErr?.message) };
      }
      createdIdMap[node.id] = inserted.id;
    }
  }

  refreshPublicPage(page.slug, [...incomingUuidSet, ...Object.values(createdIdMap)]);

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    createdIdMap,
  };
}

export async function publishMuralFromEditorAction(
  muralId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID_RE.test(muralId)) {
    return { ok: false, error: "Identificador inválido." };
  }
  const { supabase, userId } = await requireUser(`/editor/${muralId}`);
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const isAdmin = prof?.role === "admin";
  const db = isAdmin ? createAdminClient() : supabase;

  const { data: page, error } = await db
    .from("pages")
    .update({ published: true, onboarding_step: 8 })
    .eq("id", muralId)
    .select("slug, owner_id")
    .maybeSingle();

  if (error || !page || (!isAdmin && page.owner_id !== userId)) {
    return {
      ok: false,
      error: friendlyDbError(error?.message) || "Não foi possível publicar.",
    };
  }

  refreshPublicPage(page.slug);
  return { ok: true };
}
