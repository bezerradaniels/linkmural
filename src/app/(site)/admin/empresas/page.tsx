import type { Metadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { EmpresasTable } from "./empresas-table";

export const metadata: Metadata = {
  title: "Empresas",
};

export default async function AdminEmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const admin = createAdminClient();

  const [profilesRes, pagesRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, email, plan, role, created_at, suspended_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("pages")
      .select("id, owner_id, slug, business_name, published, blocked_at")
      .order("created_at", { ascending: false })
      .limit(400),
  ]);

  const pagesByOwner = new Map<
    string,
    {
      id: string;
      slug: string;
      business_name: string;
      published: boolean;
      blocked_at: string | null;
    }[]
  >();
  for (const p of pagesRes.data ?? []) {
    const arr = pagesByOwner.get(p.owner_id) ?? [];
    arr.push(p);
    pagesByOwner.set(p.owner_id, arr);
  }

  const rows = (profilesRes.data ?? [])
    .map((prof) => {
      const pages = pagesByOwner.get(prof.id) ?? [];
      const primary = pages[0] ?? null;
      return {
        id: prof.id,
        full_name: prof.full_name,
        email: prof.email,
        plan: prof.plan,
        role: prof.role,
        created_at: prof.created_at,
        suspended_at: prof.suspended_at,
        slug: primary?.slug ?? null,
        business_name: primary?.business_name ?? null,
        published: primary?.published ?? false,
        blocked: Boolean(primary?.blocked_at),
      };
    })
    .filter((row) => {
      if (!query) return true;
      return (
        (row.business_name ?? "").toLowerCase().includes(query) ||
        (row.full_name ?? "").toLowerCase().includes(query) ||
        (row.email ?? "").toLowerCase().includes(query) ||
        (row.slug ?? "").toLowerCase().includes(query)
      );
    });

  return <EmpresasTable initialQuery={q} rows={rows} />;
}
