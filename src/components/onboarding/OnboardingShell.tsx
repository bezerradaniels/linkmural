import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Steps } from "@/components/ui";

export function OnboardingShell({
  step,
  total = 7,
  title,
  subtitle,
  backHref,
  slug,
  children,
  footer,
}: {
  step?: number;
  total?: number;
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  slug?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-pill px-2 text-small font-medium text-ink-muted transition-colors hover:text-ink"
              >
                <span aria-hidden>←</span>
                Voltar
              </Link>
            ) : (
              <Link href="/" aria-label="linkmural, página inicial">
                <Image
                  src="/brand/linkmural-logo.svg"
                  alt="Linkmural"
                  width={120}
                  height={18}
                  priority
                />
              </Link>
            )}

            {slug ? (
              <span className="truncate rounded-pill border border-line bg-surface px-3 py-1 text-caption font-medium text-ink-muted">
                linkmural.com/<strong className="text-ink">{slug}</strong>
              </span>
            ) : step ? (
              <span className="text-caption font-medium text-ink-muted">
                Passo {step} de {total}
              </span>
            ) : null}
          </div>

          {step !== undefined && <Steps total={total} current={step} />}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col gap-6 px-4 pt-6 pb-32 sm:px-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-display-md tracking-[-0.03em]">
            {title}
          </h1>
          {subtitle && <p className="text-body text-ink-muted">{subtitle}</p>}
        </div>

        {children}
      </main>

      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
