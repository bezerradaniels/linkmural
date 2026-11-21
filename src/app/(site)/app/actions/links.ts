"use server";

import { after } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sendFreeLinkLimitEmail } from "@/lib/email/link-limit";
import { sendPagePublishedEmail } from "@/lib/email/page-published";
import { detectLink, linkUrlSchema } from "@/lib/link-detect";
import { friendlyDbError } from "@/lib/onboarding";
import { pageActionsSchema } from "@/lib/panel-helpers";
import { PLANS } from "@/lib/plans";
import { checkSafeUrl } from "@/lib/safe-browsing";
import type { Tables, TablesUpdate } from "@/utils/supabase/types";
import { refreshPublicPage } from "./revalidate";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | {
      ok: false;
      error: string;
      code?: "plan_limit_links" | "plan_limit_pages";
    };

async function getOwnedPage(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
) {
  const { data } = await supabase
    .from("pages")
    .select("id, slug, business_name, published")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

const linkInputSchema = z.object({
  title: z.string().trim().min(1, "Digite um título.").max(80),
  subtitle: z.string().trim().max(120).optional().default(""),
  url: linkUrlSchema,
  icon: z
    .string()
    .regex(/^(si|lm):[a-z0-9-]+$/)
    .optional(),
  featured: z.boolean().optional().default(false),
});

export async function createLinkAction(
  input: z.input<typeof linkInputSchema>,
): Promise<ActionResult<Tables<"links">>> {
  const parsed = linkInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Confira os dados do link.",
    };
  }

  const { supabase, userId, email } = await requireUser("/app/pagina");
  const page = await getOwnedPage(supabase, userId);
  if (!page) return { ok: false, error: "Página não encontrada." };

  const detected = detectLink(parsed.data.url);
  if (!detected) {
    return { ok: false, error: "Esse endereço não parece válido." };
  }

  const safety = await checkSafeUrl(detected.url);
  if (!safety.safe) {
    return { ok: false, error: safety.reason };
  }

  const { data: last } = await supabase
    .from("links")
    .select("position")
    .eq("page_id", page.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (last?.position ?? -1) + 1;

  if (parsed.data.featured) {
    await supabase
      .from("links")
      .update({ featured: false })
      .eq("page_id", page.id)
      .eq("featured", true);
  }

  const { data: created, error } = await supabase
    .from("links")
    .insert({
      page_id: page.id,
      kind: detected.kind,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      url: detected.url,
      icon: parsed.data.icon ?? detected.icon,
      featured: parsed.data.featured,
      position: nextPosition,
      active: true,
    })
    .select("*")
    .single();

  if (error || !created) {
    const isLimit = error?.message.includes("plan_limit_links");
    return {
      ok: false,
      error: friendlyDbError(error?.message),
      code: isLimit ? "plan_limit_links" : undefined,
    };
  }

  refreshPublicPage(page.slug, [created.id]);

  // One-time email when a Free user hits the 5-link cap (docs/HANDOFF.md §14).
  const freeLimit = PLANS.free.maxLinks ?? 5;
  const [{ count: totalLinks }, { data: prof }] = await Promise.all([
    supabase
      .from("links")
      .select("id", { count: "exact", head: true })
      .eq("page_id", page.id),
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
  ]);
  if ((prof?.plan ?? "free") === "free" && (totalLinks ?? 0) >= freeLimit) {
    after(() =>
      sendFreeLinkLimitEmail({
        userId,
        pageId: page.id,
        to: email,
        businessName: page.business_name || page.slug,
      }),
    );
  }

  return { ok: true, data: created };
}

const updateLinkSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Digite um título.").max(80).optional(),
  subtitle: z.string().trim().max(120).nullable().optional(),
  url: linkUrlSchema.optional(),
  icon: z
    .string()
    .regex(/^(si|lm):[a-z0-9-]+$/)
    .optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export async function updateLinkAction(
  input: z.input<typeof updateLinkSchema>,
): Promise<ActionResult<Tables<"links">>> {
  const parsed = updateLinkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Confira os dados do link.",
    };
  }

  const { supabase, userId } = await requireUser("/app/pagina");
  const page = await getOwnedPage(supabase, userId);
  if (!page) return { ok: false, error: "Página não encontrada." };

  const patch: TablesUpdate<"links"> = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.subtitle !== undefined) {
    patch.subtitle = parsed.data.subtitle?.trim() || null;
  }
  if (parsed.data.url !== undefined) {
    const detected = detectLink(parsed.data.url);
    if (!detected) return { ok: false, error: "Endereço inválido." };
    const safety = await checkSafeUrl(detected.url);
    if (!safety.safe) return { ok: false, error: safety.reason };
    patch.url = detected.url;
    patch.kind = detected.kind;
  }
  if (parsed.data.icon !== undefined) patch.icon = parsed.data.icon;
  if (parsed.data.active !== undefined) patch.active = parsed.data.active;
  if (parsed.data.featured !== undefined) {
    if (parsed.data.featured) {
      await supabase
        .from("links")
        .update({ featured: false })
        .eq("page_id", page.id)
        .eq("featured", true)
        .neq("id", parsed.data.id);
    }
    patch.featured = parsed.data.featured;
  }

  const { data: updated, error } = await supabase
    .from("links")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("page_id", page.id)
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: friendlyDbError(error?.message) };
  }

  refreshPublicPage(page.slug, [updated.id]);
  return { ok: true, data: updated };
}

