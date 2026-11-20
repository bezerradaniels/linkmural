import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  cleanUtm,
  countryOf,
  deviceOf,
  isBot,
  isPrefetch,
  referrerHost,
  type ClickEvent,
} from "./analytics";

function ownHosts(): string[] {
  return (process.env.NEXT_PUBLIC_ROOT_HOSTS ?? "")
    .split(",")
    .map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/:\d+$/, "")
        .replace(/^www\./, ""),
    )
    .filter(Boolean);
}

let warned = false;

/**
 * Records a visit or click after the response is sent. Skips bots and
 * prefetches. Stores no IP and no user agent (docs/HANDOFF.md §7.5).
 */
export function recordEvent(
  request: Request,
  data: {
    pageId: string;
    linkId?: string | null;
    event: ClickEvent;
    referrer?: string | null;
    utm?: unknown;
  },
) {
  const headers = request.headers;
  const ua = headers.get("user-agent");
  if (isBot(ua) || isPrefetch(headers)) return;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (!warned) {
      console.warn(
        "[events] SUPABASE_SERVICE_ROLE_KEY is not set; visits and clicks are not recorded.",
      );
      warned = true;
    }
    return;
  }

  const row = {
    page_id: data.pageId,
    link_id: data.linkId ?? null,
    event: data.event,
    referrer_host: referrerHost(data.referrer ?? null, ownHosts()),
    utm_source: cleanUtm(data.utm),
    country: countryOf(headers),
    device: deviceOf(ua),
  };

  after(async () => {
    const { error } = await createAdminClient()
      .from("click_events")
      .insert(row);
    if (error) console.error("[events] insert failed:", error.message);
  });
}
