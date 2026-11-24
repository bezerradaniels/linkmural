"use server";

import { z } from "zod";
import { finalizeSlug, isFamousBrandSlug } from "@/lib/slug";
import { createAdminClient } from "@/utils/supabase/admin";

export type BrandRequestState =
  | { status: "idle" }
  | { status: "sent"; slug: string }
  | { status: "error"; message: string };

const brandRequestSchema = z.object({
  slug: z.string().trim().min(2).max(40),
  email: z.string().trim().toLowerCase().email(),
  notes: z.string().trim().max(400).optional(),
});

/** Submits a brand-owner request for a protected famous brand slug to the admin portal. */
export async function requestBrandSlugAction(
  _prev: BrandRequestState,
  formData: FormData,
): Promise<BrandRequestState> {
  const parsed = brandRequestSchema.safeParse({
    slug: formData.get("slug"),
    email: formData.get("email"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um e-mail corporativo válido para solicitar a marca.",
    };
  }

  const slug = finalizeSlug(parsed.data.slug);
  if (!slug || !isFamousBrandSlug(slug)) {
    return {
      status: "error",
      message: "Endereço inválido para solicitação de marca.",
    };
  }

  const details = parsed.data.notes ? ` · Detalhes: ${parsed.data.notes}` : "";
  const message = `[SOLICITAÇÃO DE MARCA: /${slug}] E-mail: ${parsed.data.email}${details}`;

  const admin = createAdminClient();
  const { error } = await admin.from("feedback").insert({
    message: message.slice(0, 2000),
    status: "open",
  });

  if (error) {
    return {
      status: "error",
      message: "Não conseguimos registrar sua solicitação agora. Tente em instantes.",
    };
  }

  return { status: "sent", slug };
}
