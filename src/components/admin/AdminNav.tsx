"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, ToastProvider } from "@/components/ui";
import type { ReactNode } from "react";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/empresas", label: "Empresas" },
  { href: "/admin/moderacao", label: "Moderação" },
  { href: "/admin/feedback", label: "Espera & Feedback" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-paper text-ink">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Link href="/admin" aria-label="Admin linkmural">
                <Image
                  src="/brand/linkmural-logo.svg"
                  alt="Linkmural"
                  width={120}
                  height={18}
                  priority
                />
              </Link>
              <Badge variant="business">Admin</Badge>
            </div>

            <div className="flex items-center gap-3 text-caption text-ink-muted">
              <span className="hidden sm:inline">{email}</span>
              <Link
                href="/app"
                className="inline-flex min-h-11 items-center rounded-pill border border-line-strong px-3.5 text-small font-semibold text-ink hover:border-ink"
              >
                Voltar ao painel
              </Link>
            </div>
          </div>

          <nav
            aria-label="Navegação do admin"
            className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
          >
            {TABS.map((tab) => {
              const active =
                tab.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-pill px-4 text-small font-medium transition-colors ${
                    active
                      ? "bg-ink font-semibold text-paper"
                      : "text-ink-muted hover:bg-hover hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
