import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { NEXT_COOKIE, safeNext, siteUrl } from "@/lib/redirect";
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type && EMAIL_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  }

  // Build the redirect from the public site URL: behind Hostinger's proxy,
  // request.nextUrl carries the internal host (0.0.0.0:3000).
  const target = new URL(ok ? next : "/entrar?erro=link", siteUrl());

  const response = NextResponse.redirect(target);
  response.cookies.delete(NEXT_COOKIE);
  return response;
}
