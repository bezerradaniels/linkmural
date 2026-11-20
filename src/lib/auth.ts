import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/** Returns the signed-in user's id and email, or sends them to /entrar. */
export async function requireUser(next = "/app") {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) {
    redirect(`/entrar?next=${encodeURIComponent(next)}`);
  }
  return {
    supabase,
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

/** Like requireUser, but also requires profiles.role = 'admin' (checked in the database). */
export async function requireAdmin() {
  const ctx = await requireUser("/admin");
  const { data: isAdmin, error } = await ctx.supabase.rpc("is_admin");
  if (error || !isAdmin) {
    redirect("/app");
  }
  return ctx;
}
