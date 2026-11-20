"use server";

import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { linkTag, pageTag } from "@/lib/public-page";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Json } from "@/utils/supabase/types";

type AdminResult = { ok: true } | { ok: false; error: string };

function expireTag(tag: string) {
  try {
    updateTag(tag);
  } catch {
    revalidateTag(tag, "max");
  }
}

async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, Json>;
}) {
  try {
    await createAdminClient()
      .from("admin_actions")
      .insert({
        admin_id: params.adminId,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        details: params.details ?? {},
      });
  } catch (err) {
    console.error("[admin_actions] log failed:", err);
  }
}

const uuidSchema = z.string().uuid();

export async function suspendUserAction(userId: string): Promise<AdminResult> {
  if (!uuidSchema.safeParse(userId).success) {
    return { ok: false, error: "Usuário inválido." };
  }
  const { userId: adminId } = await requireAdmin();
  if (userId === adminId) {
    return { ok: false, error: "Você não pode suspender a própria conta." };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: profErr } = await admin
    .from("profiles")
    .update({ suspended_at: now })
    .eq("id", userId);
  if (profErr) return { ok: false, error: profErr.message };

  // Only pages that are not blocked yet: pages blocked earlier by moderation
  // must stay blocked when the account is reactivated.
  const { data: pages } = await admin
    .from("pages")
    .update({ blocked_at: now })
    .eq("owner_id", userId)
    .is("blocked_at", null)
    .select("id, slug");

  for (const p of pages ?? []) expireTag(pageTag(p.slug));

  await logAdminAction({
    adminId,
    action: "suspend_user",
    targetType: "profile",
    targetId: userId,
    details: {
      blocked_pages: (pages ?? []).map((p) => p.slug),
      blocked_page_ids: (pages ?? []).map((p) => p.id),
    },
  });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function reactivateUserAction(
  userId: string,
): Promise<AdminResult> {
  if (!uuidSchema.safeParse(userId).success) {
    return { ok: false, error: "Usuário inválido." };
  }
  const { userId: adminId } = await requireAdmin();
  const admin = createAdminClient();

  const { error: profErr } = await admin
    .from("profiles")
    .update({ suspended_at: null })
    .eq("id", userId);
  if (profErr) return { ok: false, error: profErr.message };

  // Unblock only the pages this account's last suspension blocked.
  const { data: lastSuspension } = await admin
    .from("admin_actions")
    .select("details")
    .eq("action", "suspend_user")
    .eq("target_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const details = (lastSuspension?.details ?? {}) as {
    blocked_page_ids?: unknown;
  };
  const pageIds = Array.isArray(details.blocked_page_ids)
    ? details.blocked_page_ids.filter(
        (id): id is string => uuidSchema.safeParse(id).success,
      )
    : [];

  const { data: pages } = pageIds.length
    ? await admin
        .from("pages")
        .update({ blocked_at: null })
        .eq("owner_id", userId)
        .in("id", pageIds)
        .select("id, slug")
    : { data: [] as { id: string; slug: string }[] };

  for (const p of pages ?? []) expireTag(pageTag(p.slug));

  await logAdminAction({
    adminId,
    action: "reactivate_user",
    targetType: "profile",
    targetId: userId,
    details: { unblocked_pages: (pages ?? []).map((p) => p.slug) },
  });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function blockPageAction(
  pageId: string,
  reportId?: string,
): Promise<AdminResult> {
  if (!uuidSchema.safeParse(pageId).success) {
    return { ok: false, error: "Página inválida." };
  }
  const { userId: adminId } = await requireAdmin();
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: page, error } = await admin
    .from("pages")
    .update({ blocked_at: now })
    .eq("id", pageId)
    .select("id, slug")
    .maybeSingle();

  if (error || !page) {
    return { ok: false, error: error?.message ?? "Página não encontrada." };
  }

  if (reportId && uuidSchema.safeParse(reportId).success) {
    await admin
      .from("reports")
      .update({ status: "actioned", resolved_at: now })
      .eq("id", reportId);
  }

  expireTag(pageTag(page.slug));

  await logAdminAction({
    adminId,
    action: "block_page",
    targetType: "page",
    targetId: page.id,
    details: { slug: page.slug, report_id: reportId ?? null },
  });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function unblockPageAction(pageId: string): Promise<AdminResult> {
  if (!uuidSchema.safeParse(pageId).success) {
    return { ok: false, error: "Página inválida." };
  }
  const { userId: adminId } = await requireAdmin();
  const admin = createAdminClient();

  const { data: page, error } = await admin
    .from("pages")
    .update({ blocked_at: null })
    .eq("id", pageId)
    .select("id, slug")
    .maybeSingle();

  if (error || !page) {
    return { ok: false, error: error?.message ?? "Página não encontrada." };
  }

  expireTag(pageTag(page.slug));

  await logAdminAction({
    adminId,
    action: "unblock_page",
    targetType: "page",
    targetId: page.id,
    details: { slug: page.slug },
  });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function flagLinkAction(
  linkId: string,
  pageSlug: string,
): Promise<AdminResult> {
  if (!uuidSchema.safeParse(linkId).success) {
    return { ok: false, error: "Link inválido." };
  }
  const { userId: adminId } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("links")
    .update({ flagged_at: new Date().toISOString() })
    .eq("id", linkId);

  if (error) return { ok: false, error: error.message };

  expireTag(linkTag(linkId));
  expireTag(pageTag(pageSlug));

  await logAdminAction({
    adminId,
    action: "flag_link",
    targetType: "link",
    targetId: linkId,
    details: { slug: pageSlug },
  });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function dismissReportAction(
  reportId: string,
): Promise<AdminResult> {
  if (!uuidSchema.safeParse(reportId).success) {
    return { ok: false, error: "Denúncia inválida." };
  }
  const { userId: adminId } = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("reports")
    .update({ status: "dismissed", resolved_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction({
    adminId,
    action: "dismiss_report",
    targetType: "report",
    targetId: reportId,
  });

  revalidatePath("/admin", "layout");
  return { ok: true };
}
