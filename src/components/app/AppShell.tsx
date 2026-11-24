"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutForm } from "@/components/app/SignOutForm";
import {
  Alert,
  Avatar,
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
  { href: "/app/pagina", label: "Links", icon: "link" },
  { href: "/app/aparencia", label: "Aparência", icon: "palette" },
  { href: "/app/informacoes", label: "Informações", icon: "edit" },
  { href: "/app/metricas", label: "Métricas", icon: "chart" },
  { href: "/app/plano", label: "Plano", icon: "payment" },
  { href: "/app/conta", label: "Conta", icon: "contact" },
  { href: "/app/ajuda", label: "Ajuda", icon: "info" },
];

const MOBILE_LEFT_TABS: NavItem[] = [
  { href: "/app", label: "Início", icon: "site" },
  { href: "/app/metricas", label: "Métricas", icon: "chart" },
];

const MOBILE_RIGHT_TABS: NavItem[] = [
  { href: "/app/aparencia", label: "Estilo", icon: "palette" },
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

  const centerActive = isActivePath(pathname, "/app/pagina");

  return (
    <div className="[--toast-offset:88px] lg:[--toast-offset:24px]">
      <ToastProvider>
        <div className="flex min-h-dvh bg-paper text-ink">
          {/* Desktop Sidebar (sticky 100vh) */}
          <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-line/70 bg-surface px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto xl:w-64">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <Link
                  href="/app"
                  className="inline-flex items-center"
                  aria-label="linkmural, início do painel"
                >
                  <Image
                    src="/brand/linkmural-logo.svg"
                    alt="Linkmural"
                    width={122}
                    height={19}
                    priority
                  />
                </Link>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-[11px] font-semibold ${
                    published
                      ? "bg-positive-soft text-positive"
                      : "bg-warning-soft text-warning"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      published ? "bg-positive" : "bg-warning"
                    }`}
                  />
                  {published ? "No ar" : "Rascunho"}
                </span>
              </div>

              <nav aria-label="Menu do painel" className="flex flex-col gap-1">
                {DESKTOP_NAV.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center justify-between gap-3 rounded-pill px-4 text-small transition-all ${
                        active
                          ? "bg-lime font-semibold text-on-lime shadow-sm"
                          : "font-medium text-ink-muted hover:bg-hover hover:text-ink"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon name={item.icon} size={18} />
                        <span>{item.label}</span>
                      </span>
                      {active && (
                        <svg
                          viewBox="0 0 24 24"
                          width={14}
                          height={14}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex min-h-11 items-center gap-2.5 rounded-pill border border-line bg-paper px-4 text-small font-semibold text-ink transition-colors hover:border-ink"
                >
                  <Icon name="lock" size={16} />
                  <span>Admin</span>
                </Link>
              )}

              {plan === "free" && (
                <Link
                  href="/app/plano"
                  className="group flex flex-col gap-2 rounded-[20px] bg-ink p-4 text-paper shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-small font-semibold">
                      Linkmural Pro
                    </span>
                    <span className="rounded-pill bg-lime px-2 py-0.5 text-[10px] font-bold text-on-lime">
                      PRO
                    </span>
                  </div>
                  <span className="text-caption text-paper/70">
                    Links ilimitados e métricas por link.
                  </span>
                </Link>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                <span className="truncate text-caption text-ink-muted">
                  {email ?? "Conta"}
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
            {/* Minimal Mobile Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-paper/95 px-4 py-3 backdrop-blur-sm lg:hidden">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  src={avatarUrl}
                  name={businessName || slug}
                  size={32}
                />
                <p className="truncate font-display text-small font-semibold text-ink">
                  {businessName || slug}
                </p>
              </div>

              <Link
                href="/app/previa"
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-pill border border-line bg-surface px-3.5 text-caption font-semibold text-ink shadow-sm"
              >
                <Icon name="external" size={14} />
                <span>Prévia</span>
              </Link>
            </header>

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:py-8">
              {suspended && (
                <div className="mb-5">
                  <Alert tone="error" title="Conta suspensa">
                    Página retirada do ar pela moderação.{" "}
                    <Link href="/app/ajuda" className="font-semibold underline">
                      Falar com suporte
                    </Link>
                    .
                  </Alert>
                </div>
              )}
              {children}
            </main>
          </div>

          {/* Mobile Bottom Tab Bar with elevated center ink + lime button (reference inspired) */}
          <nav
            aria-label="Navegação principal"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-surface/95 backdrop-blur-md lg:hidden"
          >
            <div className="mx-auto grid max-w-lg grid-cols-5 items-center px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              {MOBILE_LEFT_TABS.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                      active
                        ? "font-semibold text-ink"
                        : "font-medium text-ink-muted"
                    }`}
                  >
                    <Icon name={item.icon} size={19} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Center Elevated Dark Circle Button (Links) */}
              <div className="flex justify-center">
                <Link
                  href="/app/pagina"
                  aria-label="Meus links"
                  aria-current={centerActive ? "page" : undefined}
                  className={`-mt-6 inline-grid size-13 place-items-center rounded-full shadow-md transition-transform active:scale-95 ${
                    centerActive
                      ? "bg-lime text-on-lime ring-4 ring-surface"
                      : "bg-ink text-lime ring-4 ring-surface"
                  }`}
                >
                  <Icon name="link" size={21} />
                </Link>
              </div>

              {MOBILE_RIGHT_TABS.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                      active
                        ? "font-semibold text-ink"
                        : "font-medium text-ink-muted"
                    }`}
                  >
                    <Icon name={item.icon} size={19} />
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
