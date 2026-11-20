"use client";

import Link from "next/link";
import { PublicPageView } from "@/components/public-page/PublicPageView";
import { Icon } from "@/components/ui";
import type { PublicPage } from "@/lib/public-page";

/**
 * Live phone-framed preview of the public page (desktop right column).
 * Renders PublicPageView in preview mode (no VisitBeacon).
 */
export function PhonePreview({
  page,
  pageUrl,
}: {
  page: PublicPage;
  pageUrl: string;
}) {
  return (
    <aside
      aria-label="Prévia ao vivo"
      className="hidden xl:sticky xl:top-8 xl:flex xl:w-[340px] xl:shrink-0 xl:flex-col xl:gap-3 xl:self-start"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-caption font-semibold tracking-wider text-ink-muted uppercase">
          Prévia ao vivo
        </span>
        <Link
          href={`/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-caption font-semibold text-ink hover:underline"
        >
          linkmural.com/{page.slug}
          <Icon name="external" size={13} />
        </Link>
      </div>

      <div className="overflow-hidden rounded-[36px] border-[6px] border-ink bg-surface shadow-lg">
        <div className="mx-auto my-2 h-1.5 w-16 rounded-pill bg-line-strong" />
        <div className="h-[580px] overflow-x-hidden overflow-y-auto">
          <div className="pointer-events-none w-[131.6%] origin-top-left scale-[0.76] select-none">
            <PublicPageView page={page} pageUrl={pageUrl} preview />
          </div>
        </div>
      </div>
    </aside>
  );
}
