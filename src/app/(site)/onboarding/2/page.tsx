import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function OnboardingStep2Page({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/onboarding/iniciar");
  }

  const params = await searchParams;
  if (params.erro) {
    redirect(`/cadastro?erro=${encodeURIComponent(params.erro)}`);
  }
  redirect("/cadastro");
}
