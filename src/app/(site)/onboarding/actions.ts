"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { detectLink, linkUrlSchema } from "@/lib/link-detect";
import { friendlyDbError } from "@/lib/onboarding";
import { recordOnboardingEvent } from "@/lib/onboarding-events";
import { pageTag } from "@/lib/public-page";
import {
  DEFAULT_STYLE,
  STYLE_KEYS,
  type StyleKey,
  type TemplateKey,
} from "@/lib/styles";

export type StepActionState = {
  error?: string;
};

// ---------------------------------------------------------------------------
// Step 3 · Estilo
// ---------------------------------------------------------------------------

const styleSchema = z.enum(STYLE_KEYS as [StyleKey, ...StyleKey[]]);

export async function saveStyleAction(formData: FormData) {
  const { supabase, userId } = await requireUser("/onboarding/3");
  const skip = formData.get("skip") === "1";
  const rawStyle = skip ? DEFAULT_STYLE : formData.get("style");
  const parsed = styleSchema.safeParse(rawStyle);
  const style: StyleKey = parsed.success ? parsed.data : DEFAULT_STYLE;

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, onboarding_step")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) redirect("/onboarding/iniciar");

  const nextStep = Math.max(page.onboarding_step, 4);
  const { error } = await supabase
    .from("pages")
    .update({ style, onboarding_step: nextStep })
    .eq("id", page.id);

  if (error) throw new Error(friendlyDbError(error.message));

  recordOnboardingEvent({
    event: "estilo_escolhido",
    userId,
    pageId: page.id,
    slug: page.slug,
    metadata: { style, skipped: skip },
  });

  redirect("/onboarding/4");
}

// ---------------------------------------------------------------------------
// Step 4 · Dados
// ---------------------------------------------------------------------------

function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Brazilian phone with DDD (10 or 11 digits) -> prepend country code 55.
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return null;
}

const businessDataSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(1, "Digite o nome do seu negócio.")
    .max(60, "Use no máximo 60 caracteres."),
  whatsapp: z.string().trim().max(30).optional().default(""),
  city: z
    .string()
    .trim()
    .max(60, "Use no máximo 60 caracteres.")
    .optional()
    .default(""),
  avatar_path: z.string().trim().max(300).optional().default(""),
});

export async function saveBusinessDataAction(
  _prev: StepActionState,
  formData: FormData,
): Promise<StepActionState> {
  const { supabase, userId } = await requireUser("/onboarding/4");

  const parsed = businessDataSchema.safeParse({
    business_name: formData.get("business_name") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    city: formData.get("city") ?? "",
    avatar_path: formData.get("avatar_path") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    };
  }

  const rawWhatsapp = parsed.data.whatsapp;
  const normalizedWhatsapp = rawWhatsapp
    ? normalizeWhatsapp(rawWhatsapp)
    : null;
  if (rawWhatsapp && !normalizedWhatsapp) {
    return {
      error: "Confira o WhatsApp: informe DDD e número (ex.: 11 99999-9999).",
    };
  }

  const avatarPath = parsed.data.avatar_path || null;
  if (avatarPath && !avatarPath.startsWith(`${userId}/`)) {
    return { error: "Caminho de imagem inválido." };
  }

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, onboarding_step")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) redirect("/onboarding/iniciar");

  const nextStep = Math.max(page.onboarding_step, 5);
  const { error: pageError } = await supabase
    .from("pages")
    .update({
      business_name: parsed.data.business_name,
      whatsapp: normalizedWhatsapp,
      city: parsed.data.city || null,
      avatar_path: avatarPath,
      onboarding_step: nextStep,
    })
    .eq("id", page.id);

  if (pageError) {
    return { error: friendlyDbError(pageError.message) };
  }

  // When WhatsApp is filled, create or update the whatsapp link card.
  if (normalizedWhatsapp) {
    const waUrl = `https://wa.me/${normalizedWhatsapp}`;
    const { data: existingWa } = await supabase
      .from("links")
      .select("id")
      .eq("page_id", page.id)
      .eq("kind", "whatsapp")
      .limit(1)
      .maybeSingle();

    if (existingWa) {
      await supabase
        .from("links")
        .update({ url: waUrl, icon: "si:whatsapp", active: true })
        .eq("id", existingWa.id);
    } else {
      const { error: linkErr } = await supabase.from("links").insert({
        page_id: page.id,
        kind: "whatsapp",
        title: "WhatsApp",
        url: waUrl,
        icon: "si:whatsapp",
        position: 0,
        active: true,
      });
      if (linkErr && !linkErr.message.includes("plan_limit_links")) {
        return { error: friendlyDbError(linkErr.message) };
      }
    }
  }

  recordOnboardingEvent({
    event: "dados_salvos",
    userId,
    pageId: page.id,
    slug: page.slug,
    metadata: {
      has_whatsapp: Boolean(normalizedWhatsapp),
      has_logo: Boolean(avatarPath),
      has_city: Boolean(parsed.data.city),
    },
  });

  redirect("/onboarding/5");
}

