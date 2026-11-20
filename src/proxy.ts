import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

// No Next.js 16 o antigo "middleware" se chama "proxy".

/** Routes that use the login session. Public pages skip it (docs/HANDOFF.md §4). */
const SESSION_PREFIXES = ["/app", "/onboarding", "/admin", "/entrar", "/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsSession = SESSION_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsSession) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos, imagens e favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
