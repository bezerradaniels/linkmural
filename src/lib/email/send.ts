import "server-only";

let warnedNoKey = false;

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends an email via Resend. Skips silently when RESEND_API_KEY is not
 * configured and never throws on delivery errors.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  context: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    if (!warnedNoKey) {
      console.warn(
        `[email] RESEND_API_KEY is not set; skipping '${params.context}' email.`,
      );
      warnedNoKey = true;
    }
    return false;
  }

  const from = process.env.EMAIL_FROM?.trim() || "Linkmural <oi@linkmural.com>";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error(`[email] Resend error (${params.context}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] failed to send '${params.context}' email:`, err);
    return false;
  }
}
