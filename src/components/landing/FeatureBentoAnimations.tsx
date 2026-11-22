"use client";

/* eslint-disable @next/next/no-img-element -- landing showcase uses local creator photos and Unsplash CDN */
import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonClasses, Icon } from "@/components/ui";
import type { LinkSize } from "@/lib/styles";

const UNSPLASH_COVERS = [
  {
    label: "Centro · Degradê",
    align: "center" as const,
    shape: "rounded-full",
    cover:
      "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Esquerda · Película",
    align: "left" as const,
    shape: "rounded-2xl",
    cover:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Centro · Limpa",
    align: "center" as const,
    shape: "rounded-xl",
    cover:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=700&q=80",
  },
];

const STUDIO_SLIDES = [
  {
    id: "gallery" as const,
    tab: "Galeria",
  },
  {
    id: "youtube" as const,
    tab: "YouTube",
  },
  {
    id: "service" as const,
    tab: "Serviço",
  },
];

export function FeatureBentoAnimations() {
  const [bentoSize, setBentoSize] = useState<LinkSize>("2x2");
  const [coverIdx, setCoverIdx] = useState(0);
  const [studioIdx, setStudioIdx] = useState(0);
  const [utmIdx, setUtmIdx] = useState(0);

  useEffect(() => {
    const sizes: LinkSize[] = ["2x2", "1x1", "2x1"];
    let step = 0;
    const timer = setInterval(() => {
      step = (step + 1) % 12;
      setBentoSize(sizes[step % 3]);
      setCoverIdx(step % UNSPLASH_COVERS.length);
      setStudioIdx(step % STUDIO_SLIDES.length);
      setUtmIdx(step % 3);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const activeCover = UNSPLASH_COVERS[coverIdx];
  const activeStudio = STUDIO_SLIDES[studioIdx];
  const utmChannels = [
    { tag: "tiktok", label: "TikTok Bio", pct: 68, clicks: "1.420 cliques" },
    {
      tag: "instagram",
      label: "Instagram Stories",
      pct: 24,
      clicks: "510 cliques",
    },
    { tag: "whatsapp", label: "WhatsApp VIP", pct: 8, clicks: "170 cliques" },
  ];
  const activeUtm = utmChannels[utmIdx];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ================================================================= */}
        {/* CARD 1: BENTO GRID & DRAG-AND-DROP (2x1, 1x1, 2x2)                */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-ink bg-[#0E1015] p-5 text-white sm:p-6">
          {/* Interactive Animation Stage */}
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-white/80">
                <Icon name="grip" size={14} className="text-lime" />
                Clique ou veja redimensionar:
              </span>
              <div className="inline-flex rounded-pill border border-white/15 bg-black/40 p-0.5">
                {(["2x1", "1x1", "2x2"] as LinkSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setBentoSize(sz)}
                    className={`cursor-pointer rounded-pill px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                      bentoSize === sz
                        ? "bg-lime text-on-lime"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    {sz.replace("x", "×")}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Morphing Grid */}
            <div className="grid min-h-[172px] grid-cols-2 gap-2.5">
              {/* Animated Primary Card */}
              <div
                className={`relative flex overflow-hidden rounded-xl border border-lime/50 bg-gradient-to-br from-lime/25 via-lime/10 to-transparent p-3.5 transition-all duration-500 ${
                  bentoSize === "1x1"
                    ? "col-span-1 flex-col justify-between"
                    : bentoSize === "2x1"
                      ? "col-span-2 items-center justify-between py-2.5"
                      : "col-span-2 flex-col justify-between"
                }`}
              >
                {bentoSize === "2x2" && (
                  <img
                    src="/images/creator-bento.jpg"
                    alt="Criadora TikTok"
                    className="absolute inset-0 size-full object-cover opacity-55 transition-opacity duration-500"
                  />
                )}
                <div className="relative z-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-lime px-2.5 py-0.5 text-[11px] font-bold text-on-lime">
                    Card {bentoSize.replace("x", "×")}
                  </span>
                  <span className="grid size-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur-xs">
                    <Icon name="arrow" size={14} />
                  </span>
                </div>
                <div className="relative z-1 mt-2">
                  <p className="font-display text-small font-bold text-white">
                    Mídia Kit & Publis TikTok
                  </p>
                  {bentoSize !== "2x1" && (
                    <p className="text-[11px] text-white/80">
                      Arraste e mude o tamanho em 1 toque
                    </p>
                  )}
                </div>
              </div>

              {/* Secondary Tiles */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-caption font-semibold backdrop-blur-xs">
                <span>TikTok · @luiza</span>
                <Icon name="arrow" size={13} className="text-lime" />
              </div>
              {bentoSize !== "1x1" && (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-caption font-semibold backdrop-blur-xs">
                  <span>Cupons & Looks</span>
                  <Icon name="arrow" size={13} className="text-lime" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-lime uppercase">
                Bento Design & Drag-and-Drop
              </span>
              <h3 className="mt-0.5 font-display text-title leading-snug">
                Redimensione cards (2×1, 1×1 e 2×2) e arraste
              </h3>
              <p className="mt-1 text-caption text-white/70">
                Destaque o que mais converte em um grid padronizado de 2
                colunas.
              </p>
            </div>
          </div>
        </article>

        {/* ================================================================= */}
        {/* CARD 2: LOGO & CAPA + UNSPLASH INTEGRADO                          */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-5 sm:p-6">
          {/* Interactive Header Morph Stage */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-paper p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption font-semibold text-ink-muted">
                Cabeçalho do modelo:
              </span>
              <div className="flex gap-1">
                {UNSPLASH_COVERS.map((c, idx) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCoverIdx(idx)}
                    className={`cursor-pointer rounded-pill px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      coverIdx === idx
                        ? "bg-ink text-paper"
                        : "bg-surface text-ink-muted hover:text-ink"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="relative h-24 w-full overflow-hidden">
                <img
                  src={activeCover.cover}
                  alt="Capa do Unsplash"
                  className="size-full object-cover transition-all duration-500"
                />
                {coverIdx === 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
                )}
                {coverIdx === 1 && (
                  <div className="absolute inset-0 bg-lime/30 mix-blend-multiply" />
                )}
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-pill bg-black/65 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                  <Icon name="check" size={11} className="text-lime" />
                  Foto grátis · Unsplash
                </span>
              </div>

              <div
                className={`flex flex-col px-4 pb-3.5 transition-all duration-500 ${
                  activeCover.align === "center"
                    ? "items-center text-center"
                    : "items-start text-left"
                }`}
              >
                <img
                  src="/images/creator-bento.jpg"
                  alt="Avatar da criadora"
                  className={`relative z-1 -mt-7 size-14 border-4 border-surface object-cover shadow-sm transition-all duration-500 ${activeCover.shape}`}
                />
                <p className="mt-1 font-display text-small font-bold text-ink">
                  Malu Carioca · @malurj
                </p>
                <p className="text-[11px] text-ink-muted">
                  Criadora · Beleza, Moda & Lifestyle
                </p>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider text-ink-muted uppercase">
              Logo, Capa & Unsplash
            </span>
            <h3 className="mt-0.5 font-display text-title leading-snug text-ink">
              Cabeçalho personalizado + Unsplash em 1 clique
            </h3>
            <p className="mt-1 text-caption text-ink-muted">
              Escolha formato do logo, alinhamento, degradê da capa e milhares
              de fotos gratuitas sem sair do painel.
            </p>
          </div>
        </article>

        {/* ================================================================= */}
        {/* CARD 3: PLANO STUDIO (GALERIA CARROSSEL, YOUTUBE & SERVIÇOS)      */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-2.5 py-0.5 text-[10px] font-bold text-lime">
                Studio · Blocos Ricos
              </span>
              <div className="inline-flex rounded-pill border border-line bg-surface p-0.5">
                {STUDIO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStudioIdx(idx)}
                    className={`cursor-pointer rounded-pill px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                      studioIdx === idx
                        ? "bg-ink text-paper"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {s.tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Animated Studio Block Preview */}
            <div className="relative min-h-[158px] overflow-hidden rounded-xl border border-line bg-surface">
              {activeStudio.id === "gallery" && (
                <div className="relative h-[158px] w-full">
                  <img
                    src="/images/creator-studio.jpg"
                    alt="Galeria Carrossel"
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-2.5 right-2.5 rounded-pill bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    Carrossel · 1/6 fotos
                  </span>
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-white">
                    <div>
                      <p className="text-small font-bold">
                        Bastidores & Looks da Semana
                      </p>
                      <p className="text-[11px] text-white/80">
                        Deslize para ver o portfólio
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <span className="h-1.5 w-4 rounded-full bg-lime" />
                      <span className="size-1.5 rounded-full bg-white/50" />
                      <span className="size-1.5 rounded-full bg-white/50" />
                    </div>
                  </div>
                </div>
              )}

              {activeStudio.id === "youtube" && (
                <div className="relative h-[158px] w-full">
                  <img
                    src="/images/creator-bento.jpg"
                    alt="Vídeo do YouTube"
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/45">
                    <span className="grid size-12 animate-pulse place-items-center rounded-full bg-lime text-on-lime shadow-md">
                      ▶
                    </span>
                  </div>
                  <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between rounded-lg bg-black/70 px-3 py-1.5 text-white backdrop-blur-xs">
                    <span className="truncate text-caption font-semibold">
                      Vlog: Um dia gravando em SP
                    </span>
                    <span className="text-[10px] font-bold text-lime">
                      YouTube 16:9
                    </span>
                  </div>
                </div>
              )}

              {activeStudio.id === "service" && (
                <div className="flex h-[158px] flex-col justify-between p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src="/images/creator-studio.jpg"
                        alt="Criador"
                        className="size-9 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-small font-bold text-ink">
                          Combo Publi Reels + TikTok
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          Roteiro, gravação e entrega em 48h
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-lime-soft px-2.5 py-1 text-caption font-bold text-ink">
                      R$ 650
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-pill bg-ink px-4 py-2 text-caption font-bold text-lime">
                    <span>Solicitar orçamento no WhatsApp</span>
                    <Icon name="arrow" size={14} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider text-ink-muted uppercase">
              Galeria, YouTube & Serviços
            </span>
            <h3 className="mt-0.5 font-display text-title leading-snug text-ink">
              Mídia rica misturada direto nos seus links
            </h3>
            <p className="mt-1 text-caption text-ink-muted">
              Adicione carrossel de fotos, player do YouTube e cards de serviços
              com preço e CTA.
            </p>
          </div>
        </article>

        {/* ================================================================= */}
        {/* CARD 4: EFEITOS GLASS/GLOSSY + GERADOR DE UTM & MÉTRICAS          */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-ink bg-[#0E1015] p-5 text-white sm:p-6">
          <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 to-white/[0.03] p-4 backdrop-blur-md">
            {/* Glossy card preview */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold tracking-wide text-lime uppercase">
                  Gerador de UTM em 1 clique
                </span>
                <p className="truncate font-mono text-caption text-white">
                  linkmural.com/voce?utm_source=
                  <strong className="text-lime">{activeUtm.tag}</strong>
                </p>
              </div>
              <span className="rounded-pill bg-lime px-2.5 py-1 text-[10px] font-bold text-on-lime">
                Gerar link
              </span>
            </div>

            {/* Live animated UTM bars */}
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/35 p-3">
              <div className="flex items-center justify-between text-[11px] text-white/75">
                <span className="font-semibold">Origem das visitas (UTM)</span>
                <span className="font-bold text-lime">{activeUtm.clicks}</span>
              </div>
              {utmChannels.map((ch, idx) => (
                <div key={ch.tag} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={
                        idx === utmIdx
                          ? "font-bold text-white"
                          : "text-white/65"
                      }
                    >
                      {ch.label}
                    </span>
                    <span className="font-mono text-white/80">{ch.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === utmIdx ? "bg-lime" : "bg-white/40"
                      }`}
                      style={{ width: `${ch.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider text-lime uppercase">
              Glass, Glossy & Rastreamento UTM
            </span>
            <h3 className="mt-0.5 font-display text-title leading-snug">
              Visual com transparência e métricas por canal
            </h3>
            <p className="mt-1 text-caption text-white/70">
              Efeitos de vidro e glossy nos cards + gerador de UTM para saber
              qual rede social traz mais vendas.
            </p>
          </div>
        </article>
      </div>

      {/* Direct Section CTA Button */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Link
          href="/cadastro"
          className={buttonClasses({
            variant: "primary",
            size: "lg",
            className: "gap-2 px-8 font-bold",
          })}
        >
          <span>Cadastre-se grátis agora</span>
          <Icon name="arrow" size={18} />
        </Link>
        <Link
          href="/planos"
          className={buttonClasses({
            variant: "outline",
            size: "lg",
          })}
        >
          Comparar planos
        </Link>
      </div>
    </div>
  );
}
