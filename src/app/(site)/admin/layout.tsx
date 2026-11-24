import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { AdminShell } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/admin";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Admin · linkmural",
    template: "%s · Admin · linkmural",
  },
  robots: { index: false, follow: false },
};

function getSpGreetingAndDate() {
  const now = new Date();
  const hourStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const hour = Number(hourStr);
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  const todayIso = `${y}-${m}-${d}`;

  return { greeting, todayIso };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, email } = await requireAdmin();
  const admin = createAdminClient();
  const { greeting, todayIso } = getSpGreetingAndDate();

  const [profileRes, openReportsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  return (
    <div className={`${figtree.className} font-medium`}>
      <AdminShell
        email={email}
        fullName={profileRes.data?.full_name ?? null}
        openReportsCount={openReportsRes.count ?? 0}
        greeting={greeting}
        todayIso={todayIso}
      >
        {children}
      </AdminShell>
    </div>
  );
}
