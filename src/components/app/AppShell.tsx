"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutForm } from "@/components/app/SignOutForm";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Icon,
  ToastProvider,
} from "@/components/ui";
import type { IconName } from "@/components/ui/icons";
import type { Plan } from "@/lib/plans";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

const DESKTOP_NAV: NavItem[] = [
  { href: "/app", label: "Início", icon: "site" },
  { href: "/app/pagina", label: "Página", icon: "link" },
  { href: "/app/aparencia", label: "Aparência", icon: "palette" },
  { href: "/app/informacoes", label: "Informações", icon: "edit" },
  { href: "/app/metricas", label: "Métricas", icon: "chart" },
  { href: "/app/plano", label: "Plano", icon: "payment" },
  { href: "/app/conta", label: "Minha conta", icon: "contact" },
  { href: "/app/ajuda", label: "Ajuda", icon: "info" },
];

const MOBILE_TABS: NavItem[] = [
  { href: "/app", label: "Início", icon: "site" },
  { href: "/app/pagina", label: "Página", icon: "link" },
  { href: "/app/aparencia", label: "Aparência", icon: "palette" },
  { href: "/app/metricas", label: "Métricas", icon: "chart" },
  { href: "/app/mais", label: "Mais", icon: "grip" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  if (href === "/app/mais") {
    return (
      pathname === "/app/mais" ||
      pathname === "/app/informacoes" ||
      pathname === "/app/plano" ||
      pathname === "/app/conta" ||
      pathname === "/app/ajuda"
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  businessName,
  slug,
  avatarUrl,
  published,
  plan,
  email,
  suspended = false,
  isAdmin = false,
  children,
}: {
  businessName: string;
  slug: string;
  avatarUrl: string | null;
  published: boolean;
  plan: Plan;
  email: string | null;
  suspended?: boolean;
  isAdmin?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isFullPreview = pathname === "/app/previa";

  if (isFullPreview) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <div className="[--toast-offset:88px] lg:[--toast-offset:24px]">
      <ToastProvider>
        <div className="flex min-h-dvh bg-paper text-ink">
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-line bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh">
            <div className="flex flex-col gap-5">
              <Link
                href="/app"
                className="inline-flex items-center px-2 py-1"
                aria-label="linkmural, início do painel"
              >
                <Image
                  src="/brand/linkmural-logo.svg"
                  alt="Linkmural"
                  width={132}
                  height={20}
                  priority
                />
              </Link>

              <div className="flex items-center gap-2.5 rounded-lg border border-line bg-paper p-2.5">
                <Avatar
                  src={avatarUrl}
                  name={businessName || slug}
                  size={32}
                  square
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small leading-tight font-semibold text-ink">
                    {businessName || slug}
                  </p>
                  <p className="truncate text-caption text-ink-muted">
                    /{slug}
                  </p>
                </div>
                <Badge
                  variant="neutral"
                  dot={published ? "positive" : "warning"}
                >
                  {published ? "No ar" : "Rascunho"}
                </Badge>
              </div>

              <nav aria-label="Menu do painel" className="flex flex-col gap-1">
                {DESKTOP_NAV.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-small font-medium transition-colors ${
                        active
                          ? "bg-ink text-paper"
                          : "text-ink-muted hover:bg-hover hover:text-ink"
                      }`}
                    >
                      <Icon name={item.icon} size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-paper px-3 text-small font-semibold text-ink hover:border-ink"
                >
                  <Icon name="lock" size={16} />
                  Painel Admin
                </Link>
              )}
              {plan === "free" && (
                <Link
                  href="/app/plano"
                  className="flex flex-col gap-1 rounded-lg border border-line bg-lime-soft/60 p-3.5 text-left transition-colors hover:border-ink"
                >
                  <span className="text-small font-semibold text-ink">
                    Seja Pro
                  </span>
                  <span className="text-caption text-ink-muted">
                    Links ilimitados, cores próprias e métricas por link.
                  </span>
                </Link>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                <span className="truncate text-caption text-ink-muted">
                  {email ?? "Minha conta"}
                </span>
                <SignOutForm>
                  <Button type="submit" variant="ghost" size="sm">
                    Sair
                  </Button>
                </SignOutForm>
              </div>
            </div>
          </aside>

          {/* Main Column */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Mobile Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-sm lg:hidden">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  src={avatarUrl}
                  name={businessName || slug}
                  size={32}
                  square
                />
                <div className="min-w-0">
                  <p className="truncate text-small leading-tight font-semibold text-ink">
                    {businessName || slug}
                  </p>
                  <p className="truncate text-caption text-ink-muted">
                    linkmural.com/{slug}
                  </p>
                </div>
              </div>

              <Link
                href="/app/previa"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border border-line-strong bg-surface px-3.5 text-small font-semibold text-ink"
              >
                <Icon name="external" size={15} />
                Ver prévia
              </Link>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:py-8">
              {suspended && (
                <div className="mb-6">
                  <Alert tone="error" title="Sua conta está suspensa">
                    Sua página pública foi temporariamente retirada do ar pela
                    moderação. Se acha que foi um engano, fale com o suporte em{" "}
                    <Link href="/app/ajuda" className="font-semibold underline">
                      Ajuda
                    </Link>
                    .
                  </Alert>
                </div>
              )}
              {children}
            </main>
          </div>

          {/* Mobile Bottom Tab Bar */}
          <nav
            aria-label="Navegação principal"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-sm lg:hidden"
          >
            <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
              {MOBILE_TABS.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                      active ? "font-semibold text-ink" : "text-ink-muted"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-11 place-items-center rounded-pill ${
                        active ? "bg-lime text-on-lime" : ""
                      }`}
                    >
                      <Icon name={item.icon} size={18} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </ToastProvider>
    </div>
  );
}
