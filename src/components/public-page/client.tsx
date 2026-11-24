"use client";

/*
 * The only client JavaScript on the public page (docs/HANDOFF.md §7.1):
 * visit beacon, live open status, share, QR, Pix copy and report.
 * No UI libraries; dialogs use the native <dialog>.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { trackGaEvent } from "@/lib/gtm";
import { openStatus, type OpenStatus } from "@/lib/hours";

function beacon(body: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
  if (!navigator.sendBeacon?.("/api/v", blob)) {
    void fetch("/api/v", { method: "POST", body: blob, keepalive: true }).catch(
      () => {},
    );
  }
}

/** Counts one visit per browser session; no cookies, no personal data. */
export function VisitBeacon({
  pageId,
  slug,
  template,
  style,
}: {
  pageId: string;
  slug: string;
  template: string;
  style: string;
}) {
  useEffect(() => {
    trackGaEvent("pagina_publica_visualizada", {
      slug,
      modelo: template,
      estilo: style,
    });

    const key = `lm:v:${pageId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count, at most once per page load.
    }
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    beacon({ pageId, event: "view", ref: document.referrer || null, utm });
  }, [pageId, slug, template, style]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>(
        'a[data-lm-link-kind], a[href^="/l/"]',
      );
      if (!anchor) return;
      trackGaEvent("link_publico_clicado", {
        slug,
        titulo_link:
          anchor.dataset.lmLinkTitle?.trim() ||
          anchor.textContent?.trim().slice(0, 60) ||
          "link",
        tipo_link: anchor.dataset.lmLinkKind || "link",
      });
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [slug]);

  return null;
}

/** Re-computes "Aberto agora" in the browser, since the HTML may be cached. */
export function StatusPill({
  hours,
  initial,
  className,
}: {
  hours: unknown;
  initial: OpenStatus;
  className?: string;
}) {
  const [status, setStatus] = useState(initial);
  useEffect(() => {
    const update = () => setStatus(openStatus(hours) ?? initial);
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [hours, initial]);

  return (
    <span className={className}>
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{
          background: status.open ? "#22C55E" : "currentColor",
          opacity: status.open ? 1 : 0.5,
        }}
      />
      {status.label}
    </span>
  );
}

function useDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  return {
    ref,
    open: () => ref.current?.showModal(),
    close: () => ref.current?.close(),
  };
}

function Sheet({
  dialogRef,
  title,
  onClose,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 text-(--ink) backdrop:bg-black/50 open:animate-rise sm:m-auto sm:max-w-[380px]"
    >
      <div className="flex flex-col gap-4 rounded-t-[24px] bg-(--surface) p-6 pb-[calc(24px+env(safe-area-inset-bottom))] sm:rounded-[28px] sm:pb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="m-0 text-[18px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-11 cursor-pointer place-items-center rounded-full bg-(--soft)"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/**
 * Copies text without the prompt dialog (blocked in some in-app browsers):
 * Clipboard API first, then the older execCommand path.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

/** Text the person can select and copy by hand when copying is blocked. */
function ManualCopy({ value, hint }: { value: string; hint: string }) {
  return (
    <span className="flex flex-col gap-1 text-left">
      <span className="text-[13px] opacity-80">{hint}</span>
      <code className="rounded-lg bg-(--soft) px-3 py-2 text-[14px] break-all text-(--ink) select-all">
        {value}
      </code>
    </span>
  );
}

/** Web Share API, falling back to copying the link. */
export function ShareButton({
  url,
  title,
  className,
  children,
}: {
  url: string;
  title: string;
  className?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const dialog = useDialog();
  return (
    <>
      <button
        type="button"
        aria-label={copied ? "Link copiado" : "Compartilhar página"}
        className={className}
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title, url });
              trackGaEvent("pagina_compartilhada", { metodo: "nativo" });
              return;
            } catch (error) {
              if ((error as Error).name === "AbortError") return;
            }
          }
          if (await copyText(url)) {
            trackGaEvent("pagina_compartilhada", { metodo: "copiar_link" });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            dialog.open();
          }
        }}
      >
        {copied ? (
          <Icon name="check" size={20} />
        ) : (
          (children ?? <Icon name="share" size={20} />)
        )}
      </button>
      <Sheet
        dialogRef={dialog.ref}
        title="Compartilhar página"
        onClose={dialog.close}
      >
        <ManualCopy value={url} hint="Toque e segure o link para copiar:" />
      </Sheet>
    </>
  );
}

/** Opens the page QR code, with downloads in PNG and SVG. */
export function QrButton({
  slug,
  pageId,
  pageUrl,
  className,
}: {
  slug: string;
  pageId: string;
  pageUrl: string;
  className?: string;
}) {
  const dialog = useDialog();
  return (
    <>
      <button
        type="button"
        aria-label="Mostrar QR code"
        className={className}
        onClick={() => {
          dialog.open();
          beacon({ pageId, event: "qr" });
          trackGaEvent("qrcode_visualizado", { slug });
        }}
      >
        <Icon name="qr" size={20} />
      </button>
      <Sheet
        dialogRef={dialog.ref}
        title="QR code da página"
        onClose={dialog.close}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- generated on demand */}
        <img
          src={`/${slug}/qr?format=svg`}
          alt={`QR code para ${pageUrl}`}
          width={240}
          height={240}
          loading="lazy"
          className="mx-auto size-60 rounded-2xl bg-white p-3"
        />
        <p className="m-0 text-center text-[14px] break-all opacity-80">
          {pageUrl}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/${slug}/qr?format=png&download=1`}
            onClick={() =>
              trackGaEvent("qrcode_baixado", {
                origem: "pagina_publica",
                formato: "png",
                slug,
              })
            }
            className="flex h-12 items-center justify-center rounded-full bg-(--accent) font-semibold text-(--on-accent) no-underline"
          >
            Baixar PNG
          </a>
          <a
            href={`/${slug}/qr?format=svg&download=1`}
            onClick={() =>
              trackGaEvent("qrcode_baixado", {
                origem: "pagina_publica",
                formato: "svg",
                slug,
              })
            }
            className="flex h-12 items-center justify-center rounded-full border border-(--line) font-semibold text-(--ink) no-underline"
          >
            Baixar SVG
          </a>
        </div>
      </Sheet>
    </>
  );
}

