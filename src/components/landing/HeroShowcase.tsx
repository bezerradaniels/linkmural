"use client";

/* eslint-disable @next/next/no-img-element -- landing showcase uses local creator photos */
import { useState } from "react";
import { Icon } from "@/components/ui";
import { STYLES } from "@/lib/styles";

type DemoId = "mosaico" | "balcao" | "cartao";

const DEMOS: {
  id: DemoId;
  tabLabel: string;
  modelTag: string;
  avatar: string;
  cover: string;
  name: string;
  kind: string;
  status: string;
  slug: string;
  palette: (typeof STYLES)[keyof typeof STYLES]["palette"];
}[] = [
  {
    id: "mosaico",
    tabLabel: "Mosaico",
    modelTag: "Criadora · Estilo Pop",
    avatar: "/images/creator-bento.jpg",
    cover: "/images/creator-bento.jpg",
    name: "Malu Carioca",
    kind: "TikTok · Moda & Lifestyle · RJ",
    status: "Vlog novo no ar",
    slug: "malurj",
    palette: STYLES.pop.palette,
  },
  {
    id: "balcao",
    tabLabel: "Balcão",
    modelTag: "Criador · Estilo Sport",
    avatar: "/images/creator-studio.jpg",
    cover: "/images/creator-studio.jpg",
    name: "Gui SP · Beats",
    kind: "Produtor & Criador · SP",
    status: "Agenda aberta",
    slug: "guisp",
    palette: STYLES.sport.palette,
  },
  {
    id: "cartao",
    tabLabel: "Cartão",
    modelTag: "Estúdio · Estilo Dark",
    avatar: "/images/studio-collab.jpg",
    cover: "/images/studio-collab.jpg",
    name: "Studio Collab",
    kind: "Agência & Produção Criativa",
    status: "Online agora",
    slug: "studiocollab",
    palette: STYLES.dark.palette,
  },
];

export function HeroShowcase() {
  const [active, setActive] = useState<DemoId>("mosaico");
  const demo = DEMOS.find((d) => d.id === active) ?? DEMOS[0];
  const p = demo.palette;
  const centered = demo.id === "mosaico";

  return (
    <div className="flex w-full max-w-[360px] flex-col items-center gap-3">
      {/* Model switcher */}
      <div
        role="tablist"
        aria-label="Testar os 3 modelos de página"
        className="inline-flex w-full items-center justify-between gap-1 rounded-pill border border-line bg-surface p-1 shadow-xs"
      >
        {DEMOS.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(item.id)}
              className={`min-h-10 flex-1 cursor-pointer rounded-pill px-3 text-small font-semibold transition-colors ${
                selected
                  ? "bg-ink text-paper shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {item.tabLabel}
            </button>
          );
        })}
      </div>

      {/* Phone card with Cover photo + Avatar photo + Bento Grid */}
      <div
        className="w-full overflow-hidden rounded-[28px] border shadow-md transition-colors duration-200"
        style={{
          backgroundColor: p.bg,
          borderColor: p.line,
          color: p.ink,
        }}
      >
        {/* Cover Banner with real creator photo */}
        <div className="relative flex h-28 items-start justify-between overflow-hidden px-4 pt-3.5">
          <img
            src={demo.cover}
            alt={demo.name}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          <span className="relative z-1 inline-flex items-center gap-1.5 rounded-pill bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
            <span className="size-1.5 rounded-full bg-[#22C55E]" />
            {demo.status}
          </span>
          <span className="relative z-1 rounded-pill bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
            Capa + Logo
          </span>
        </div>

        <div className="px-5 pb-5">
          {/* Creator photo avatar overlapping Cover */}
          <div
            className={`flex flex-col ${centered ? "items-center text-center" : "items-start text-left"}`}
          >
            <img
              src={demo.avatar}
              alt={demo.name}
              className={`relative z-1 -mt-8 size-15 shrink-0 border-4 object-cover shadow-sm ${
                centered ? "rounded-full" : "rounded-[18px]"
              }`}
              style={{ borderColor: p.bg }}
            />
            <p className="mt-1.5 truncate font-display text-body font-bold">
              {demo.name}
            </p>
            <p className="truncate text-caption" style={{ color: p.muted }}>
              {demo.kind}
            </p>
          </div>

          {/* Compact Bento Grid */}
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <div
              className="col-span-2 flex items-center justify-between rounded-[10px] px-3.5 py-2.5 text-caption font-bold"
              style={{ backgroundColor: p.accent, color: p.onAccent }}
            >
              <span>Vídeo novo + Mídia Kit</span>
              <Icon name="arrow" size={15} />
            </div>
            <div
              className="flex min-h-[72px] flex-col justify-between rounded-[10px] border p-2.5 text-caption font-semibold"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <Icon name="shop" size={15} />
              <span>Looks &amp; Cupons</span>
            </div>
            <div
              className="flex min-h-[72px] flex-col justify-between rounded-[10px] border p-2.5 text-caption font-semibold"
              style={{ backgroundColor: p.surface, borderColor: p.line }}
            >
              <Icon name="chat" size={15} />
              <span>Publis WhatsApp</span>
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-3.5 flex items-center justify-between border-t pt-2.5 text-[11px]"
            style={{ borderColor: p.line, color: p.muted }}
          >
            <span>linkmural.com/{demo.slug}</span>
            <span>{demo.modelTag}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
