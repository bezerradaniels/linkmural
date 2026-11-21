import "server-only";
import { PLANS, formatBrl } from "@/lib/plans";
import { siteUrl } from "@/lib/redirect";
import { createAdminClient } from "@/utils/supabase/admin";
import { escapeHtml, sendEmail } from "./send";

/**
 * Sends the one-time "Você chegou ao limite do Grátis" email when a Free user
 * reaches 5 links on their page (docs/HANDOFF.md §14).
 * Deduplicated per user via `email_logs` (`kind = 'free_link_limit'`).
 */
export async function sendFreeLinkLimitEmail(params: {
  userId: string;
  pageId: string;
  to: string | null | undefined;
  businessName: string;
}): Promise<boolean> {
  if (!params.to) return false;
  if (!process.env.RESEND_API_KEY) return false;

  const admin = createAdminClient();
  const { error: logErr } = await admin.from("email_logs").insert({
    user_id: params.userId,
    page_id: params.pageId,
    kind: "free_link_limit",
  });
  // Already sent (unique violation) or DB error → skip without throwing.
  if (logErr) return false;

  const planUrl = `${siteUrl()}/app/plano`;
  const name = escapeHtml(params.businessName.trim() || "sua página");
  const maxFree = PLANS.free.maxLinks ?? 5;
  const proMonthly = formatBrl(PLANS.pro.price.monthly);
  const proYearly = formatBrl(PLANS.pro.price.yearly);

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
      <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural</p>
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Você chegou ao limite de ${maxFree} links do plano Grátis</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#6B6B66;">
          A página de <strong style="color:#0E0E0E;">${name}</strong> já está com ${maxFree} links ativos — sinal de que seu mural está crescendo!
        </p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#6B6B66;">
          Com o <strong style="color:#0E0E0E;">Linkmural Pro</strong> (${proMonthly}/mês ou ${proYearly}/ano no lançamento), você libera links ilimitados, personalização completa de fonte e cores, métricas por link e pode remover a marca do rodapé.
        </p>
        <p style="margin:24px 0 0;text-align:center;">
          <a href="${escapeHtml(planUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
            Conhecer o Linkmural Pro
          </a>
        </p>
      </div>
    </div>
  `.trim();

  const sent = await sendEmail({
    to: params.to,
    subject: "Você chegou ao limite de 5 links do plano Grátis",
    html,
    context: "free-link-limit",
  });

  if (!sent) {
    await admin
      .from("email_logs")
      .delete()
      .eq("user_id", params.userId)
      .eq("kind", "free_link_limit");
  }

  return sent;
}
