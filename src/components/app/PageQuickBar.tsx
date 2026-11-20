"use client";

/* eslint-disable @next/next/no-img-element -- QR code served by /[slug]/qr */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publishDraftPageAction } from "@/app/(site)/app/actions/links";
import {
  Badge,
  Button,
  buttonClasses,
  Dialog,
  Icon,
  useToast,
} from "@/components/ui";

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

export function PageQuickBar({
  pageId,
  slug,
  pageUrl,
  published,
}: {
  pageId: string;
  slug: string;
  pageUrl: string;
  published: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState(false);
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
    toast("Link copiado");
    router.refresh();
  }

  function handlePublish() {
    startPublish(async () => {
      const res = await publishDraftPageAction();
      if (res.ok) {
        toast("Página publicada!");
        router.refresh();
      } else {
        toast(res.error);
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" dot={published ? "positive" : "warning"}>
              {published ? "Publicada" : "Rascunho"}
            </Badge>
            <span className="truncate text-caption text-ink-muted">
              Seu endereço oficial
            </span>
          </div>
          <p className="truncate font-display text-body font-semibold text-ink">
            linkmural.com/{slug}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!published && (
            <Button size="md" loading={publishing} onClick={handlePublish}>
              {publishing ? "Publicando…" : "Publicar"}
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={handleCopy}>
            <Icon name="copy" size={16} />
            Copiar link
          </Button>
          <Button variant="outline" size="md" onClick={() => setQrOpen(true)}>
            <Icon name="qr" size={16} />
            QR code
          </Button>
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "outline", size: "md" })}
          >
            <Icon name="external" size={16} />
            Ver página
          </Link>
        </div>
      </div>

      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="QR code da sua página"
        description="Imprima no balcão, embalagem ou cartão de visita."
        actions={
          <Button variant="ghost" onClick={() => setQrOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="size-48 overflow-hidden rounded-lg border border-line bg-white p-2">
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
                toast("QR code baixado");
              }}
              className={buttonClasses({ variant: "outline", size: "md" })}
            >
              Baixar SVG
            </a>
          </div>
        </div>
      </Dialog>
    </>
  );
}
