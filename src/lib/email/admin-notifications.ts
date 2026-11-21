import "server-only";
import { siteUrl } from "@/lib/redirect";
import { escapeHtml, sendEmail } from "./send";

const FIRST_SIGN_IN_WINDOW_MS = 15 * 60 * 1000;

function adminNotifyEmail(): string | null {
  const email = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  return email || null;
}

/**
 * Checks whether an auth user just completed their first sign-in (created_at
 * and last_sign_in_at are missing or within 15 minutes of each other).
 */
export function isFirstSignIn(user: {
  created_at?: string | null;
  last_sign_in_at?: string | null;
}): boolean {
  if (!user.created_at) return false;
  if (!user.last_sign_in_at) return true;
  const created = Date.parse(user.created_at);
  const lastSignIn = Date.parse(user.last_sign_in_at);
  if (Number.isNaN(created) || Number.isNaN(lastSignIn)) return false;
  return Math.abs(lastSignIn - created) <= FIRST_SIGN_IN_WINDOW_MS;
}

/**
 * Notifies the admin via Resend when a new user registers.
 * Skips silently when ADMIN_NOTIFY_EMAIL is not configured.
 */
export async function notifyAdminNewUser(params: {
  userId: string;
  email: string | null | undefined;
  provider?: string | null;
}): Promise<boolean> {
  const to = adminNotifyEmail();
  if (!to) return false;

  const emailText = params.email?.trim() || "(sem e-mail)";
  const providerText = params.provider?.trim() || "desconhecido";
  const adminUrl = `${siteUrl()}/admin/empresas`;

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:24px 16px;color:#0E0E0E;">
      <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:24px;border:1px solid #E2E2DC;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural · admin</p>
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Novo usuário cadastrado</h1>
        <p style="margin:0 0 8px;font-size:14px;"><strong>E-mail:</strong> ${escapeHtml(emailText)}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Provedor:</strong> ${escapeHtml(providerText)}</p>
        <p style="margin:0 0 16px;font-size:12px;color:#6B6B66;"><strong>ID:</strong> ${escapeHtml(params.userId)}</p>
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;text-decoration:none;">
          Ver empresas no admin
        </a>
      </div>
    </div>
  `.trim();

  return sendEmail({
    to,
    subject: `[linkmural] Novo cadastro: ${emailText}`,
    html,
    context: "admin-new-user",
  });
}

function formatAmount(amountTotal: number | null, currency: string | null): string | null {
  if (amountTotal === null || !currency) return null;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountTotal / 100);
  } catch {
    return `${(amountTotal / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

/**
 * Notifies the admin via Resend when a customer completes a new subscription checkout.
 * Skips silently when ADMIN_NOTIFY_EMAIL is not configured.
 */
export async function notifyAdminNewSubscriber(params: {
  userId: string;
  email: string | null | undefined;
  plan: string;
  interval: string | null | undefined;
  amountTotal?: number | null;
  currency?: string | null;
  subscriptionId: string;
}): Promise<boolean> {
  const to = adminNotifyEmail();
  if (!to) return false;

  const emailText = params.email?.trim() || "(sem e-mail)";
  const planLabel = params.plan === "business" ? "Negócios" : "Pro";
  const intervalLabel =
    params.interval === "month"
      ? "mensal"
      : params.interval === "year"
        ? "anual"
        : "recorrente";
  const amountText = formatAmount(params.amountTotal ?? null, params.currency ?? null);
  const adminUrl = `${siteUrl()}/admin`;

  const html = `
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:24px 16px;color:#0E0E0E;">
      <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:24px;border:1px solid #E2E2DC;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural · admin</p>
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Novo pagante no Linkmural!</h1>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Plano:</strong> ${escapeHtml(planLabel)} (${escapeHtml(intervalLabel)})</p>
        ${amountText ? `<p style="margin:0 0 8px;font-size:14px;"><strong>Valor cobrado:</strong> ${escapeHtml(amountText)}</p>` : ""}
        <p style="margin:0 0 8px;font-size:14px;"><strong>E-mail:</strong> ${escapeHtml(emailText)}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#6B6B66;"><strong>Usuário:</strong> ${escapeHtml(params.userId)}</p>
        <p style="margin:0 0 16px;font-size:12px;color:#6B6B66;"><strong>Assinatura:</strong> ${escapeHtml(params.subscriptionId)}</p>
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;text-decoration:none;">
          Abrir painel admin
        </a>
      </div>
    </div>
  `.trim();

  return sendEmail({
    to,
    subject: `[linkmural] Novo pagante: ${planLabel} (${intervalLabel})`,
    html,
    context: "admin-new-subscriber",
  });
}
