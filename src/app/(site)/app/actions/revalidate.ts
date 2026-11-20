import "server-only";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { linkTag, pageTag } from "@/lib/public-page";

/** Immediately expires cached public page (and optionally links) + refreshes /app. */
export function refreshPublicPage(slug: string, linkIds?: string[]) {
  const tags = [pageTag(slug), ...(linkIds ?? []).map(linkTag)];
  for (const tag of tags) {
    try {
      updateTag(tag);
    } catch {
      revalidateTag(tag, "max");
    }
  }
  revalidatePath("/app", "layout");
}