// ---------------------------------------------------------------------------
// Step 5 · Primeiros links
// ---------------------------------------------------------------------------

const incomingLinkSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Informe um título.").max(80),
  url: linkUrlSchema,
  icon: z
    .string()
    .regex(/^(si|lm):[a-z0-9-]+$/)
    .optional(),
});

const linksPayloadSchema = z.array(incomingLinkSchema).max(20);

export async function saveLinksAction(
  _prev: StepActionState,
  formData: FormData,
): Promise<StepActionState> {
  const { supabase, userId } = await requireUser("/onboarding/5");

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, onboarding_step")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) redirect("/onboarding/iniciar");

  const skip = formData.get("skip") === "1";
  const nextStep = Math.max(page.onboarding_step, 6);

  if (skip) {
    await supabase
      .from("pages")
      .update({ onboarding_step: nextStep })
      .eq("id", page.id);

    recordOnboardingEvent({
      event: "links_adicionados",
      userId,
      pageId: page.id,
      slug: page.slug,
      metadata: { count: 0, skipped: true },
    });

    redirect("/onboarding/6");
  }

  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(String(formData.get("links") ?? "[]"));
  } catch {
    return { error: "Não foi possível ler os links enviados." };
  }

  const parsed = linksPayloadSchema.safeParse(rawItems);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Confira os endereços dos seus links.",
    };
  }

  // Fetch existing links for this page so we update in place and avoid duplicates.
  const { data: existingLinks } = await supabase
    .from("links")
    .select("id")
    .eq("page_id", page.id);

  const existingIds = new Set((existingLinks ?? []).map((l) => l.id));
  const keptIds = new Set(
    parsed.data
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id)),
  );

  // Delete links removed by the user in this step.
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    await supabase
      .from("links")
      .delete()
      .eq("page_id", page.id)
      .in("id", toDelete);
  }

  let savedCount = 0;
  for (let i = 0; i < parsed.data.length; i++) {
    const item = parsed.data[i];
    const detected = detectLink(item.url);
    if (!detected) {
      return {
        error: `O endereço de "${item.title}" não parece válido.`,
      };
    }

    const row = {
      kind: detected.kind,
      title: item.title,
      url: detected.url,
      icon: item.icon ?? detected.icon,
      position: i,
      active: true,
    };

    if (item.id && existingIds.has(item.id)) {
      const { error } = await supabase
        .from("links")
        .update(row)
        .eq("id", item.id)
        .eq("page_id", page.id);
      if (error) return { error: friendlyDbError(error.message) };
      savedCount++;
    } else {
      const { error } = await supabase
        .from("links")
        .insert({ ...row, page_id: page.id });
      if (error) return { error: friendlyDbError(error.message) };
      savedCount++;
    }
  }

  const { error: stepError } = await supabase
    .from("pages")
    .update({ onboarding_step: nextStep })
    .eq("id", page.id);

  if (stepError) return { error: friendlyDbError(stepError.message) };

  recordOnboardingEvent({
    event: "links_adicionados",
    userId,
    pageId: page.id,
    slug: page.slug,
    metadata: { count: savedCount },
  });

  redirect("/onboarding/6");
}

// ---------------------------------------------------------------------------
// Step 6 · Modelo
// ---------------------------------------------------------------------------

const templateSchema = z.enum(["balcao", "mosaico", "cartao"]);

export async function saveTemplateAction(formData: FormData) {
  const { supabase, userId } = await requireUser("/onboarding/6");
  const parsed = templateSchema.safeParse(formData.get("template"));
  const template: TemplateKey = parsed.success ? parsed.data : "balcao";

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, onboarding_step")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) redirect("/onboarding/iniciar");

  const nextStep = Math.max(page.onboarding_step, 7);
  const { error } = await supabase
    .from("pages")
    .update({ template, onboarding_step: nextStep })
    .eq("id", page.id);

  if (error) throw new Error(friendlyDbError(error.message));

  recordOnboardingEvent({
    event: "modelo_escolhido",
    userId,
    pageId: page.id,
    slug: page.slug,
    metadata: { template },
  });

  redirect("/onboarding/7");
}

// ---------------------------------------------------------------------------
// Step 7 · Publicar
// ---------------------------------------------------------------------------

export async function publishPageAction(): Promise<StepActionState> {
  const { supabase, userId } = await requireUser("/onboarding/7");

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) redirect("/onboarding/iniciar");

  const { error } = await supabase
    .from("pages")
    .update({ published: true, onboarding_step: 8 })
    .eq("id", page.id);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  revalidateTag(pageTag(page.slug), "max");

  recordOnboardingEvent({
    event: "pagina_publicada",
    userId,
    pageId: page.id,
    slug: page.slug,
  });

  redirect("/onboarding/pronto");
}
