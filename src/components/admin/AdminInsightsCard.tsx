"use client";

import Link from "next/link";
import type { InsightDatum } from "@/lib/admin/dashboard-data";

const TONE_STYLES: Record<
  InsightDatum["tone"],
  { bg: string; fg: string; iconPath: string }
> = {
  danger: {
    bg: "bg-[#FEE2E2]",
    fg: "text-[#EF4444]",
    iconPath: "M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  },
  emerald: {
    bg: "bg-[#D1FAE5]",
    fg: "text-[#10B981]",
    iconPath: "M3 17l6-6 4 4 8-8m0 0h-5m5 0v5",
  },
  indigo: {
    bg: "bg-[#EEF0FF]",
    fg: "text-[#5B4FE9]",
    iconPath: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3Z",
  },
};

export function AdminInsightsCard({
  insights,
}: {
  insights: InsightDatum[];
}) {
  return (
    <section className="flex flex-col justify-between rounded-[10px] border border-[#E4E1FF] bg-[#F4F3FF] p-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <svg
            viewBox="0 0 24 24"
            width={14}
            height={14}
            fill="none"
            stroke="#5B4FE9"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3l1.8 4.4L18.2 9l-4.4 1.8L12 15.2l-1.8-4.4L5.8 9l4.4-1.6L12 3Z" />
          </svg>
          <h2 className="text-[17px] font-semibold text-[#101828]">
            Insights operacionais
          </h2>
        </div>
        <span className="inline-flex h-5 items-center rounded-md bg-white px-2 text-[12px] leading-none font-semibold text-[#5B4FE9]">
          Ao vivo
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {insights.map((item) => {
          const tone = TONE_STYLES[item.tone];
          return (
            <div
              key={item.id}
              className="rounded-[8px] border border-[#ECEAFD] bg-white p-2"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${tone.bg} ${tone.fg}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={13}
                    height={13}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={tone.iconPath} />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#101828]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[14px] leading-snug text-[#667085]">
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-1 inline-block text-[14px] font-semibold text-[#5B4FE9] hover:text-[#4338CA]"
                  >
                    {item.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
