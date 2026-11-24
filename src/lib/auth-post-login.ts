import type { User } from "@supabase/supabase-js";
import {
  isFirstSignIn,
  notifyAdminNewUser,
} from "@/lib/email/admin-notifications";
import { recordOnboardingEvent } from "@/lib/onboarding-events";

const ORIGIN_KEYS = [
  "referer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** Records origin attribution and notifies admin on a user's first sign-in. */
export async function handleFirstSignIn(
  user: User | null,
  rawOriginCookie?: string,
) {
  if (!user || !isFirstSignIn(user)) return;

  const provider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : null;

  if (rawOriginCookie) {
    try {
      const parsedOrigin = JSON.parse(rawOriginCookie) as Record<
        string,
        unknown
      >;
      const cleanMeta: Record<string, string> = {};
      for (const k of ORIGIN_KEYS) {
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
