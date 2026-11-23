import { Icon } from "@/components/ui";
import type { NicheItem } from "@/lib/niches";

/**
 * Pure Server Component phone mockup illustrating a tailored Linkmural
 * Bento Grid page for each programmatic niche route.
 */
export function NichePhonePreview({ niche }: { niche: NicheItem }) {
  const { preview } = niche;

  return (
    <div
      aria-label={`Prévia visual de página do linkmural para ${niche.name}`}
      className="mx-auto w-full max-w-[340px] rounded-[36px] border-2 border-ink bg-[#0E1015] p-3 shadow-lg"
    >
      <div className="flex flex-col gap-3.5 rounded-[28px] bg-paper p-4 text-ink">
        {/* Top URL bar */}
        <div className="flex items-center justify-center rounded-pill border border-line bg-surface px-3 py-1 text-[11px] font-medium text-ink-muted">
          linkmural.com/{preview.handle}
        </div>

        {/* Profile header */}
        <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-ink font-display text-title text-lime">
            {preview.displayName.slice(0, 2).toUpperCase()}
          </div>
          <p className="font-display text-body font-bold tracking-[-0.02em] text-ink">
            {preview.displayName}
          </p>
          <p className="text-[12px] leading-snug text-ink-muted">
            {preview.tagline}
          </p>
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
            <Icon name="pin" size={12} />
            {preview.city}
          </span>
        </div>

        {/* Bento Grid cards */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {preview.links.map((link) => {
            const spanClass = link.size === "full" ? "col-span-2" : "col-span-1";
            const toneClass = link.accent
              ? "border-ink bg-lime text-on-lime"
              : "border-line bg-surface text-ink";
            const subClass = link.accent ? "text-on-lime/80" : "text-ink-muted";

            return (
              <div
                key={link.title}
                className={`${spanClass} flex flex-col justify-between gap-1 rounded-2xl border p-3 ${toneClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] leading-tight font-semibold">
                    {link.title}
                  </span>
                  <Icon
                    name="arrow"
                    size={13}
                    className="mt-0.5 shrink-0 opacity-75"
                  />
                </div>
                <span className={`text-[11px] leading-snug ${subClass}`}>
                  {link.subtitle}
                </span>
              </div>
            );
          })}
        </div>

        {/* Subtle footer */}
        <div className="pt-1 text-center text-[10px] text-ink-muted">
          Modelo ilustrativo · linkmural
        </div>
      </div>
    </div>
  );
}
