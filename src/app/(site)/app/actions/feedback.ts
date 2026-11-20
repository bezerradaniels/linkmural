"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "./links";

const feedbackSchema = z
  .string()
  .trim()
  .min(3, "Escreva pelo menos 3 caracteres.")
  .max(2000, "Mensagem muito longa (máximo 2000 caracteres).");

export async function submitFeedbackAction(
  message: string,
): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse(message);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Mensagem inválida.",
    };
  }

  const { supabase, userId } = await requireUser("/app/ajuda");
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    page_id: page?.id ?? null,
    message: parsed.data,
  });

  if (error) {
    return {
      ok: false,
      error: "Não conseguimos enviar sua sugestão agora. Tente de novo.",
    };
  }

  return { ok: true };
}
