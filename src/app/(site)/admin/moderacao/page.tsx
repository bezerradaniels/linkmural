import type { Metadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { ModerationQueue } from "./moderation-queue";

export const metadata: Metadata = {
  title: "Moderação",
};

export default async function AdminModeracaoPage() {
  const admin = createAdminClient();

  const { data: reports } = await admin
    .from("reports")
    .select(
      "id, reason, details, status, created_at, page_id, pages(id, slug, business_name, blocked_at, links(id, title, url, flagged_at))",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (reports ?? []).map((r) => {
    const page = Array.isArray(r.pages) ? r.pages[0] : r.pages;
    return {
      id: r.id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      created_at: r.created_at,
      page: page
        ? {
            id: page.id,
            slug: page.slug,
            business_name: page.business_name,
            blocked: Boolean(page.blocked_at),
            links: (
              (page.links ?? []) as {
                id: string;
                title: string;
                url: string;
                flagged_at: string | null;
              }[]
            ).map((l) => ({
              id: l.id,
              title: l.title,
              url: l.url,
              flagged: Boolean(l.flagged_at),
            })),
          }
        : null,
    };
  });

  // Sort open reports first
  items.sort((a, b) => {
    if (a.status === "open" && b.status !== "open") return -1;
    if (a.status !== "open" && b.status === "open") return 1;
    return 0;
  });

  return <ModerationQueue items={items} />;
}
