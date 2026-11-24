"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AdminDateRangePicker } from "@/components/admin/AdminDateRangePicker";
import { SignOutForm } from "@/components/app/SignOutForm";
import { Avatar, ToastProvider } from "@/components/ui";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function firstNameFrom(fullName: string | null, email: string | null): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/).slice(0, 2).join(" ");
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
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

function ExportCsvButton() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const href = qs ? `/api/admin/export?${qs}` : "/api/admin/export";
  return (
    <a
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5B4FE9] px-3.5 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(91,79,233,0.25)] transition-colors hover:bg-[#4338CA]"
    >
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
        <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <span>Exportar CSV</span>
    </a>
  );
}

export function AdminShell({
  email,
  fullName = null,
  openReportsCount = 0,
  todayIso = "2026-11-24",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(
      q ? `/admin/empresas?q=${encodeURIComponent(q)}` : "/admin/empresas",
    );
  }

  const displayName = firstNameFrom(fullName, email);

  const navGroups: NavGroup[] = [
    {
      title: "Visão geral",
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          icon: (
            <SidebarIcon path="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
          ),
        },
      ],
    },
    {
      title: "Operacional",
      items: [
        {
          href: "/admin/empresas",
          label: "Empresas",
          icon: (
            <SidebarIcon path="M4 21V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M14 11h4a2 2 0 0 1 2 2v8M8 9h2M8 13h2M8 17h2" />
          ),
        },
        {
          href: "/admin/atividades",
          label: "Atividades",
          icon: <SidebarIcon path="M4 12h3.5l2.5-6 4 12 2.5-6H20" />,
        },
      ],
    },
    {
      title: "Financeiro",
      items: [
        {
          href: "/admin/faturamento",
          label: "Faturamento",
          icon: (
            <SidebarIcon path="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10.5h18M7 15h4" />
          ),
        },
      ],
    },
    {
      title: "Suporte",
      items: [
        {
          href: "/admin/moderacao",
          label: "Moderação",
          badge: openReportsCount > 0 ? openReportsCount : undefined,
          icon: (
            <SidebarIcon path="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM12 8.5v4M12 15.5h.01" />
          ),
        },
        {
          href: "/admin/feedback",
          label: "Feedback",
          icon: (
            <SidebarIcon path="M21 11.5a8.4 8.4 0 0 1-12.5 7.3L3 20.5l1.6-5.1A8.4 8.4 0 1 1 21 11.5z" />
          ),
        },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebarBody = (
    <>
      <div className="flex flex-col gap-5">
        {/* Brand */}
        <div className="flex items-center justify-between px-2.5 pt-1">
          <Link
            href="/admin"
            aria-label="Admin linkmural"
            className="flex items-center gap-2"
          >
            <Image
              src="/brand/linkmural-logo.svg"
              alt="Linkmural"
              width={116}
              height={18}
              priority
            />
          </Link>
        </div>

        {/* Grouped Navigation */}
        <nav aria-label="Navegação do admin" className="flex flex-col gap-4">
          {navGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <p className="px-2.5 text-[11.5px] font-semibold tracking-wider text-[#98A2B3] uppercase">
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-8.5 items-center justify-between gap-2 rounded-lg px-2.5 text-[14.5px] transition-colors ${
                      active
                        ? "bg-[#EEF0FF] font-semibold text-[#5B4FE9]"
                        : "font-medium text-[#475467] hover:bg-[#F2F4F7] hover:text-[#101828]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={active ? "text-[#5B4FE9]" : "text-[#667085]"}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#FEE2E2] px-1.5 py-0.5 text-[10px] font-semibold text-[#EF4444]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom user profile + quick links */}
      <div className="flex flex-col gap-2 border-t border-[#EAECF0] pt-3.5">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <Avatar name={displayName} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[#101828]">
              {displayName}
            </p>
            <p className="text-[11px] text-[#667085]">Admin</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 px-1">
          <Link
            href="/app"
            className="rounded-md px-2 py-1 text-[11px] font-medium text-[#667085] transition-colors hover:bg-[#F2F4F7] hover:text-[#101828]"
          >
            ← Ir ao app
          </Link>
          <SignOutForm>
            <button
              type="submit"
              className="cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium text-[#667085] transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444]"
            >
              Sair
            </button>
          </SignOutForm>
        </div>
      </div>
    </>
  );

  return (
    <ToastProvider>
      <div className="flex min-h-dvh bg-[#F8F9FC] text-[#101828]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[216px] shrink-0 flex-col justify-between overflow-y-auto border-r border-[#EAECF0] bg-[#FBFBFD] px-3 py-4">
          {sidebarBody}
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-[1px]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative z-10 flex h-full w-64 flex-col justify-between overflow-y-auto border-r border-[#EAECF0] bg-white px-4 py-5 shadow-xl">
              {sidebarBody}
            </aside>
          </div>
        )}

        {/* Main Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2.5 border-b border-[#EAECF0] bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:px-5">
            <div className="flex flex-1 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-expanded={mobileMenuOpen}
                aria-label="Abrir menu do admin"
                className="inline-grid size-9 cursor-pointer place-items-center rounded-lg border border-[#D0D5DD] bg-white text-[#344054] lg:hidden"
              >
                <svg
                  viewBox="0 0 24 24"
                  width={17}
                  height={17}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>

              <form
                onSubmit={handleSearchSubmit}
                className="relative w-full max-w-xs"
              >
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
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#98A2B3]"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa, @slug ou e-mail..."
                  aria-label="Buscar empresa, slug ou e-mail"
                  className="h-9 w-full rounded-lg border border-[#EAECF0] bg-[#F9FAFB] pr-11 pl-8.5 text-[12px] text-[#101828] placeholder-[#98A2B3] outline-none transition-colors focus:border-[#5B4FE9] focus:bg-white"
                />
                <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-[#EAECF0] bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-[#98A2B3]">
                  ⌘K
                </kbd>
              </form>
            </div>

            {/* Right utilities: Date picker + Export CSV */}
            <div className="flex items-center gap-2">
              <Suspense fallback={null}>
                <AdminDateRangePicker todayIso={todayIso} />
              </Suspense>
              <Suspense fallback={null}>
                <ExportCsvButton />
              </Suspense>
            </div>
          </header>

          {/* Content */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 sm:px-5">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
