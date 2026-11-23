import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { COMPARISON_SLUGS } from "@/lib/comparisons";
import { NICHE_SLUGS } from "@/lib/niches";
import { siteUrl } from "@/lib/redirect";
import type { Database } from "@/utils/supabase/types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/planos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/comparar`, changeFrequency: "weekly", priority: 0.8 },
    ...COMPARISON_SLUGS.map((slug) => ({
      url: `${base}/comparar/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${base}/para`, changeFrequency: "weekly", priority: 0.8 },
    ...NICHE_SLUGS.map((slug) => ({
      url: `${base}/para/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${base}/ferramentas`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${base}/ferramentas/gerador-de-utm`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${base}/termos`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacidade`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return staticEntries;

  try {
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: pages } = await supabase
      .from("pages")
      .select("slug, updated_at")
      .eq("published", true)
      .is("blocked_at", null)
      .limit(5000);

    const dynamicEntries: MetadataRoute.Sitemap = (pages ?? []).map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticEntries, ...dynamicEntries];
  } catch {
    return staticEntries;
  }
}
