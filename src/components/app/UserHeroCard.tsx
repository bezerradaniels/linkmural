"use client";

/* eslint-disable @next/next/no-img-element -- QR code served by /[slug]/qr */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { publishDraftPageAction } from "@/app/(site)/app/actions/links";
import { UtmBuilderModal } from "@/components/app/UtmBuilderModal";
import {
  Button,
  buttonClasses,
  Dialog,
  Icon,
  useToast,
} from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";
import { formatMetricNumber } from "@/lib/panel-helpers";

function trackEvent(
  pageId: string,
  event: "link_copiado" | "qr_baixado",
  format?: "png" | "svg",
) {
  fetch("/api/onboarding/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageId, event, format }),
    keepalive: true,
  }).catch(() => {});
}

export function UserHeroCard({
  pageId,
  slug,
  pageUrl,
  published,
  totalInteractions30,
  deltaLabel,
  deltaPositive,
}: {
  pageId: string;
  slug: string;
  pageUrl: string;
  published: boolean;
  totalInteractions30: number;
  deltaLabel: string | null;
  deltaPositive: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState(false);
  const [utmOpen, setUtmOpen] = useState(false);
  const [publishing, startPublish] = useTransition();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = pageUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    trackEvent(pageId, "link_copiado");
    trackGaEvent("link_pagina_copiado", { origem: "painel", slug });
    toast("Link copiado");
    router.refresh();
  }

  function handlePublish() {
    startPublish(async () => {
      const res = await publishDraftPageAction();
      if (res.ok) {
        trackGaEvent("pagina_publicada", { origem: "painel", slug });
        toast("Página publicada!");
        router.refresh();
      } else {
        toast(res.error);
      }
    });
  }

  return (
    <>
      <section className="animate-rise relative overflow-hidden rounded-[26px] bg-ink text-paper shadow-md">
        {/* Top Electric Lime Strip (inspired by reference card header) */}
        <div className="flex items-center justify-between gap-3 bg-lime px-5 py-3 text-on-lime">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`size-2 shrink-0 rounded-full ${
                published ? "bg-ink" : "bg-warning"
              }`}
            />
            <span className="truncate font-display text-small font-semibold tracking-[-0.01em]">
              linkmural.com/{slug}
            </span>
          </div>

          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-ink/10 px-2.5 py-1 text-[11px] font-semibold text-on-lime transition-colors hover:bg-ink/20"
          >
            <span>{published ? "No ar" : "Rascunho"}</span>
            <Icon name="external" size={12} />
          </Link>
        </div>

        {/* Main Dark Card Body with subtle concentric ring decoration */}
        <div className="relative flex flex-col gap-5 px-5 pt-5 pb-5 sm:px-6">
          {/* Decorative concentric rings (matching reference) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 180 180"
            className="pointer-events-none absolute -top-6 -right-6 size-44 opacity-[0.09]"
          >
            <circle
              cx="90"
              cy="90"
              r="76"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray="160 80"
            />
            <circle
              cx="90"
              cy="90"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray="90 60"
            />
            <circle
              cx="90"
              cy="90"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
            />
          </svg>

          {/* Hero Metric */}
          <div className="relative flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption font-medium text-paper/65">
                Acessos (30 dias)
              </p>
              <p className="mt-1 font-display text-[38px] leading-none font-semibold tracking-[-0.04em] text-paper sm:text-[44px]">
                {formatMetricNumber(totalInteractions30)}
              </p>
            </div>

            {deltaLabel && (
              <span
                className={`inline-flex items-center gap-1 rounded-pill px-3 py-1 text-caption font-semibold ${
                  deltaPositive
                    ? "bg-lime/15 text-lime"
                    : "bg-white/10 text-paper/75"
                }`}
              >
                <span aria-hidden="true">{deltaPositive ? "▲" : "▼"}</span>
                {deltaLabel}
              </span>
            )}
          </div>

          {/* Translucent Action Dock with primary "Editar" entry point */}
          <div className="relative grid grid-cols-4 gap-1.5 rounded-2xl bg-white/[0.07] p-2 sm:flex sm:items-center sm:justify-between sm:gap-2">
            <Link
              href={`/editor/${pageId}`}
              className="group flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl bg-lime/12 px-2 py-2 no-underline transition-all hover:bg-lime/20 active:scale-[0.97] sm:flex-1 sm:flex-row sm:gap-2.5"
            >
              <span className="inline-grid size-9 place-items-center rounded-full bg-lime text-on-lime shadow-sm transition-transform group-hover:scale-105">
                <Icon name="edit" size={16} />
              </span>
              <span className="text-caption font-bold text-lime">
                Editar
              </span>
            </Link>

            <button
              type="button"
              onClick={handleCopy}
              className="group flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition-all hover:bg-white/10 active:scale-[0.97] sm:flex-1 sm:flex-row sm:gap-2.5"
            >
              <span className="inline-grid size-9 place-items-center rounded-full bg-white/14 text-paper shadow-sm transition-transform group-hover:scale-105">
                <Icon name="copy" size={16} />
              </span>
              <span className="text-caption font-semibold text-paper">
                Copiar
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="group flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition-all hover:bg-white/10 active:scale-[0.97] sm:flex-1 sm:flex-row sm:gap-2.5"
            >
              <span className="inline-grid size-9 place-items-center rounded-full bg-white/12 text-paper transition-transform group-hover:scale-105">
                <Icon name="qr" size={16} />
              </span>
              <span className="text-caption font-medium text-paper/85">
                QR code
              </span>
            </button>

            {!published ? (
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="group flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition-all hover:bg-white/10 active:scale-[0.97] disabled:opacity-50 sm:flex-1 sm:flex-row sm:gap-2.5"
              >
                <span className="inline-grid size-9 place-items-center rounded-full bg-lime/20 text-lime transition-transform group-hover:scale-105">
                  <Icon name="check" size={16} />
                </span>
                <span className="text-caption font-semibold text-lime">
                  {publishing ? "Publicando…" : "Publicar"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUtmOpen(true)}
                className="group flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition-all hover:bg-white/10 active:scale-[0.97] sm:flex-1 sm:flex-row sm:gap-2.5"
              >
                <span className="inline-grid size-9 place-items-center rounded-full bg-white/12 text-paper transition-transform group-hover:scale-105">
                  <Icon name="link" size={16} />
                </span>
                <span className="text-caption font-medium text-paper/85">
                  Link UTM
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* QR Code Dialog */}
      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="QR code da página"
        description="Imprima no balcão, embalagem ou cartão."
        actions={
          <Button variant="ghost" onClick={() => setQrOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="size-48 overflow-hidden rounded-2xl border border-line bg-white p-2">
            <img
              src={`/${slug}/qr?format=svg`}
              alt={`QR code de ${pageUrl}`}
              width={192}
              height={192}
              className="size-full object-contain"
            />
          </div>
          <div className="grid w-full grid-cols-2 gap-2.5">
            <a
              href={`/${slug}/qr?format=png&download=1`}
              download={`linkmural-${slug}.png`}
              onClick={() => {
                trackEvent(pageId, "qr_baixado", "png");
                trackGaEvent("qrcode_baixado", {
                  origem: "painel",
                  formato: "png",
                  slug,
                });
                toast("QR code baixado");
              }}
              className={buttonClasses({ variant: "primary", size: "md" })}
            >
              Baixar PNG
            </a>
            <a
              href={`/${slug}/qr?format=svg&download=1`}
              download={`linkmural-${slug}.svg`}
              onClick={() => {
                trackEvent(pageId, "qr_baixado", "svg");
                trackGaEvent("qrcode_baixado", {
                  origem: "painel",
                  formato: "svg",
                  slug,
                });
                toast("QR code baixado");
              }}
              className={buttonClasses({ variant: "outline", size: "md" })}
            >
              Baixar SVG
            </a>
          </div>
        </div>
      </Dialog>

      <UtmBuilderModal
        open={utmOpen}
        onClose={() => setUtmOpen(false)}
        mode="page"
        initialUrl={pageUrl}
      />
    </>
  );
}
