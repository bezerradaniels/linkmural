"use client";

/*
 * The only client JavaScript on the public page (docs/HANDOFF.md §7.1):
 * visit beacon, live open status, share, QR, Pix copy and report.
 * No UI libraries; dialogs use the native <dialog>.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
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
export function VisitBeacon({ pageId }: { pageId: string }) {
  useEffect(() => {
    const key = `lm:v:${pageId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked: still count, at most once per page load.
    }
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    beacon({ pageId, event: "view", ref: document.referrer || null, utm });
  }, [pageId]);
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
  return (
    <button
      type="button"
      aria-label={copied ? "Link copiado" : "Compartilhar página"}
      className={className}
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
            return;
          } catch (error) {
            if ((error as Error).name === "AbortError") return;
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copie o link da página:", url);
        }
      }}
    >
      {copied ? (
        <Icon name="check" size={20} />
      ) : (
        (children ?? <Icon name="share" size={20} />)
      )}
    </button>
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
            className="flex h-12 items-center justify-center rounded-full bg-(--accent) font-semibold text-(--on-accent) no-underline"
          >
            Baixar PNG
          </a>
          <a
            href={`/${slug}/qr?format=svg&download=1`}
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
  className,
  children,
}: {
  pixKey: string;
  linkId: string;
  pageId: string;
  className?: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(pixKey);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          window.prompt("Copie a chave Pix:", pixKey);
        }
        beacon({ pageId, event: "click", linkId });
      }}
    >
      {children}
      <span className="shrink-0 rounded-full bg-(--card-icon-bg) px-3 py-1.5 text-[13px] font-semibold">
        {copied ? "Copiado!" : "Copiar"}
      </span>
    </button>
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
              const res = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pageId,
                  reason: form.get("reason"),
                  details: form.get("details") || undefined,
                }),
              }).catch(() => null);
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
