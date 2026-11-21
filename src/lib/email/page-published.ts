import "server-only";
import { siteUrl } from "@/lib/redirect";
import { escapeHtml, sendEmail } from "./send";

/**
 * Sends the "Sua página está no ar" email via Resend with link and QR code.
 * Skips silently when RESEND_API_KEY is not configured.
 */
export async function sendPagePublishedEmail(params: {
  to: string | null | undefined;
  businessName: string;
  slug: string;
}) {
  if (!params.to) return;

  const base = siteUrl();
  const pageUrl = `${base}/${params.slug}`;
  const qrPngUrl = `${base}/${params.slug}/qr?format=png`;
  const panelUrl = `${base}/app`;
  const name = escapeHtml(params.businessName.trim() || params.slug);
  const safeUrl = escapeHtml(pageUrl);

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
      <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural</p>
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;">Sua página está no ar!</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#6B6B66;">
          <strong style="color:#0E0E0E;">${name}</strong> já pode ser acessada pelo seu link oficial:
        </p>
        <div style="background:#F4F4EF;border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:15px;font-weight:600;word-break:break-all;">
          <a href="${safeUrl}" style="color:#0E0E0E;text-decoration:none;">${safeUrl}</a>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <img src="${escapeHtml(qrPngUrl)}" alt="QR code de ${name}" width="180" height="180" style="border-radius:12px;border:1px solid #E2E2DC;" />
          <p style="margin:8px 0 0;font-size:12px;color:#6B6B66;">Imprima o QR code no balcão ou compartilhe com seus clientes.</p>
        </div>
        <p style="margin:24px 0 0;text-align:center;">
          <a href="${escapeHtml(panelUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
            Abrir meu painel
          </a>
        </p>
      </div>
    </div>
  `.trim();

  await sendEmail({
    to: params.to,
    subject: `Sua página está no ar: linkmural.com/${params.slug}`,
    html,
    context: "Sua página está no ar",
  });
}
