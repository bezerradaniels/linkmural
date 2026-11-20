import { z } from "zod";
import { recordEvent } from "@/lib/events";

const bodySchema = z.object({
  pageId: z.uuid(),
  event: z.enum(["view", "qr", "click"]),
  linkId: z.uuid().optional(),
  ref: z.string().max(2048).nullish(),
  utm: z.string().max(200).nullish(),
});

/** Visit beacon (once per session) and QR / Pix copy events from the public page. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });

  const { pageId, event, linkId, ref, utm } = parsed.data;
  recordEvent(request, {
    pageId,
    event,
    linkId: event === "click" ? (linkId ?? null) : null,
    referrer: event === "view" ? ref : null,
    utm: event === "view" ? utm : null,
  });
  return new Response(null, { status: 204 });
}
