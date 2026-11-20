import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { Plan } from "./plans";
import type { Database, Tables } from "@/utils/supabase/types";

/*
 * Loads a published page for /[slug] with the anonymous client, so the
 * database rules (RLS) decide what is public: published, not blocked,
 * active and not flagged links. Cached per page and revalidated with
 * revalidateTag(pageTag(slug)) when the owner saves.
 */

export type PublicLink = Pick<
  Tables<"links">,
  | "id"
  | "kind"
  | "title"
  | "subtitle"
  | "url"
  | "icon"
  | "featured"
  | "position"
>;

export type PublicPage = Pick<
  Tables<"pages">,
  | "id"
  | "slug"
  | "template"
  | "style"
  | "theme"
  | "business_name"
  | "kind"
  | "bio"
  | "city"
  | "address"
  | "whatsapp"
  | "email"
  | "hours"
  | "status_text"
  | "show_branding"
> & {
  plan: Plan;
  avatarUrl: string | null;
  coverUrl: string | null;
  links: PublicLink[];
};

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function pageTag(slug: string) {
  return `page:${slug}`;
}

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

function anonClient() {
  return createClient<Database>(
    supabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${supabaseUrl()}/storage/v1/object/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

const PAGE_FIELDS =
  "id, slug, template, style, theme, business_name, kind, bio, city, address, whatsapp, email, hours, status_text, show_branding, avatar_path, cover_path, links(id, kind, title, subtitle, url, icon, featured, position)";

async function loadPublicPage(slug: string): Promise<PublicPage | null> {
  const supabase = anonClient();
  const { data, error } = await supabase
    .from("pages")
    .select(PAGE_FIELDS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: plan } = await supabase.rpc("public_page_plan", {
    p_page: data.id,
  });
  const { avatar_path, cover_path, links, ...page } = data;

  return {
    ...page,
    plan: plan ?? "free",
    avatarUrl: mediaUrl(avatar_path),
    coverUrl: mediaUrl(cover_path),
    links: [...(links ?? [])].sort((a, b) => a.position - b.position),
  };
}

/** Published page by slug, or null (unknown, unpublished or blocked). */
export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  if (!SLUG_RE.test(slug)) return null;
  return unstable_cache(() => loadPublicPage(slug), ["public-page", slug], {
    tags: [pageTag(slug)],
    revalidate: 3600,
  })();
}

export function linkTag(id: string) {
  return `link:${id}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PublicLinkTarget = Pick<
  Tables<"links">,
  "id" | "page_id" | "kind" | "url"
>;

/** A public (active, not flagged, on a published page) link, for /l/[linkId]. */
export async function getPublicLink(
  id: string,
): Promise<PublicLinkTarget | null> {
  if (!UUID_RE.test(id)) return null;
  return unstable_cache(
    async () => {
      const { data, error } = await anonClient()
        .from("links")
        .select("id, page_id, kind, url")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    ["public-link", id],
    { tags: [linkTag(id)], revalidate: 3600 },
  )();
}
