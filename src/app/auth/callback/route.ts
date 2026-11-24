import type { EmailOtpType, User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import {
  isFirstSignIn,
  notifyAdminNewUser,
} from "@/lib/email/admin-notifications";
import { recordOnboardingEvent } from "@/lib/onboarding-events";
import {
  isPlanDestination,
  NEXT_COOKIE,
  POST_ONBOARDING_COOKIE,
  safeNext,
  siteUrl,
} from "@/lib/redirect";
import { createClient } from "@/utils/supabase/server";

const EMAIL_TYPES: EmailOtpType[] = [
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
];

/**
 * Finishes sign-in for both flows:
 * - Google (and the default email template): ?code=… (PKCE)
 * - Email template with token hash: ?token_hash=…&type=email
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(
    searchParams.get("next") ?? request.cookies.get(NEXT_COOKIE)?.value,
  );

  const supabase = await createClient();
  let ok = false;
  let user: User | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    user = data?.user ?? null;
  } else if (tokenHash && type && EMAIL_TYPES.includes(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
    user = data?.user ?? null;
  }

  if (ok && user && isFirstSignIn(user)) {
    const provider =
      typeof user.app_metadata?.provider === "string"
        ? user.app_metadata.provider
        : null;

    const rawOrigin = request.cookies.get("lm_origin")?.value;
    if (rawOrigin) {
      try {
        const parsedOrigin = JSON.parse(rawOrigin) as Record<string, unknown>;
        const cleanMeta: Record<string, string> = {};
        for (const k of [
          "referer",
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
        ]) {
          if (typeof parsedOrigin[k] === "string" && parsedOrigin[k]) {
            cleanMeta[k] = parsedOrigin[k];
          }
        }
        if (Object.keys(cleanMeta).length > 0) {
          recordOnboardingEvent({
            event: "origem_capturada",
            userId: user.id,
            metadata: cleanMeta,
          });
        }
      } catch {
        // Ignore malformed cookie
      }
    }

    await notifyAdminNewUser({
      userId: user.id,
      email: user.email,
      provider,
    });
  }

  // Build the redirect from the public site URL: behind Hostinger's proxy,
  // request.nextUrl carries the internal host (0.0.0.0:3000).
  const target = new URL(ok ? next : "/entrar?erro=link", siteUrl());

  const response = NextResponse.redirect(target);
  response.cookies.delete(NEXT_COOKIE);

  // If the visitor arrived from "Assinar o Pro", remember the Plano URL so we
  // can send them back there right after they finish creating their page.
  if (ok && isPlanDestination(next)) {
    response.cookies.set(POST_ONBOARDING_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2,
      path: "/",
    });
  }

  return response;
}
