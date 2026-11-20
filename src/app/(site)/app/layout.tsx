import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { getPanelContext } from "@/lib/panel-data";
import { mediaUrl } from "@/lib/public-page";

export const metadata: Metadata = {
  title: {
    default: "Painel",
    template: "%s · Painel · linkmural",
  },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile, page, plan, email } = await getPanelContext();

  return (
    <AppShell
      businessName={page.business_name}
      slug={page.slug}
      avatarUrl={mediaUrl(page.avatar_path)}
      published={page.published}
      plan={plan}
      email={email}
      suspended={Boolean(profile.suspended_at)}
      isAdmin={profile.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