/** Copies a Pix key and counts it as a click on that link. */
export function PixCopyButton({
  pixKey,
  linkId,
  pageId,
  slug,
  className,
  children,
}: {
  pixKey: string;
  linkId: string;
  pageId: string;
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  return (
    <span className="flex flex-col gap-2">
      <button
        type="button"
        className={className}
        aria-live="polite"
        onClick={async () => {
          beacon({ pageId, event: "click", linkId });
          trackGaEvent("chave_pix_copiada", { slug });
          if (await copyText(pixKey)) {
            setState("copied");
            setTimeout(() => setState("idle"), 2500);
          } else {
            setState("manual");
          }
        }}
      >
        {children}
        <span className="shrink-0 rounded-full bg-(--card-icon-bg) px-3 py-1.5 text-[13px] font-semibold">
          {state === "copied" ? "Copiado!" : "Copiar"}
        </span>
      </button>
      {state === "manual" && (
        <ManualCopy
          value={pixKey}
          hint="Toque e segure a chave Pix para copiar:"
        />
      )}
    </span>
  );
}

/** Interactive photo carousel for the Studio plan Gallery block. */
export function GalleryCarousel({
  images,
  title,
  subtitle,
  pageId,
  linkId,
  slug,
  className = "",
}: {
  images: { url: string; caption?: string }[];
  title: string;
  subtitle?: string | null;
  pageId: string;
  linkId: string;
  slug: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const trackedRef = useRef(false);
  const safeImages = images.length > 0 ? images : [];
  const current = safeImages[index] ?? safeImages[0];

  function recordInteraction() {
    if (trackedRef.current) return;
    trackedRef.current = true;
    beacon({ pageId, event: "click", linkId });
    trackGaEvent("link_publico_clicado", {
      slug,
      titulo_link: title,
      tipo_link: "gallery",
    });
  }

  function goTo(nextIdx: number) {
    if (safeImages.length === 0) return;
    recordInteraction();
    setIndex((nextIdx + safeImages.length) % safeImages.length);
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-(length:--card-title) leading-tight font-semibold">
            {title}
          </p>
          {subtitle && (
            <p className="m-0 truncate text-(length:--card-sub) text-(--card-muted)">
              {subtitle}
            </p>
          )}
        </div>
        {safeImages.length > 1 && (
          <span className="shrink-0 rounded-full bg-(--soft) px-2.5 py-0.5 text-[11px] font-semibold">
            {index + 1}/{safeImages.length}
          </span>
        )}
      </div>

      {current ? (
        <div className="relative mx-3 mb-3 overflow-hidden rounded-[calc(var(--r)-4px)] bg-(--soft)">
          <div className="relative aspect-[16/10] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic gallery photos */}
            <img
              src={current.url}
              alt={current.caption || `${title} — foto ${index + 1}`}
              className="size-full object-cover transition-opacity duration-200"
            />
            {current.caption && (
              <div className=" inset-x-0 bottom-0 absolute bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3.5 pt-6 pb-2.5 text-[12px] font-medium text-white">
                {current.caption}
              </div>
            )}
          </div>

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={() => goTo(index - 1)}
                className="absolute top-1/2 left-2.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-black/55 text-white backdrop-blur-xs transition-transform active:scale-95"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Próxima foto"
                onClick={() => goTo(index + 1)}
                className="absolute top-1/2 right-2.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-black/55 text-white backdrop-blur-xs transition-transform active:scale-95"
              >
                ›
              </button>
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                {safeImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ver foto ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`h-1.5 cursor-pointer rounded-full border-0 transition-all ${
                      i === index ? "w-4 bg-white" : "w-1.5 bg-white/55"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mx-3 mb-3 grid h-36 place-items-center rounded-lg bg-(--soft) text-[13px] text-(--card-muted)">
          Galeria sem fotos
        </div>
      )}
    </div>
  );
}

/** Swipeable Widget Stack for public pages (Spec §6). */
export function PublicStackCarousel({
  slides,
  className = "",
}: {
  slides: {
    id: string;
    title: string;
    subtitle?: string;
    href: string;
  }[];
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const startXRef = useRef<number | null>(null);
  const count = slides.length;
  const active = slides[idx] ?? slides[0];
  if (!active) return null;

  function step(delta: number) {
    setIdx((cur) => (cur + delta + count) % count);
  }

  return (
    <div
      className={`relative select-none ${className}`}
      onPointerDown={(e) => {
        startXRef.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (startXRef.current === null) return;
        const dx = e.clientX - startXRef.current;
        startXRef.current = null;
        if (Math.abs(dx) > 36) {
          step(dx < 0 ? 1 : -1);
        }
      }}
    >
      <a
        href={active.href}
        rel="nofollow noopener"
        data-lm-link-title={active.title}
        data-lm-link-kind="stack"
        className="flex min-h-[104px] flex-col justify-between gap-3 rounded-(--r) border border-(--card-border) bg-(--card-bg) px-(--card-px) py-(--card-py) text-(--card-ink) no-underline transition-transform duration-200 hover:-translate-y-0.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-(--card-icon-bg) px-2.5 py-0.5 text-[11px] font-semibold text-(--card-ink)">
            Pilha · {idx + 1}/{count}
          </span>
          <Icon name="arrow" size={16} strokeWidth={2} className="opacity-70" />
        </div>

        <div className="flex flex-col gap-0.5 text-left">
          <span className="truncate text-(length:--card-title) leading-tight font-semibold">
            {active.title}
          </span>
          {active.subtitle && (
            <span className="truncate text-(length:--card-sub) text-(--card-muted)">
              {active.subtitle}
            </span>
          )}
        </div>
      </a>

      {count > 1 && (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Ver item ${i + 1} da pilha`}
              onClick={() => setIdx(i)}
              className={`h-1.5 cursor-pointer rounded-full border-0 transition-all ${
                i === idx ? "w-4 bg-(--ink)" : "w-1.5 bg-(--line)"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const REASONS = [
  { value: "golpe", label: "Golpe ou fraude" },
  { value: "spam", label: "Spam" },
  { value: "conteudo_improprio", label: "Conteúdo impróprio" },
  { value: "marca", label: "Uso indevido de marca ou nome" },
  { value: "outro", label: "Outro motivo" },
];

/** Discreet report link in the footer. */
export function ReportButton({
  pageId,
  className,
}: {
  pageId: string;
  className?: string;
}) {
  const dialog = useDialog();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  return (
    <>
      <button type="button" className={className} onClick={() => dialog.open()}>
        Denunciar
      </button>
      <Sheet
        dialogRef={dialog.ref}
        title="Denunciar esta página"
        onClose={dialog.close}
      >
        {state === "sent" ? (
          <p className="m-0 text-[15px]">
            Obrigado. Nossa equipe vai analisar a denúncia.
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setState("sending");
              const reason = String(form.get("reason") ?? "outro");
              const res = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pageId,
                  reason,
                  details: form.get("details") || undefined,
                }),
              }).catch(() => null);
              if (res?.ok) {
                trackGaEvent("denuncia_enviada", { motivo: reason });
              }
              setState(res?.ok ? "sent" : "error");
            }}
          >
            <fieldset className="m-0 flex flex-col border-0 p-0">
              <legend className="mb-1 text-[14px] opacity-80">
                O que há de errado?
              </legend>
              {REASONS.map((r, i) => (
                <label
                  key={r.value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    required
                    defaultChecked={i === 0}
                    className="size-5 accent-(--accent)"
                  />
                  {r.label}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1.5 text-[14px]">
              Detalhes (opcional)
              <textarea
                name="details"
                maxLength={1000}
                rows={3}
                className="rounded-xl border border-(--line) bg-(--bg) p-3 text-[15px] text-(--ink)"
              />
            </label>
            {state === "error" && (
              <p role="alert" className="m-0 text-[14px]">
                Não deu para enviar agora. Tente de novo em instantes.
              </p>
            )}
            <button
              type="submit"
              disabled={state === "sending"}
              className="h-12 cursor-pointer rounded-full bg-(--ink) font-semibold text-(--bg) disabled:opacity-60"
            >
              {state === "sending" ? "Enviando…" : "Enviar denúncia"}
            </button>
          </form>
        )}
      </Sheet>
    </>
  );
}
