"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { handleFirstSignIn } from "@/lib/auth-post-login";
import {
  isPlanDestination,
  NEXT_COOKIE,
  POST_ONBOARDING_COOKIE,
  safeNext,
  siteUrl,
} from "@/lib/redirect";
import { createClient } from "@/utils/supabase/server";

export type EmailState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email?: string };

export type VerifyOtpState =
  | { status: "idle" }
  | { status: "error"; message: string };

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  next: z.string().optional(),
});

function callbackUrl(next: string) {
  return `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Sends a magic link. Creates the account on first use. */
export async function signInWithEmail(
  _prev: EmailState,
  formData: FormData,
): Promise<EmailState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira o e-mail: parece que falta alguma coisa.",
      email: String(formData.get("email") ?? ""),
    };
  }

  const { email } = parsed.data;
  const next = safeNext(parsed.data.next);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true },
  });

  if (error) {
    const tooMany =
      error.status === 429 || error.code === "over_email_send_rate_limit";
    return {
      status: "error",
      email,
      message: tooMany
        ? "Muitos pedidos seguidos. Espere um minuto e tente de novo."
        : "Não conseguimos enviar o link agora. Tente de novo em instantes.",
    };
  }

  // The link may open in another tab; remember where to go for 30 minutes.
  (await cookies()).set(NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 30,
    path: "/",
  });

  return { status: "sent", email };
}

/** Starts Google sign-in and sends the browser to Google. */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) {
    redirect(`/entrar?erro=google&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}

const otpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{6,8}$/)),
  next: z.string().optional(),
});

/** Verifies the 6-digit email OTP code and signs the user in. */
export async function verifyEmailOtp(
  _prev: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const parsed = otpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Digite o código numérico enviado para o seu e-mail.",
    };
  }

  const { email, token } = parsed.data;
  const cookieStore = await cookies();
  const next = safeNext(
    parsed.data.next ?? cookieStore.get(NEXT_COOKIE)?.value,
  );
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.user) {
    return {
      status: "error",
      message:
        "Código inválido ou expirado. Confira os números ou peça um novo link.",
    };
  }

  await handleFirstSignIn(data.user, cookieStore.get("lm_origin")?.value);
  cookieStore.delete(NEXT_COOKIE);

  if (isPlanDestination(next)) {
    cookieStore.set(POST_ONBOARDING_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2,
      path: "/",
    });
  }

  redirect(next);
}
