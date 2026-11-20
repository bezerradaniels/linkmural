import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

// No Next.js 16 o antigo "middleware" se chama "proxy".
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos, imagens e favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
