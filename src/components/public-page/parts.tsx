/* eslint-disable @next/next/no-img-element -- avatars come from Supabase Storage */
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/icons";
import {
  SUPPORT_PALETTE,
  type SupportColorId,
} from "@/lib/editor/types";
import { brandColor, resolveIcon } from "@/lib/icons";
import { linkHref, type PageModel } from "@/lib/public-actions";
import type { PublicLink, PublicPage } from "@/lib/public-page";
import { publicFont } from "@/lib/public-fonts";
import {
  parseGalleryData,
  parseServiceData,
  parseYoutubeVideoId,
} from "@/lib/rich-blocks";
import { COVER_HEIGHTS } from "@/lib/styles";
import type { ResolvedTheme } from "@/lib/theme";
import {
  GalleryCarousel,
  PixCopyButton,
  PublicStackCarousel,
  ReportButton,
  StatusPill,
  VisitBeacon,
} from "./client";

export type TemplateProps = {
  page: PublicPage;
  model: PageModel;
  theme: ResolvedTheme;
  pageUrl: string;
};

function DoodleOverlay({
  doodle,
  preview,
}: {
  doodle: ResolvedTheme["bgDoodle"];
  preview: boolean;
}) {
  const patternId = `lm-doodle-${doodle}`;
  return (
    <svg
      aria-hidden
      className={`pointer-events-none inset-0 size-full text-(--ink) opacity-[0.075] ${preview ? "absolute" : "fixed"}`}
    >
      <defs>
        {doodle === "dots" && (
          <pattern
            id={patternId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="4" cy="4" r="1.6" fill="currentColor" />
            <circle cx="16" cy="16" r="1.6" fill="currentColor" />
          </pattern>
        )}
        {doodle === "grid" && (
          <pattern
            id={patternId}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        )}
        {doodle === "waves" && (
          <pattern
            id={patternId}
            width="48"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 12 Q 12 2 24 12 T 48 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </pattern>
        )}
        {doodle === "organic" && (
          <pattern
            id={patternId}
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="16"
              cy="18"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M 42 14 L 52 24 M 52 14 L 42 24"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <rect
              x="38"
              y="42"
              width="12"
              height="12"
              rx="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

/** Root: style variables, the style's font and the page background. */
export function PageShell({
  page,
  theme,
  preview = false,
  children,
}: {
  page: PublicPage;
  theme: ResolvedTheme;
  preview?: boolean;
  children: ReactNode;
}) {
  const font = publicFont(theme.font);
  return (
    <div
      className={`${font.className} relative ${preview ? "min-h-full" : "min-h-dvh"} overflow-x-hidden text-(--ink) antialiased`}
      style={{
        ...(theme.vars as CSSProperties),
        fontFamily: font.family,
        background: theme.bgCss,
      }}
    >
      {theme.bgType === "doodles" && (
        <DoodleOverlay doodle={theme.bgDoodle} preview={preview} />
      )}
      {!preview && (
        <VisitBeacon
          pageId={page.id}
          slug={page.slug}
          template={page.template}
          style={page.style}
        />
      )}
      <div className="relative z-1 mx-auto w-full max-w-[460px]">{children}</div>
    </div>
  );
}

/** Cover image (or styled accent fallback) shared across all 3 templates. */
export function CoverBanner({
  page,
  model,
  theme,
  fadeTarget = "bg",
  className = "",
  children,
}: {
  page: PublicPage;
  model: PageModel;
  theme: ResolvedTheme;
  fadeTarget?: "bg" | "surface";
  className?: string;
  children?: ReactNode;
}) {
  const heightCls = COVER_HEIGHTS[theme.coverHeight].h;
  const fadeFrom = fadeTarget === "surface" ? "from-(--surface)" : "from-(--bg)";
  return (
    <div
      className={`relative overflow-hidden bg-(--accent) ${heightCls} ${className}`}
      style={{
        backgroundImage: page.coverUrl
          ? undefined
          : "radial-gradient(circle at 85% 20%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, rgba(0,0,0,0.06), rgba(0,0,0,0.22))",
      }}
    >
      {page.coverUrl && (
        <img
          src={page.coverUrl}
          alt={`Capa de ${model.name}`}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {theme.coverStyle === "tint" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-(--accent) opacity-40 mix-blend-multiply"
        />
      )}
      {theme.coverStyle === "fade" && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${fadeFrom} to-transparent`}
        />
      )}
      {children}
    </div>
  );
}

export function Logo({
  page,
  model,
  size,
  className = "",
  style,
}: {
  page: PublicPage;
  model: PageModel;
  size: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-(--r-logo) font-bold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.34),
        ...style,
      }}
    >
      {page.avatarUrl ? (
        <img
          src={page.avatarUrl}
          alt={`Logo de ${model.name}`}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{model.initials}</span>
      )}
    </div>
  );
}

/** Status ("Aberto agora · até 22h") pill; recomputed in the browser. */
export function Status({
  page,
  model,
  className,
}: {
  page: PublicPage;
  model: PageModel;
  className: string;
}) {
  if (!model.status) return null;
  return page.hours ? (
    <StatusPill
      hours={page.hours}
      initial={model.status}
      className={className}
    />
  ) : (
    <span className={className}>
      <span aria-hidden className="size-2 shrink-0 rounded-full bg-[#22C55E]" />
      {model.status.label}
    </span>
  );
}

export function LinkIcon({
  link,
  theme,
  size,
}: {
  link: PublicLink;
  theme: ResolvedTheme;
  size?: number;
}) {
  const icon = resolveIcon(link.icon);
  const px = size ?? "calc(var(--card-icon) * 0.46)";
  if (icon.type === "brand") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        focusable="false"
        style={{
          width: px,
          height: px,
          fill: brandColor(icon, theme.iconColor),
        }}
      >
        <path d={icon.path} />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: px, height: px }}
    >
      <path d={icon.path} />
    </svg>
  );
}

function effectClasses(effect: ResolvedTheme["cardEffect"]): string {
  if (effect === "glass") {
    return "backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.07)]";
  }
  if (effect === "glossy") {
    return "relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_20px_rgba(0,0,0,0.1)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/25 before:to-transparent before:content-['']";
  }
  return "";
}

const cardBase =
  "flex items-center gap-3 rounded-(--r) border border-(--card-border) bg-(--card-bg) px-(--card-px) py-(--card-py) text-(--card-ink) no-underline " +
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.99]";

const iconBox =
  "grid size-(--card-icon) shrink-0 place-items-center rounded-(--card-icon-r) bg-(--card-icon-bg) text-(--card-icon-ink) shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.06]";

function CardText({
  link,
  lines = 1,
  showSubtitle = true,
}: {
  link: PublicLink;
  lines?: 1 | 2;
  showSubtitle?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
      <span
        className={`${lines === 2 ? "line-clamp-2" : "truncate"} text-(length:--card-title) leading-tight font-semibold`}
      >
        {link.title}
      </span>
      {showSubtitle && link.subtitle && (
        <span className="truncate text-(length:--card-sub) leading-snug text-(--card-muted)">
          {link.subtitle}
        </span>
      )}
    </span>
  );
}

/**
 * Bento-aware link card:
 * - Free plan always renders as standard 2x1 bar (logo/CTA/arrow).
 * - Pro+ plan renders 2x1 (full bar), 1x1 (square bento tile) or 2x2 (large bento card).
 */
export function BentoLinkCard({
  link,
  page,
  theme,
}: {
  link: PublicLink;
  page: PublicPage;
  theme: ResolvedTheme;
}) {
  const rawSize = link.size;
  const resolvedSize =
    theme.allowBentoResize && (rawSize === "1x1" || rawSize === "2x2")
      ? rawSize
      : "2x1";
  const fx = effectClasses(theme.cardEffect);

  const rawData =
    link.data && typeof link.data === "object" && !Array.isArray(link.data)
      ? (link.data as Record<string, unknown>)
      : {};

  // Support Palette color override from Visual Editor
  const colorId =
    typeof rawData.colorId === "string" && rawData.colorId in SUPPORT_PALETTE
      ? (rawData.colorId as SupportColorId)
      : "default";
  const swatch = colorId !== "default" ? SUPPORT_PALETTE[colorId] : null;
  const cardColorVars = swatch
    ? ({
        "--card-bg": swatch.bg,
        "--card-ink": swatch.ink,
        "--card-muted": swatch.muted,
        "--card-icon-bg": swatch.iconBg,
        "--card-icon-ink": swatch.iconInk,
        "--card-border": "transparent",
      } as CSSProperties)
    : undefined;

  // Dynamic span in 2-col or 4-col mobile grids
  const gridCols = theme.gridMobileCols;
  const rawLayoutMob =
    rawData.layout &&
    typeof rawData.layout === "object" &&
    (rawData.layout as Record<string, unknown>).mobile &&
    typeof (rawData.layout as Record<string, unknown>).mobile === "object"
      ? ((rawData.layout as Record<string, unknown>).mobile as Record<
          string,
          unknown
        >)
      : null;

  const spanClass = (() => {
    if (!theme.allowBentoResize) {
      return gridCols === 4 ? "col-span-4" : "col-span-2";
    }
    const cSpan = rawLayoutMob?.colSpan;
    if (gridCols === 4) {
      if (cSpan === 4) return "col-span-4";
      if (cSpan === 2) return "col-span-2";
      if (cSpan === 1 || resolvedSize === "1x1") return "col-span-1";
      return "col-span-4";
    }
    return resolvedSize === "1x1" || cSpan === 1 ? "col-span-1" : "col-span-2";
  })();

  // Widget Stack (2+ items inside a single node)
  const extraStack = Array.isArray(rawData.stackItems) ? rawData.stackItems : [];
  if (extraStack.length > 0) {
    const slides = [
      {
        id: link.id,
        title: link.title,
        subtitle: theme.showSubtitles ? (link.subtitle ?? undefined) : undefined,
        href: linkHref(link),
      },
      ...extraStack
        .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
        .map((s, idx) => ({
          id: typeof s.id === "string" ? s.id : `${link.id}-${idx}`,
          title: typeof s.title === "string" ? s.title : "Link",
          subtitle:
            theme.showSubtitles && typeof s.subtitle === "string"
              ? s.subtitle
              : undefined,
          href: typeof s.url === "string" ? s.url : linkHref(link),
        })),
    ];
    return (
      <div className={spanClass} style={cardColorVars}>
        <PublicStackCarousel slides={slides} />
      </div>
    );
  }

  // Studio rich blocks: Gallery (Carrossel), YouTube Video, and Service Card
  if (link.kind === "gallery") {
    const gallery = parseGalleryData(link.data);
    const spanCls = resolvedSize === "1x1" ? "col-span-1" : "col-span-2";
    return (
      <GalleryCarousel
        images={gallery.images}
        title={link.title}
        subtitle={link.subtitle}
        pageId={page.id}
        linkId={link.id}
        slug={page.slug}
        className={`${spanCls} flex flex-col overflow-hidden rounded-(--r-big) border border-(--card-border) bg-(--card-bg) text-(--card-ink) ${fx}`}
      />
    );
  }

  if (link.kind === "youtube") {
    const videoId = parseYoutubeVideoId(link.data, link.url);
    const spanCls = resolvedSize === "1x1" ? "col-span-1" : "col-span-2";
    if (videoId && resolvedSize !== "1x1") {
      return (
        <div
          className={`${spanCls} flex flex-col overflow-hidden rounded-(--r-big) border border-(--card-border) bg-(--card-bg) text-(--card-ink) ${fx}`}
        >
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
              title={link.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <CardText link={link} lines={1} />
            <a
              href={linkHref(link)}
              rel="nofollow noopener"
              data-lm-link-title={link.title}
              data-lm-link-kind="youtube"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-(--soft) px-3 text-[12px] font-semibold text-(--ink) no-underline"
            >
              YouTube
              <Icon name="arrow" size={13} strokeWidth={2} />
            </a>
          </div>
        </div>
      );
    }
  }

  if (link.kind === "service") {
    const svc = parseServiceData(link.data);
    const spanCls = resolvedSize === "1x1" ? "col-span-1" : "col-span-2";
    return (
      <a
        href={linkHref(link)}
        rel="nofollow noopener"
        data-lm-link-title={link.title}
        data-lm-link-kind="service"
        className={`${spanCls} flex flex-col justify-between gap-3.5 rounded-(--r-big) border border-(--card-border) bg-(--card-bg) p-4 text-(--card-ink) no-underline transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.99] ${fx}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={iconBox}>
              <LinkIcon link={link} theme={theme} />
            </span>
            {svc.badge && (
              <span className="rounded-full bg-(--accent) px-2.5 py-0.5 text-[11px] font-bold text-(--on-accent)">
                {svc.badge}
              </span>
            )}
          </div>
          {(svc.price || svc.duration) && (
            <div className="flex flex-col items-end text-right">
              {svc.price && (
                <span className="rounded-md bg-(--soft) px-2.5 py-1 text-[14px] leading-none font-bold">
                  {svc.price}
                </span>
              )}
              {svc.duration && (
                <span className="mt-1 text-[11px] text-(--card-muted)">
                  {svc.duration}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 text-left">
          <span className="text-(length:--card-title) leading-tight font-bold">
            {link.title}
          </span>
          {link.subtitle && (
            <span className="line-clamp-2 text-(length:--card-sub) leading-snug text-(--card-muted)">
              {link.subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between rounded-full bg-(--accent) px-3.5 py-2 text-[13px] font-bold text-(--on-accent)">
          <span className="truncate">{svc.ctaLabel || "Solicitar"}</span>
          <Icon name="arrow" size={15} strokeWidth={2} />
        </div>
      </a>
    );
  }

  if (resolvedSize === "1x1" || spanClass === "col-span-1") {
    const tileCls = `${spanClass} flex min-h-[112px] flex-col justify-between rounded-(--r) border border-(--card-border) bg-(--card-bg) p-(--card-px) text-(--card-ink) no-underline transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.99] ${fx}`;
    const inner = theme.showIconLabels ? (
      <>
        <div className="flex w-full items-start justify-between gap-2">
          <span className={iconBox}>
            <LinkIcon link={link} theme={theme} />
          </span>
          <Icon
            name={link.kind === "pix" ? "copy" : "arrow"}
            size={15}
            strokeWidth={2}
            className="mt-1 shrink-0 opacity-55"
          />
        </div>
        <CardText
          link={link}
          lines={2}
          showSubtitle={theme.showSubtitles}
        />
      </>
    ) : (
      <div className="grid size-full place-items-center py-2">
        <span className={iconBox}>
          <LinkIcon link={link} theme={theme} />
        </span>
      </div>
    );

    if (link.kind === "pix") {
      return (
        <PixCopyButton
          pixKey={link.url}
          linkId={link.id}
          pageId={page.id}
          slug={page.slug}
          className={`${tileCls} w-full cursor-pointer items-start`}
        >
          {inner}
        </PixCopyButton>
      );
    }
    return (
      <a
        href={linkHref(link)}
        rel="nofollow noopener"
        aria-label={!theme.showIconLabels ? link.title : undefined}
        data-lm-link-title={link.title}
        data-lm-link-kind={link.kind}
        style={cardColorVars}
        className={tileCls}
      >
        {inner}
      </a>
    );
  }

  if (resolvedSize === "2x2") {
    const bigCls = `${spanClass} flex min-h-[152px] flex-col justify-between gap-4 rounded-(--r-big) border border-(--card-border) bg-(--card-bg) p-5 text-(--card-ink) no-underline transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.99] ${fx}`;
    const inner = (
      <>
        <div className="flex w-full items-center justify-between gap-2">
          <span className={iconBox}>
            <LinkIcon link={link} theme={theme} />
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--soft) text-(--ink)">
            <Icon
              name={link.kind === "pix" ? "copy" : "arrow"}
              size={16}
              strokeWidth={2}
            />
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-[19px] leading-tight font-bold">
            {link.title}
          </span>
          {theme.showSubtitles && link.subtitle && (
            <span className="text-[13px] leading-snug text-(--card-muted)">
              {link.subtitle}
            </span>
          )}
        </div>
      </>
    );

    if (link.kind === "pix") {
      return (
        <PixCopyButton
          pixKey={link.url}
          linkId={link.id}
          pageId={page.id}
          slug={page.slug}
          className={`${bigCls} w-full cursor-pointer items-start`}
        >
          {inner}
        </PixCopyButton>
      );
    }
    return (
      <a
        href={linkHref(link)}
        rel="nofollow noopener"
        data-lm-link-title={link.title}
        data-lm-link-kind={link.kind}
        style={cardColorVars}
        className={bigCls}
      >
        {inner}
      </a>
    );
  }

  // Default 2x1 bar: logo/icon + CTA + arrow
  const barCls = `${spanClass} ${cardBase} ${fx}`;
  const inner = (
    <>
      <span className={iconBox}>
        <LinkIcon link={link} theme={theme} />
      </span>
      <CardText link={link} showSubtitle={theme.showSubtitles} />
    </>
  );
  if (link.kind === "pix") {
    return (
      <PixCopyButton
        pixKey={link.url}
        linkId={link.id}
        pageId={page.id}
        slug={page.slug}
        className={`${barCls} w-full cursor-pointer`}
      >
        {inner}
      </PixCopyButton>
    );
  }
  return (
    <a
      href={linkHref(link)}
      rel="nofollow noopener"
      data-lm-link-title={link.title}
      data-lm-link-kind={link.kind}
      style={cardColorVars}
      className={`${barCls} group`}
    >
      {inner}
      <Icon
        name="arrow"
        size={18}
        strokeWidth={2}
        className="shrink-0 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  );
}

/** One link in the vertical list (kept for backwards compatibility). */
export function LinkCard({
  link,
  page,
  theme,
}: {
  link: PublicLink;
  page: PublicPage;
  theme: ResolvedTheme;
}) {
  return <BentoLinkCard link={link} page={page} theme={theme} />;
}

/** Bento tile (kept for backwards compatibility). */
export function LinkTile({
  link,
  page,
  theme,
}: {
  link: PublicLink;
  page: PublicPage;
  theme: ResolvedTheme;
}) {
  return <BentoLinkCard link={{ ...link, size: "1x1" }} page={page} theme={theme} />;
}

export function SectionHeader({ count }: { count: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="m-0 text-[13px] font-semibold tracking-[0.1em] text-(--muted) uppercase">
        Links
      </h2>
      <span className="text-[13px] text-(--muted)">
        {count} {count === 1 ? "link" : "links"}
      </span>
    </div>
  );
}

/** The lime pin on the featured link. */
export function Pin() {
  return (
    <span
      aria-hidden
      className="absolute -top-1.5 -right-1.5 size-[18px] animate-pin-drop rounded-full border-[3px] border-(--bg) bg-[#CDF54A]"
    />
  );
}

export function QuickIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={22} />;
}

export function Footer({
  page,
  extraBottom = false,
}: {
  page: PublicPage;
  extraBottom?: boolean;
}) {
  return (
    <footer
      className={`flex flex-col items-center gap-2 px-6 pt-8 text-[13px] text-(--muted) ${extraBottom ? "pb-[120px]" : "pb-10"}`}
    >
      {page.show_branding && (
        <a
          href={`/?ref=${encodeURIComponent(page.slug)}`}
          className="inline-flex min-h-11 items-center gap-1.5 font-medium text-(--muted) no-underline hover:text-(--ink)"
        >
          Feito com <span className="font-bold text-(--ink)">linkmural</span>
        </a>
      )}
      <ReportButton
        pageId={page.id}
        className="min-h-11 cursor-pointer text-[12px] text-(--muted) underline underline-offset-2"
      />
    </footer>
  );
}
