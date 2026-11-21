"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { deleteStripeCustomerForUser } from "@/lib/billing";
import { finalizeSlug } from "@/lib/slug";
import { createAdminClient } from "@/utils/supabase/admin";
import type { ActionResult } from "./links";
import { refreshPublicPage } from "./revalidate";

const nameSchema = z.string().trim().min(1, "Digite seu nome.").max(100);

export async function updateProfileNameAction(
  fullName: string,
): Promise<ActionResult> {
  const parsed = nameSchema.safeParse(fullName);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Nome inválido.",
    };
  }

  const { supabase, userId } = await requireUser("/app/conta");
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: "Não conseguimos salvar seu nome agora." };
  }

  revalidatePath("/app", "layout");
  return { ok: true };
}

/**
 * LGPD account deletion: verifies typed slug, deletes all files in
 * storage bucket `media/<userId>/`, deletes the auth user (cascade removes
 * profile, pages, links and metrics), signs out and redirects home.
 */
export async function deleteAccountAction(
  confirmSlug: string,
): Promise<ActionResult> {
  const { supabase, userId, email } = await requireUser("/app/conta");

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug")
    .eq("owner_id", userId);

  const primarySlug = pages?.[0]?.slug ?? "";
  if (primarySlug && finalizeSlug(confirmSlug) !== primarySlug) {
    return {
      ok: false,
      error: `Digite "${primarySlug}" para confirmar a exclusão.`,
    };
  }

  const admin = createAdminClient();

  // 0. Stop billing first: deleting the Stripe customer cancels its
  //    subscriptions. If that fails, the account stays so nobody is charged
  //    after deleting it.
  const billing = await deleteStripeCustomerForUser(userId);
  if (!billing.ok) {
    return {
      ok: false,
      error:
        "Não conseguimos cancelar a sua assinatura agora. Tente de novo em instantes.",
    };
  }

  // 1. Delete user's uploaded files in bucket "media/<userId>/"
  try {
    const { data: files } = await admin.storage.from("media").list(userId, {
      limit: 1000,
    });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await admin.storage.from("media").remove(paths);
    }
  } catch (err) {
    console.error("[delete-account] storage cleanup failed:", err);
  }

  // 2. Personal data outside the cascade: waitlist e-mails and feedback text
  try {
    await admin.from("waitlist").delete().eq("user_id", userId);
    // Exact match: the waitlist stores e-mails in lower case (no LIKE wildcards).
    if (email)
      await admin.from("waitlist").delete().eq("email", email.toLowerCase());
    await admin.from("feedback").delete().eq("user_id", userId);
  } catch (err) {
    console.error("[delete-account] waitlist/feedback cleanup failed:", err);
  }

  // 3. Delete auth user (Postgres ON DELETE CASCADE cleans up all related rows)
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    return {
      ok: false,
      error: "Não conseguimos excluir a conta agora. Tente de novo.",
    };
  }

  for (const p of pages ?? []) {
    refreshPublicPage(p.slug);
  }

  await supabase.auth.signOut();
  redirect("/?aviso=conta_excluida");
}
