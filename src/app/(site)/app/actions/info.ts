"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { parseHours } from "@/lib/hours";
import { friendlyDbError } from "@/lib/onboarding";
import { retargetWhatsappUrl } from "@/lib/panel-helpers";
import { phoneDigits } from "@/lib/public-actions";
import { finalizeSlug, isValidSlug } from "@/lib/slug";
import type { ActionResult } from "./links";
import { refreshPublicPage } from "./revalidate";

const infoSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(1, "Digite o nome do negócio.")
    .max(60, "Use no máximo 60 caracteres."),
  kind: z
    .string()
    .trim()
    .max(60, "Use no máximo 60 caracteres.")
    .optional()
    .default(""),
  bio: z
    .string()
    .trim()
    .max(160, "Use no máximo 160 caracteres.")
    .optional()
    .default(""),
  avatar_path: z.string().trim().max(300).optional().default(""),
  whatsapp: z.string().trim().max(30).optional().default(""),
  phone: z.string().trim().max(30).optional().default(""),
  email: z
    .string()
    .trim()
    .max(120)
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "E-mail inválido.",
    )
    .optional()
    .default(""),
  address: z
    .string()
    .trim()
    .max(160, "Use no máximo 160 caracteres.")
    .optional()
    .default(""),
  city: z
    .string()
    .trim()
    .max(60, "Use no máximo 60 caracteres.")
    .optional()
    .default(""),
  hours: z.unknown().optional(),
});

export async function saveInfoAction(
  input: z.input<typeof infoSchema>,
): Promise<ActionResult> {
  const parsed = infoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    };
  }

  const { supabase, userId } = await requireUser("/app/informacoes");

  const whatsapp = parsed.data.whatsapp
    ? phoneDigits(parsed.data.whatsapp)
    : null;
  if (parsed.data.whatsapp && (!whatsapp || whatsapp.length > 15)) {
    return { ok: false, error: "Confira o WhatsApp: informe DDD e número." };
  }

  const phone = parsed.data.phone ? phoneDigits(parsed.data.phone) : null;
  if (parsed.data.phone && (!phone || phone.length > 15)) {
    return { ok: false, error: "Confira o telefone: informe DDD e número." };
  }

  const avatarPath = parsed.data.avatar_path || null;
  if (avatarPath && !avatarPath.startsWith(`${userId}/`)) {
    return { ok: false, error: "Caminho de imagem inválido." };
  }

  const hours =
    parsed.data.hours === null || parsed.data.hours === undefined
      ? null
      : parseHours(parsed.data.hours);
  if (parsed.data.hours !== null && parsed.data.hours !== undefined && !hours) {
    return { ok: false, error: "Horários inválidos. Confira as faixas." };
  }

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, whatsapp")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) return { ok: false, error: "Página não encontrada." };

  const { error } = await supabase
    .from("pages")
    .update({
      business_name: parsed.data.business_name,
      kind: parsed.data.kind || null,
      bio: parsed.data.bio || null,
      avatar_path: avatarPath,
      whatsapp,
      phone,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      hours,
    })
    .eq("id", page.id);

  if (error) return { ok: false, error: friendlyDbError(error.message) };

  // The page's WhatsApp button uses the WhatsApp link card when there is one,
  // so a new number must also reach the cards that pointed to the old one.
  const touchedLinks = await syncWhatsappLinks(
    supabase,
    page.id,
    phoneDigits(page.whatsapp),
    whatsapp,
  );

  refreshPublicPage(page.slug, touchedLinks);
  return { ok: true };
}

async function syncWhatsappLinks(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  pageId: string,
  oldDigits: string | null,
  newDigits: string | null,
): Promise<string[]> {
  if (!oldDigits || oldDigits === newDigits) return [];

  const { data: links } = await supabase
    .from("links")
    .select("id, url")
    .eq("page_id", pageId)
    .eq("kind", "whatsapp");

  const touched: string[] = [];
  for (const link of links ?? []) {
    // Same check either way: only cards that pointed to the old number.
    const retargeted = retargetWhatsappUrl(
      link.url,
      oldDigits,
      newDigits ?? oldDigits,
    );
    if (!retargeted) continue;
    const patch = newDigits ? { url: retargeted } : { active: false };
    const { error } = await supabase
      .from("links")
      .update(patch)
      .eq("id", link.id)
      .eq("page_id", pageId);
    if (!error) touched.push(link.id);
  }
  return touched;
}

export async function changeSlugAction(
  rawSlug: string,
): Promise<ActionResult<{ slug: string }>> {
  const nextSlug = finalizeSlug(rawSlug);
  if (!isValidSlug(nextSlug)) {
    return {
      ok: false,
      error:
        "Use de 3 a 30 letras minúsculas, números ou hífen (sem hífen duplo ou nas pontas).",
    };
  }

  const { supabase, userId } = await requireUser("/app/informacoes");

  const { data: page } = await supabase
    .from("pages")
    .select("id, slug")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!page) return { ok: false, error: "Página não encontrada." };
  if (page.slug === nextSlug) return { ok: true, data: { slug: nextSlug } };

  const { error } = await supabase
    .from("pages")
    .update({ slug: nextSlug })
    .eq("id", page.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Esse endereço já está em uso." };
    }
    return { ok: false, error: friendlyDbError(error.message) };
  }

  // Revalidate both old and new public page cache tags!
  refreshPublicPage(page.slug);
  refreshPublicPage(nextSlug);
  return { ok: true, data: { slug: nextSlug } };
}
