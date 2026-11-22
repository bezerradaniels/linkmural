"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonClasses, Icon } from "@/components/ui";
import type { LinkSize } from "@/lib/styles";

const SIZE_LABELS: Record<LinkSize, string> = {
  "2x1": "Faixa",
  "1x1": "Bloco",
  "2x2": "Destaque",
};

const UNSPLASH_COVERS = [
  {
    label: "Degradê",
    cover:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    shape: "rounded-full",
  },
  {
    label: "Película",
    cover:
      "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80",
    shape: "rounded-2xl",
  },
  {
    label: "Limpa",
    cover:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    shape: "rounded-full",
  },
] as const;

const STUDIO_SLIDES = [
  { id: "gallery", tab: "Galeria" },
  { id: "youtube", tab: "YouTube" },
  { id: "service", tab: "Serviço" },
] as const;

const UTM_CHANNELS = [
  { label: "TikTok Bio", tag: "tiktok", pct: 68, clicks: "1.420 cliques" },
  { label: "Instagram Stories", tag: "instagram", pct: 24, clicks: "510 cliques" },
  { label: "WhatsApp VIP", tag: "whatsapp", pct: 8, clicks: "170 cliques" },
] as const;

export function FeatureBentoAnimations() {
  const [bentoSize, setBentoSize] = useState<LinkSize>("2x2");
  const [coverIdx, setCoverIdx] = useState(0);
  const [studioIdx, setStudioIdx] = useState(0);
  const [utmIdx, setUtmIdx] = useState(0);

  // Calm, unhurried auto-cycle so visitors can read without visual fatigue
  useEffect(() => {
    const sizes: LinkSize[] = ["2x2", "1x1", "2x1"];
    const t1 = setInterval(() => {
      setBentoSize((prev) => sizes[(sizes.indexOf(prev) + 1) % sizes.length]);
    }, 3800);
    const t2 = setInterval(() => {
      setCoverIdx((prev) => (prev + 1) % UNSPLASH_COVERS.length);
    }, 4200);
    const t3 = setInterval(() => {
      setStudioIdx((prev) => (prev + 1) % STUDIO_SLIDES.length);
    }, 4400);
    const t4 = setInterval(() => {
      setUtmIdx((prev) => (prev + 1) % UTM_CHANNELS.length);
    }, 3600);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
      clearInterval(t3);
      clearInterval(t4);
    };
  }, []);

  const activeCover = UNSPLASH_COVERS[coverIdx];
  const activeStudio = STUDIO_SLIDES[studioIdx];
  const activeUtm = UTM_CHANNELS[utmIdx];

  // Smooth, fixed-stage geometry for Bento morphing (zero layout shift, zero line breaks)
  const primaryStyle =
    bentoSize === "2x1"
      ? { top: 0, left: 0, width: "100%", height: "64px" }
      : bentoSize === "1x1"
        ? { top: 0, left: 0, width: "calc(50% - 5px)", height: "120px" }
        : { top: 0, left: 0, width: "100%", height: "124px" };

  const tileBStyle =
    bentoSize === "2x1"
      ? { top: "74px", left: 0, width: "calc(50% - 5px)", height: "54px" }
      : bentoSize === "1x1"
        ? { top: 0, left: "calc(50% + 5px)", width: "calc(50% - 5px)", height: "120px" }
        : { top: "134px", left: 0, width: "calc(50% - 5px)", height: "50px" };

  const tileCStyle =
    bentoSize === "2x1"
      ? { top: "74px", left: "calc(50% + 5px)", width: "calc(50% - 5px)", height: "54px" }
      : bentoSize === "1x1"
        ? { top: "130px", left: 0, width: "100%", height: "54px" }
        : { top: "134px", left: "calc(50% + 5px)", width: "calc(50% - 5px)", height: "50px" };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ================================================================= */}
        {/* CARD 1: BENTO DESIGN & DRAG-AND-DROP (Faixa, Bloco, Destaque)     */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-ink bg-[#0E1015] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-white/80">
                <Icon name="grip" size={14} className="shrink-0 text-lime" />
                Formato do card:
              </span>
              <div className="inline-flex shrink-0 rounded-pill border border-white/15 bg-black/40 p-0.5">
                {(["2x1", "1x1", "2x2"] as LinkSize[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setBentoSize(sz)}
                    className={`cursor-pointer rounded-pill px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap transition-colors duration-300 ${
                      bentoSize === sz
                        ? "bg-lime text-on-lime"
                        : "text-white/65 hover:text-white"
                    }`}
                  >
                    {SIZE_LABELS[sz]}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed-height smooth morphing stage */}
            <div className="relative h-[184px] w-full">
              {/* Primary Animated Card */}
              <div
                style={primaryStyle}
                className="absolute flex flex-col justify-between overflow-hidden rounded-[10px] border border-lime/50 bg-gradient-to-br from-lime/25 via-lime/10 to-white/[0.03] px-3.5 py-3 transition-[top,left,width,height] duration-500 ease-out"
              >
                <img
                  src="/images/creator-bento.jpg"
                  alt="Criadora TikTok"
                  className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out ${
                    bentoSize === "2x2" ? "opacity-55" : "opacity-0"
                  }`}
                />
                <div className="relative z-1 flex items-center justify-between gap-2">
                  <span className="inline-flex shrink-0 items-center rounded-pill bg-lime px-2.5 py-0.5 text-[10.5px] font-bold whitespace-nowrap text-on-lime">
                    {SIZE_LABELS[bentoSize]}
                  </span>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-black/50 text-white backdrop-blur-xs">
                    <Icon name="arrow" size={13} />
                  </span>
                </div>
                <div className="relative z-1 min-w-0">
                  <p className="truncate font-display text-small font-bold text-white">
                    Mídia Kit &amp; Publis
                  </p>
                  <p
                    className={`truncate text-[11px] text-white/80 transition-opacity duration-300 ${
                      bentoSize === "2x2" ? "opacity-100" : "opacity-0 h-0"
                    }`}
                  >
                    Arraste e mude o tamanho em 1 toque
                  </p>
                </div>
              </div>

              {/* Secondary Tile B */}
              <div
                style={tileBStyle}
                className="absolute flex items-center justify-between gap-2 overflow-hidden rounded-[10px] border border-white/10 bg-white/10 px-3.5 text-caption font-semibold backdrop-blur-xs transition-[top,left,width,height] duration-500 ease-out"
              >
                <span className="truncate whitespace-nowrap">TikTok · @luiza</span>
                <Icon name="arrow" size={13} className="shrink-0 text-lime" />
              </div>

              {/* Secondary Tile C */}
              <div
                style={tileCStyle}
                className="absolute flex items-center justify-between gap-2 overflow-hidden rounded-[10px] border border-white/10 bg-white/10 px-3.5 text-caption font-semibold backdrop-blur-xs transition-[top,left,width,height] duration-500 ease-out"
              >
                <span className="truncate whitespace-nowrap">Cupons &amp; Looks</span>
                <Icon name="arrow" size={13} className="shrink-0 text-lime" />
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider text-lime uppercase">
              Bento Design &amp; Arraste
            </span>
            <h3 className="mt-0.5 font-display text-title leading-snug">
              Cards em Faixa, Bloco ou Destaque
            </h3>
            <p className="mt-1 text-caption text-white/70">
              Dê mais espaço ao link que mais converte e reorganize tudo
              arrastando pelo celular.
            </p>
          </div>
        </article>

        {/* ================================================================= */}
        {/* CARD 2: LOGO & CAPA + UNSPLASH INTEGRADO                          */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-caption font-semibold whitespace-nowrap text-ink-muted">
                Estilo da capa:
              </span>
              <div className="inline-flex shrink-0 rounded-pill border border-line bg-paper p-0.5">
                {UNSPLASH_COVERS.map((c, idx) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCoverIdx(idx)}
                    className={`shrink-0 cursor-pointer rounded-pill px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-colors duration-300 ${
                      coverIdx === idx
                        ? "bg-ink text-paper"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
              {/* Smooth crossfading cover layers */}
              <div className="relative h-24 w-full overflow-hidden">
                {UNSPLASH_COVERS.map((c, idx) => (
                  <img
                    key={c.label}
                    src={c.cover}
                    alt={`Capa ${c.label}`}
                    className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out ${
                      coverIdx === idx ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent transition-opacity duration-500 ${
                    coverIdx === 0 ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div
                  className={`pointer-events-none absolute inset-0 bg-lime/30 mix-blend-multiply transition-opacity duration-500 ${
                    coverIdx === 1 ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-pill bg-black/65 px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white backdrop-blur-xs">
                  <Icon name="check" size={11} className="shrink-0 text-lime" />
                  Foto grátis · Unsplash
                </span>
              </div>

              <div className="flex flex-col items-center px-4 pb-3.5 text-center">
                <img
                  src="/images/creator-bento.jpg"
                  alt="Avatar da criadora"
                  className={`relative z-1 -mt-7 size-14 border-4 border-surface object-cover shadow-sm transition-[border-radius] duration-500 ease-out ${activeCover.shape}`}
                />
                <p className="mt-1 truncate font-display text-small font-bold text-ink">
                  Malu Carioca · @malurj
                </p>
                <p className="truncate text-[11px] text-ink-muted">
                  Criadora · Beleza, Moda &amp; Lifestyle
                </p>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider text-ink-muted uppercase">
              Logo, Capa &amp; Unsplash
            </span>
            <h3 className="mt-0.5 font-display text-title leading-snug text-ink">
              Cabeçalho personalizado + Unsplash em 1 clique
            </h3>
            <p className="mt-1 text-caption text-ink-muted">
              Envie sua foto com recorte ou escolha milhares de capas gratuitas
              sem sair do painel.
            </p>
          </div>
        </article>

        {/* ================================================================= */}
        {/* CARD 3: PLANO STUDIO (GALERIA CARROSSEL, YOUTUBE & SERVIÇOS)      */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-ink px-2.5 py-1 text-[10.5px] font-bold whitespace-nowrap text-lime">
                Studio · Blocos Ricos
              </span>
              <div className="inline-flex shrink-0 rounded-pill border border-line bg-paper p-0.5">
                {STUDIO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStudioIdx(idx)}
                    className={`shrink-0 cursor-pointer rounded-pill px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-colors duration-300 ${
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

            {/* Smooth crossfading Studio preview with fixed height (zero jump) */}
            <div className="relative h-[168px] overflow-hidden rounded-[10px] border border-line bg-paper">
              {/* Slide 1: Gallery */}
              <div
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  activeStudio.id === "gallery"
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 translate-y-1.5"
                }`}
              >
                <img
                  src="/images/creator-studio.jpg"
                  alt="Galeria Carrossel"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute top-2.5 right-2.5 rounded-pill bg-black/60 px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
                  Carrossel · 1/6 fotos
                </span>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 text-white">
                  <div className="min-w-0">
                    <p className="truncate text-small font-bold">
                      Bastidores &amp; Looks da Semana
                    </p>
                    <p className="truncate text-[11px] text-white/80">
                      Deslize para ver o portfólio
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <span className="h-1.5 w-4 rounded-full bg-lime" />
                    <span className="size-1.5 rounded-full bg-white/50" />
                    <span className="size-1.5 rounded-full bg-white/50" />
                  </div>
                </div>
              </div>

              {/* Slide 2: YouTube */}
              <div
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  activeStudio.id === "youtube"
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 translate-y-1.5"
                }`}
              >
                <img
                  src="/images/creator-bento.jpg"
                  alt="Vídeo do YouTube"
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 grid place-items-center bg-black/45">
                  <span className="grid size-12 place-items-center rounded-full bg-lime text-on-lime shadow-md">
                    ▶
                  </span>
                </div>
                <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-white backdrop-blur-xs">
                  <span className="truncate text-caption font-semibold">
                    Vlog: Um dia gravando em SP
                  </span>
                  <span className="shrink-0 text-[10px] font-bold whitespace-nowrap text-lime">
                    YouTube
                  </span>
                </div>
              </div>

              {/* Slide 3: Service */}
              <div
                className={`absolute inset-0 flex flex-col justify-between bg-surface p-4 transition-all duration-500 ease-out ${
                  activeStudio.id === "service"
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none opacity-0 translate-y-1.5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <img
                      src="/images/creator-studio.jpg"
                      alt="Criador"
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-small font-bold text-ink">
                        Combo Publi Reels + TikTok
                      </p>
                      <p className="truncate text-[11px] text-ink-muted">
                        Roteiro, gravação e entrega em 48h
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-lime-soft px-2.5 py-1 text-caption font-bold whitespace-nowrap text-ink">
                    R$ 650
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-pill bg-ink px-4 py-2.5 text-caption font-bold text-lime">
                  <span className="truncate">
                    Solicitar orçamento no WhatsApp
                  </span>
                  <Icon name="arrow" size={14} className="shrink-0" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider text-ink-muted uppercase">
              Galeria, YouTube &amp; Serviços
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
        {/* CARD 4: LINK RASTREÁVEL POR CANAL                                 */}
        {/* ================================================================= */}
        <article className="flex flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-ink bg-[#0E1015] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-3">
            {/* Glossy card preview */}
            <div className="flex flex-col gap-2 rounded-[10px] border border-white/20 bg-white/[0.08] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-md">
              <span className="text-[10px] font-bold tracking-wide text-lime uppercase">
                Link rastreável em 1 clique
              </span>
              <p className="font-mono text-[11px] leading-snug whitespace-nowrap text-white/90 sm:text-[12px]">
                linkmural.com/voce?utm_source=
                <strong className="ml-0.5 inline-block min-w-[74px] rounded bg-lime/20 px-1.5 py-0.5 text-center text-lime transition-colors duration-300">
                  {activeUtm.tag}
                </strong>
              </p>
            </div>

            {/* Live animated channel bars */}
            <div className="flex flex-col gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-center justify-between text-[11px] text-white/75">
                <span className="font-semibold">Origem das visitas</span>
                <span className="font-bold whitespace-nowrap text-lime">
                  {activeUtm.clicks}
                </span>
              </div>
              {UTM_CHANNELS.map((ch, idx) => (
                <div key={ch.tag} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`transition-colors duration-300 ${
                        idx === utmIdx
                          ? "font-bold text-white"
                          : "text-white/65"
                      }`}
                    >
                      {ch.label}
                    </span>
                    <span className="font-mono text-white/80">{ch.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-colors duration-500 ${
                        idx === utmIdx ? "bg-lime" : "bg-white/35"
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
              Link rastreável por canal
            </span>
            <h3 className="mt-0.5 font-display text-title leading-snug">
              Saiba de onde vêm os seus cliques
            </h3>
            <p className="mt-1 text-caption text-white/70">
              Crie um link para cada rede (TikTok, Instagram ou WhatsApp) e
              descubra qual canal traz mais clientes para focar no que realmente
              dá resultado.
            </p>
          </div>
        </article>
      </div>

      {/* Direct Section CTA Button */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 sm:flex sm:items-center sm:justify-center sm:gap-3">
        <Link
          href="/cadastro"
          className={buttonClasses({
            variant: "primary",
            size: "lg",
            className:
              "w-full gap-1.5 px-3 text-small font-bold sm:w-auto sm:gap-2 sm:px-8 sm:text-base",
          })}
        >
          <span>Cadastre-se grátis</span>
          <Icon name="arrow" size={16} className="shrink-0 sm:size-[18px]" />
        </Link>
        <Link
          href="/planos"
          className={buttonClasses({
            variant: "outline",
            size: "lg",
            className: "w-full px-3 text-small sm:w-auto sm:px-6.5 sm:text-base",
          })}
        >
          Comparar planos
        </Link>
      </div>
    </div>
  );
}
