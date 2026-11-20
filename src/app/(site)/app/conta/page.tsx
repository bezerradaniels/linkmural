import type { Metadata } from "next";
import { getPanelContext } from "@/lib/panel-data";
import { AccountForm } from "./account-form";

export const metadata: Metadata = {
  title: "Minha conta",
};

export default async function ContaPage() {
  const { profile, email, page } = await getPanelContext();

  return (
    <AccountForm
      initialName={profile.full_name ?? ""}
      email={email ?? ""}
      slug={page.slug}
    />
  );
}
