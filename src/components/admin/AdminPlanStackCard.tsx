import Link from "next/link";
import { formatMetricNumber } from "@/lib/panel-helpers";
import { formatBrl } from "@/lib/plans";

export function AdminPlanStackCard({
  freeCount,
  proCount,
  businessCount,
  mrrCents,
  waitlistCount,
  openReportsCount,
}: {
  freeCount: number;
  proCount: number;
  businessCount: number;
  mrrCents: number;
  waitlistCount: number;
  openReportsCount: number;
}) {
  return (
    <section
      style={{ animationDelay: "180ms" }}
      className="animate-rise flex flex-col justify-between gap-4 rounded-[22px] border border-line/80 bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-body font-semibold tracking-[-0.01em] text-ink">
            Planos & Saúde
          </h2>
          <p className="text-caption text-ink-muted">
            Base ativa por assinatura
          </p>
        </div>

        <Link
          href="/admin/faturamento"
          aria-label="Ver faturamento"
          className="inline-grid size-9 place-items-center rounded-full border border-line bg-paper text-ink-muted transition-colors hover:border-ink hover:text-ink"
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
          >
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </Link>
      </div>

      {/* Layered visual tier cards inspired by "Your cards" */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col justify-between rounded-2xl bg-ink p-3.5 text-paper shadow-sm transition-transform duration-200 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-75">Pro</span>
            <span className="size-2 rounded-full bg-lime" />
          </div>
          <div className="mt-4">
            <p className="font-display text-title leading-none">
              {formatMetricNumber(proCount)}
            </p>
            <p className="mt-1 text-[11px] opacity-70">contas</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-lime p-3.5 text-on-lime shadow-sm transition-transform duration-200 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">
              Negócios
            </span>
            <span className="size-2 rounded-full bg-ink" />
          </div>
          <div className="mt-4">
            <p className="font-display text-title leading-none">
              {formatMetricNumber(businessCount)}
            </p>
            <p className="mt-1 text-[11px] opacity-75">contas</p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-paper p-3.5 text-ink transition-transform duration-200 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted">
              Grátis
            </span>
            <span className="size-2 rounded-full bg-line-strong" />
          </div>
          <div className="mt-4">
            <p className="font-display text-title leading-none">
              {formatMetricNumber(freeCount)}
            </p>
            <p className="mt-1 text-[11px] text-ink-muted">contas</p>
          </div>
        </div>
      </div>

      {/* Compact operational alerts */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-caption">
        <span className="text-ink-muted">
          MRR est.{" "}
          <strong className="font-semibold text-ink">
            {formatBrl(mrrCents)}
          </strong>
        </span>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/feedback"
            className="text-ink-muted hover:text-ink hover:underline"
          >
            Espera: <strong className="text-ink">{waitlistCount}</strong>
          </Link>
          <Link
            href="/admin/moderacao"
            className={
              openReportsCount > 0
                ? "font-semibold text-negative hover:underline"
                : "text-ink-muted hover:text-ink hover:underline"
            }
          >
            Denúncias: <strong>{openReportsCount}</strong>
          </Link>
        </div>
      </div>
    </section>
  );
}
