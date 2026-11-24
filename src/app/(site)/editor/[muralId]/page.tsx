import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { pageToMuralDocument } from "@/lib/editor/mapper";
import type { Plan } from "@/lib/plans";
import { mediaUrl } from "@/lib/public-page";
import { siteUrl } from "@/lib/redirect";
import { createAdminClient } from "@/utils/supabase/admin";
import { EditorLoader } from "./EditorLoader";

export const metadata: Metadata = {
  title: "Editor visual · linkmural",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function IsolatedVisualEditorPage({
  params,
}: {
  params: Promise<{ muralId: string }>;
}) {
  const { muralId } = await params;
  const { supabase, userId } = await requireUser(`/editor/${muralId}`);

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role, plan")
    .eq("id", userId)
    .maybeSingle();

  // Convenience alias: /editor/meu-mural redirects to user's primary mural UUID
  if (!UUID_RE.test(muralId)) {
    const { data: ownPage } = await supabase
      .from("pages")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (ownPage) redirect(`/editor/${ownPage.id}`);
    notFound();
  }

  const isAdmin = viewerProfile?.role === "admin";
  const db = isAdmin ? createAdminClient() : supabase;

  const { data: page } = await db
    .from("pages")
    .select("*, links(*)")
    .eq("id", muralId)
    .maybeSingle();

  if (!page || (!isAdmin && page.owner_id !== userId)) {
    notFound();
  }

  let plan: Plan = viewerProfile?.plan ?? "free";
  if (page.owner_id !== userId) {
    const { data: ownerProf } = await createAdminClient()
      .from("profiles")
      .select("plan")
      .eq("id", page.owner_id)
      .maybeSingle();
    plan = ownerProf?.plan ?? "free";
  }

  const initialDoc = pageToMuralDocument({
    page,
    links: page.links ?? [],
    avatarUrl: mediaUrl(page.avatar_path),
    coverUrl: mediaUrl(page.cover_path),
  });

  const pageUrl = `${siteUrl()}/${page.slug}`;

  return (
    <EditorLoader
      initialDoc={initialDoc}
      ownerId={page.owner_id}
      plan={plan}
      pageUrl={pageUrl}
    />
  );
}
