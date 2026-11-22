import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type AuthSplitLayoutProps = {
  /** Image rendered in the right-hand showcase (desktop) and top banner (mobile). */
  imageSrc: string;
  imageAlt: string;
  /** Optional CSS object-position classes for desktop & mobile framing. */
  imageClassName?: string;
  /** Small pill shown in the mobile header banner. */
  mobileBadge: string;
  /** Bottom footer line on the form column. */
  footerNote: string;
  /** Desktop right-column floating showcase content. */
  asideContent: ReactNode;
  children: ReactNode;
};

export function AuthSplitLayout({
  imageSrc,
  imageAlt,
  imageClassName = "object-cover object-[center_20%]",
  mobileBadge,
  footerNote,
  asideContent,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-surface text-ink lg:grid-cols-2">
      {/* Mobile-only TikTok creator top banner */}
      <div className="relative flex h-44 flex-col justify-between overflow-hidden bg-[#0B0C10] px-6 pt-6 pb-9 text-white sm:h-52 lg:hidden">
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`pointer-events-none absolute inset-0 size-full select-none ${imageClassName}`}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,12,16,0.68) 0%, rgba(11,12,16,0.28) 45%, rgba(11,12,16,0.92) 100%)",
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" aria-label="linkmural, página inicial">
            <Image
              src="/brand/linkmural-logo-negativo.svg"
              alt="Linkmural"
              width={136}
              height={21}
              priority
            />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-lime" />
            {mobileBadge}
          </span>
        </div>
      </div>

      {/* Left column: form */}
      <main className="relative z-10 -mt-5 flex flex-col justify-between rounded-t-[24px] bg-surface px-6 py-8 sm:px-10 lg:mt-0 lg:rounded-none lg:px-14">
        <div className="hidden lg:flex lg:justify-start">
          <Link href="/" aria-label="linkmural, página inicial">
            <Image
              src="/brand/linkmural-logo.svg"
              alt="Linkmural"
              width={148}
              height={23}
              priority
            />
          </Link>
        </div>

        <div className="mx-auto my-4 flex w-full max-w-[400px] flex-col gap-6 lg:my-8">
          {children}
        </div>

        <div className="text-center text-caption text-ink-muted lg:text-left">
          {footerNote}
        </div>
      </main>

      {/* Right column (desktop only): full-bleed TikTok creators showcase */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-[#0B0C10] p-10 text-white lg:flex lg:flex-col lg:items-center lg:justify-end xl:p-14"
      >
        <img
          src={imageSrc}
          alt=""
          className={`pointer-events-none absolute inset-0 size-full select-none ${imageClassName}`}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, rgba(11,12,16,0.22) 0%, rgba(11,12,16,0.58) 48%, rgba(11,12,16,0.94) 86%, #0B0C10 100%)",
          }}
        />
        <div className="pointer-events-none absolute -top-20 -right-20 size-80 rounded-full bg-lime/15 blur-3xl" />

        <div className="relative z-10 w-full max-w-[420px]">
          {asideContent}
        </div>
      </aside>
    </div>
  );
}
