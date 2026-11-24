import { type NextRequest, NextResponse } from "next/server";
import { isProductionHost } from "@/lib/seo";
import { updateSession } from "@/utils/supabase/proxy";

// No Next.js 16 o antigo "middleware" se chama "proxy".

/** Routes that use the login session. Public pages skip it (docs/HANDOFF.md §4). */
const SESSION_PREFIXES = [
  "/app",
  "/editor",
  "/onboarding",
  "/admin",
  "/entrar",
  "/auth",
];

const ORIGIN_COOKIE = "lm_origin";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function captureOriginCookie(
  request: NextRequest,
  response: NextResponse,
  host: string,
) {
  const { searchParams } = request.nextUrl;
  const hasUtm = UTM_KEYS.some((k) => Boolean(searchParams.get(k)?.trim()));
  const rawReferer = request.headers.get("referer")?.trim() ?? "";
  let externalReferer = "";
  if (rawReferer) {
    try {
      const refUrl = new URL(rawReferer);
      if (refUrl.host && refUrl.host !== host) {
        externalReferer = rawReferer.slice(0, 512);
      }
    } catch {
      // Ignore malformed referer header
    }
  }

  // Only overwrite if incoming request has UTMs, or set first-touch if no cookie yet.
  const existing = request.cookies.get(ORIGIN_COOKIE)?.value;
  if (!hasUtm && (existing || !externalReferer)) return;

  const payload: Record<string, string> = {};
  if (externalReferer) payload.referer = externalReferer;
  else if (hasUtm) payload.referer = request.nextUrl.search.slice(1, 512);

  for (const key of UTM_KEYS) {
    const val = searchParams.get(key)?.trim();
    if (val) payload[key] = val.slice(0, 120);
  }

  if (Object.keys(payload).length === 0) return;

  response.cookies.set(ORIGIN_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsSession = SESSION_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const response = needsSession
    ? await updateSession(request)
    : NextResponse.next();

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;
  if (!isProductionHost(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  captureOriginCookie(request, response, host);

  return response;
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos, imagens e favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
