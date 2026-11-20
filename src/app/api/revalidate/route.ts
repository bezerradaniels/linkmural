import { revalidateTag } from "next/cache";
import { z } from "zod";
import { linkTag, pageTag } from "@/lib/public-page";

const bodySchema = z.union([
  z.object({ slug: z.string().min(1).max(64) }),
  z.object({ linkId: z.string().min(1).max(64) }),
]);

/**
 * Refreshes a cached public page or link from outside the app (e.g. a
 * Supabase hook). Requires the REVALIDATE_SECRET header. The panel itself
 * revalidates directly in its server actions.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return new Response(null, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });

  const tag =
    "slug" in parsed.data
      ? pageTag(parsed.data.slug)
      : linkTag(parsed.data.linkId);
  revalidateTag(tag, "max");
  return Response.json({ revalidated: tag });
}
