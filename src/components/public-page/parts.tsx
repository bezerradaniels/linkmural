/* eslint-disable @next/next/no-img-element -- avatars come from Supabase Storage */
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/icons";
import { brandColor, resolveIcon } from "@/lib/icons";
import { linkHref, type PageModel } from "@/lib/public-actions";
import type { PublicLink, PublicPage } from "@/lib/public-page";
import { publicFont } from "@/lib/public-fonts";
import type { ResolvedTheme } from "@/lib/theme";
import { PixCopyButton, ReportButton, StatusPill, VisitBeacon } from "./client";

export type TemplateProps = {
  page: PublicPage;
  model: PageModel;
  theme: ResolvedTheme;
  pageUrl: string;
};

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
      className={`${font.className} ${preview ? "min-h-full" : "min-h-dvh"} bg-(--bg) text-(--ink) antialiased`}
      style={{ ...(theme.vars as CSSProperties), fontFamily: font.family }}
    >
      {!preview && <VisitBeacon pageId={page.id} />}
      <div className="mx-auto w-full max-w-[460px]">{children}</div>
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

const card =
  "flex items-center gap-3 rounded-(--r) border border-(--card-border) bg-(--card-bg) px-(--card-px) py-(--card-py) text-(--card-ink) no-underline " +
  "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.99]";

const iconBox =
  "grid size-(--card-icon) shrink-0 place-items-center rounded-(--card-icon-r) bg-(--card-icon-bg) text-(--card-icon-ink)";

function CardText({ link }: { link: PublicLink }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
      <span className="truncate text-(length:--card-title) leading-tight font-semibold">
        {link.title}
      </span>
      {link.subtitle && (
        <span className="truncate text-(length:--card-sub) leading-snug text-(--card-muted)">
          {link.subtitle}
        </span>
      )}
    </span>
  );
}

/** One link in the vertical list (Balcão, Cartão). Pix links copy the key. */
export function LinkCard({
  link,
  page,
  theme,
}: {
  link: PublicLink;
  page: PublicPage;
  theme: ResolvedTheme;
}) {
  const inner = (
    <>
      <span className={iconBox}>
        <LinkIcon link={link} theme={theme} />
      </span>
      <CardText link={link} />
    </>
  );
  if (link.kind === "pix") {
    return (
      <PixCopyButton
        pixKey={link.url}
        linkId={link.id}
        pageId={page.id}
        className={`${card} w-full cursor-pointer`}
      >
        {inner}
      </PixCopyButton>
    );
  }
  return (
    <a
      href={linkHref(link)}
      rel="nofollow noopener"
      className={`${card} group`}
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

/** Bento tile (Mosaico). */
export function LinkTile({
  link,
  page,
  theme,
}: {
  link: PublicLink;
  page: PublicPage;
  theme: ResolvedTheme;
}) {
  const tile =
    "flex h-(--card-tile) flex-col justify-between rounded-(--r) border border-(--card-border) bg-(--card-bg) p-(--card-px) text-(--card-ink) no-underline " +
    "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.99]";
  const inner = (
    <>
      <span className={iconBox}>
        <LinkIcon link={link} theme={theme} />
      </span>
      <CardText link={link} />
    </>
  );
  if (link.kind === "pix") {
    return (
      <PixCopyButton
        pixKey={link.url}
        linkId={link.id}
        pageId={page.id}
        className={`${tile} w-full cursor-pointer items-start`}
      >
        {inner}
      </PixCopyButton>
    );
  }
  return (
    <a href={linkHref(link)} rel="nofollow noopener" className={tile}>
      {inner}
    </a>
  );
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
