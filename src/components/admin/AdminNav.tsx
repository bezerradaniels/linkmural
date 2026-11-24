"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Suspense,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { AdminDateRangePicker } from "@/components/admin/AdminDateRangePicker";
import { SignOutForm } from "@/components/app/SignOutForm";
import { Avatar, ToastProvider } from "@/components/ui";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
  badge?: number;
};

const THEME_STORAGE_KEY = "lm-admin-theme";
const THEME_EVENT = "lm-admin-theme-change";

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getThemeSnapshot(): "light" | "dark" {
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): "light" | "dark" {
  return "light";
}

function firstNameFrom(fullName: string | null, email: string | null): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0];
  }
  if (email) {
    const local = email.split("@")[0] ?? "Admin";
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Admin";
}

function SidebarIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

export function AdminShell({
  email,
  fullName = null,
  openReportsCount = 0,
  greeting = "Olá",
  todayIso = "2026-11-23",
  children,
}: {
  email: string | null;
  fullName?: string | null;
  openReportsCount?: number;
  greeting?: string;
  todayIso?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleThemeChange(next: "light" | "dark") {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/admin/empresas?q=${encodeURIComponent(q)}` : "/admin/empresas");
  }

  const displayName = firstNameFrom(fullName, email);

  const navItems: NavItem[] = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: () => (
        <SidebarIcon path="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />
      ),
    },
    {
      href: "/admin/empresas",
      label: "Empresas",
      icon: () => (
        <SidebarIcon path="M4 21V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M14 11h4a2 2 0 0 1 2 2v8M8 9h2M8 13h2M8 17h2M17 15h.01M17 18h.01" />
      ),
    },
    {
      href: "/admin/faturamento",
      label: "Faturamento",
      icon: () => (
        <SidebarIcon path="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10.5h18M7 15h4" />
      ),
    },
    {
      href: "/admin/moderacao",
      label: "Moderação",
      badge: openReportsCount > 0 ? openReportsCount : undefined,
      icon: () => (
        <SidebarIcon path="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM12 8.5v4M12 15.5h.01" />
      ),
    },
    {
      href: "/admin/feedback",
      label: "Espera & Feedback",
      icon: () => (
        <SidebarIcon path="M21 11.5a8.4 8.4 0 0 1-12.5 7.3L3 20.5l1.6-5.1A8.4 8.4 0 1 1 21 11.5z" />
      ),
    },
    {
      href: "/admin/atividades",
      label: "Atividades",
      icon: () => (
        <SidebarIcon path="M4 12h3.5l2.5-6 4 12 2.5-6H20" />
      ),
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <ToastProvider>
      <div
        data-theme={theme}
        className="flex min-h-dvh bg-surface text-ink transition-colors duration-200"
      >
        {/* Desktop Sidebar */}
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 xl:w-64 shrink-0 flex-col justify-between overflow-y-auto bg-surface px-4 py-6">
          <div className="flex flex-col gap-6">
            {/* Brand */}
            <div className="flex items-center justify-between px-2">
              <Link
                href="/admin"
                aria-label="Admin linkmural"
                className="flex items-center gap-2.5"
              >
                <Image
                  src="/brand/linkmural-logo.svg"
                  alt="Linkmural"
                  width={122}
                  height={19}
                  priority
                  className="dark:hidden"
                />
                <Image
                  src="/brand/linkmural-logo-negativo.svg"
                  alt="Linkmural"
                  width={122}
                  height={19}
                  priority
                  className="hidden dark:block"
                />
              </Link>
              <span className="rounded-pill bg-lime-soft px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                Admin
              </span>
            </div>

            {/* Navigation */}
            <nav
              aria-label="Navegação do admin"
              className="flex flex-col gap-1"
            >
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-11 items-center justify-between gap-3 rounded-pill px-4 text-small transition-colors ${
                      active
                        ? "bg-lime font-semibold text-on-lime shadow-sm"
                        : "font-medium text-ink-muted hover:bg-hover hover:text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon(active)}
                      <span>{item.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {item.badge !== undefined && (
                        <span
                          className={`inline-flex min-w-5 items-center justify-center rounded-pill px-1.5 py-0.5 text-[11px] font-semibold ${
                            active
                              ? "bg-ink text-paper"
                              : "bg-negative-soft text-negative"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <svg
                          viewBox="0 0 24 24"
                          width={15}
                          height={15}
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
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom sidebar actions */}
          <div className="flex flex-col gap-1.5 border-t border-line pt-4">
            <Link
              href="/app"
              className="flex min-h-11 items-center gap-3 rounded-pill px-3 text-small font-medium text-ink-muted transition-colors hover:bg-hover hover:text-ink"
            >
              <span className="inline-grid size-7 place-items-center rounded-full bg-paper text-ink">
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </span>
              <span>Voltar ao painel</span>
            </Link>

            <SignOutForm>
              <button
                type="submit"
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-pill px-3 text-small font-medium text-ink-muted transition-colors hover:bg-hover hover:text-ink"
              >
                <span className="inline-grid size-7 place-items-center rounded-full bg-lime-soft text-ink">
                  <svg
                    viewBox="0 0 24 24"
                    width={14}
                    height={14}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </span>
                <span>Sair</span>
              </button>
            </SignOutForm>
          </div>
        </aside>

        {/* Main Column */}
        <div className="flex min-w-0 flex-1 flex-col bg-surface">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-surface/95 px-4 py-3.5 backdrop-blur-sm sm:px-6 lg:px-8 lg:py-5">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-expanded={mobileMenuOpen}
                aria-label="Abrir menu do admin"
                className="inline-grid size-11 cursor-pointer place-items-center rounded-pill border border-line bg-paper text-ink lg:hidden"
              >
                <svg
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 6l12 12M18 6 6 18" />
                  ) : (
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  )}
                </svg>
              </button>

              <div>
                <p className="font-display text-title tracking-[-0.03em] text-ink sm:text-display-md">
                  {greeting}, {displayName}!
                </p>
              </div>
            </div>

            {/* Right utilities: Search, Date, Theme toggle, Avatar */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <form
                onSubmit={handleSearchSubmit}
                className="relative hidden md:block"
              >
                <svg
                  viewBox="0 0 24 24"
                  width={15}
                  height={15}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
                >
                  <path d="M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M20 20l-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa ou /slug..."
                  aria-label="Buscar empresa ou endereço"
                  className="min-h-11 w-52 rounded-pill border border-line bg-paper pr-4 pl-9 text-small text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none xl:w-64"
                />
              </form>

              <Suspense
                fallback={
                  <span className="inline-flex min-h-11 items-center rounded-pill border border-line bg-paper px-3.5 text-small text-ink-muted">
                    Período
                  </span>
                }
              >
                <AdminDateRangePicker todayIso={todayIso} />
              </Suspense>

              {/* Light / Dark Segmented Toggle (matching reference) */}
              <div
                role="group"
                aria-label="Alternar tema"
                className="inline-flex min-h-11 items-center gap-0.5 rounded-pill border border-line bg-paper p-1"
              >
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  aria-label="Tema escuro"
                  aria-pressed={theme === "dark"}
                  className={`inline-grid size-9 cursor-pointer place-items-center rounded-full transition-colors ${
                    theme === "dark"
                      ? "bg-surface text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  aria-label="Tema claro"
                  aria-pressed={theme === "light"}
                  className={`inline-grid size-9 cursor-pointer place-items-center rounded-full transition-colors ${
                    theme === "light"
                      ? "bg-surface text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={16}
                    height={16}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                  </svg>
                </button>
              </div>

              <div
                title={email ?? displayName}
                className="inline-flex items-center"
              >
                <Avatar name={fullName || email || "Admin"} size={32} />
              </div>
            </div>
          </header>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="animate-pop-in border-b border-line bg-surface px-4 pb-4 lg:hidden">
              <form onSubmit={handleSearchSubmit} className="mb-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa ou /slug..."
                  aria-label="Buscar empresa ou endereço"
                  className="min-h-11 w-full rounded-pill border border-line bg-paper px-4 text-small text-ink placeholder:text-ink-muted"
                />
              </form>
              <nav
                aria-label="Navegação mobile do admin"
                className="grid grid-cols-2 gap-1.5"
              >
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center justify-between gap-2 rounded-pill px-3.5 text-small ${
                        active
                          ? "bg-lime font-semibold text-on-lime"
                          : "bg-paper font-medium text-ink-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {item.icon(active)}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge !== undefined && (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-pill bg-negative px-1.5 text-[11px] font-semibold text-on-negative">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <Link
                  href="/app"
                  className="inline-flex min-h-11 items-center rounded-pill border border-line px-3.5 text-small font-medium text-ink"
                >
                  ← Voltar ao painel
                </Link>
                <SignOutForm>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-pill px-3.5 text-small font-medium text-negative"
                  >
                    Sair
                  </button>
                </SignOutForm>
              </div>
            </div>
          )}

          {/* Rounded Bento Canvas */}
          <main className="mx-3 mb-4 flex-1 rounded-[28px] border border-line/70 bg-paper p-4 sm:mx-6 sm:mb-6 sm:p-5 lg:mx-8 lg:mb-8 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
