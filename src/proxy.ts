import { type NextRequest, NextResponse } from "next/server";
import { isProductionHost } from "@/lib/seo";
import { updateSession } from "@/utils/supabase/proxy";

// No Next.js 16 o antigo "middleware" se chama "proxy".

/** Routes that use the login session. Public pages skip it (docs/HANDOFF.md §4). */
const SESSION_PREFIXES = ["/app", "/onboarding", "/admin", "/entrar", "/auth"];

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

  return response;
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos, imagens e favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