export async function deleteLinkAction(
  linkId: string,
): Promise<ActionResult<Tables<"links">>> {
  if (!z.string().uuid().safeParse(linkId).success) {
    return { ok: false, error: "Link inválido." };
  }

  const { supabase, userId } = await requireUser("/app/pagina");
  const page = await getOwnedPage(supabase, userId);
  if (!page) return { ok: false, error: "Página não encontrada." };

  const { data: deleted, error } = await supabase
    .from("links")
    .delete()
    .eq("id", linkId)
    .eq("page_id", page.id)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: friendlyDbError(error.message) };

  refreshPublicPage(page.slug, [linkId]);
  return { ok: true, data: deleted ?? undefined };
}

const restoreLinkSchema = z.object({
  // Accepted for compatibility but ignored: the kind is re-derived from the URL.
  kind: z
    .enum(["link", "whatsapp", "contact", "pix", "email", "phone", "map"])
    .optional(),
  title: z.string().trim().min(1).max(80),
  subtitle: z.string().trim().max(120).nullable(),
  url: linkUrlSchema,
  icon: z
    .string()
    .regex(/^(si|lm):[a-z0-9-]+$/)
    .nullable(),
  featured: z.boolean(),
  position: z.number().int().min(0).max(1000),
  active: z.boolean(),
});

/**
 * "Desfazer" after a delete. The payload comes from the browser, so it goes
 * through the same checks as a new link; kind and URL are re-derived.
 */
export async function restoreLinkAction(
  link: z.input<typeof restoreLinkSchema>,
): Promise<ActionResult<Tables<"links">>> {
  const parsed = restoreLinkSchema.safeParse(link);
  if (!parsed.success)
    return { ok: false, error: "Não foi possível desfazer." };
  const detected = detectLink(parsed.data.url);
  if (!detected) return { ok: false, error: "Não foi possível desfazer." };

  const { supabase, userId } = await requireUser("/app/pagina");
  const page = await getOwnedPage(supabase, userId);
  if (!page) return { ok: false, error: "Página não encontrada." };

  const { data: restored, error } = await supabase
    .from("links")
    .insert({
      page_id: page.id,
      kind: detected.kind,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      url: detected.url,
      icon: parsed.data.icon ?? detected.icon,
      featured: false,
      position: parsed.data.position,
      active: parsed.data.active,
    })
    .select("*")
    .single();

  if (error || !restored) {
    return { ok: false, error: friendlyDbError(error?.message) };
  }

  // Restore the pin only after the link is back, so a failed insert never
  // leaves the page without its featured link.
  if (parsed.data.featured && detected.kind !== "pix") {
    await supabase
      .from("links")
      .update({ featured: false })
      .eq("page_id", page.id)
      .eq("featured", true);
    await supabase
      .from("links")
      .update({ featured: true })
      .eq("id", restored.id)
      .eq("page_id", page.id);
    restored.featured = true;
  }

  refreshPublicPage(page.slug, [restored.id]);
  return { ok: true, data: restored };
}

const reorderSchema = z.array(z.string().uuid()).min(1).max(100);

export async function reorderLinksAction(
  orderedIds: string[],
): Promise<ActionResult> {
  const parsed = reorderSchema.safeParse(orderedIds);
  if (!parsed.success) return { ok: false, error: "Ordem inválida." };

  const { supabase, userId } = await requireUser("/app/pagina");
  const page = await getOwnedPage(supabase, userId);
  if (!page) return { ok: false, error: "Página não encontrada." };

  const updates = parsed.data.map((id, index) =>
    supabase
      .from("links")
      .update({ position: index })
      .eq("id", id)
      .eq("page_id", page.id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { ok: false, error: friendlyDbError(failed.error.message) };
  }

  refreshPublicPage(page.slug, parsed.data);
  return { ok: true };
}

export async function updatePageActionsAction(
  actions: z.infer<typeof pageActionsSchema>,
): Promise<ActionResult> {
  const parsed = pageActionsSchema.safeParse(actions);
  if (!parsed.success) return { ok: false, error: "Configuração inválida." };

  const { supabase, userId } = await requireUser("/app/pagina");
  const page = await getOwnedPage(supabase, userId);
  if (!page) return { ok: false, error: "Página não encontrada." };

  const { error } = await supabase
    .from("pages")
    .update({ actions: parsed.data })
    .eq("id", page.id);

  if (error) return { ok: false, error: friendlyDbError(error.message) };

  refreshPublicPage(page.slug);
  return { ok: true };
}

export async function publishDraftPageAction(): Promise<ActionResult> {
  const { supabase, userId, email } = await requireUser("/app");
  const page = await getOwnedPage(supabase, userId);
  if (!page) return { ok: false, error: "Página não encontrada." };

  const wasPublished = page.published;
  const { error } = await supabase
    .from("pages")
    .update({ published: true, onboarding_step: 8 })
    .eq("id", page.id);

  if (error) return { ok: false, error: friendlyDbError(error.message) };

  refreshPublicPage(page.slug);

  if (!wasPublished) {
    after(() =>
      sendPagePublishedEmail({
        to: email,
        businessName: page.business_name || page.slug,
        slug: page.slug,
      }),
    );
  }

  return { ok: true };
}
