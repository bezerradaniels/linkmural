import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "Admin · linkmural",
    template: "%s · Admin · linkmural",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { email } = await requireAdmin();
  return <AdminShell email={email}>{children}</AdminShell>;
}
