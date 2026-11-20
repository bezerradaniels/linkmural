"use client";

/* eslint-disable @next/next/no-img-element -- QR code served by /[slug]/qr */
import { useEffect, useState } from "react";
import Link from "next/link";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Button, buttonClasses, Icon } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";

function trackAction(
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

export function SuccessView({
  pageId,
  slug,
  businessName,
  pageUrl,
}: {
  pageId: string;
  slug: string;
  businessName: string;
  pageUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    trackGaEvent("onboarding_concluido", { slug });
  }, [slug]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = pageUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    trackAction(pageId, "link_copiado");
    trackGaEvent("link_pagina_copiado", { origem: "onboarding", slug });
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <OnboardingShell
      title="Sua página está no ar!"
      subtitle={
        <>
          <strong className="text-ink">{businessName}</strong> já pode ser
          acessada por qualquer pessoa.
        </>
      }
      slug={slug}
      footer={
        <Link
          href="/app"
          className={buttonClasses({
            variant: "primary",
            size: "lg",
            className: "w-full",
          })}
        >
          Ir para o painel
        </Link>
      }
    >
      {/* Pin drop celebration (respects prefers-reduced-motion via globals.css) */}
      <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface p-6 text-center shadow-sm">
        <div className="relative grid size-16 place-items-center rounded-[22px] bg-ink text-lime">
          <Icon name="pin" size={30} />
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 size-5 animate-pin-drop rounded-full border-[3px] border-surface bg-lime"
          />
        </div>

        <div className="w-full rounded-lg border border-line bg-paper px-4 py-3">
          <p className="truncate text-body font-semibold text-ink">{pageUrl}</p>
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handleCopy}
          >
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied ? "Link copiado!" : "Copiar link"}
          </Button>
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({
              variant: "outline",
              size: "lg",
              className: "flex-1",
            })}
          >
            <Icon name="external" size={18} />
            Abrir página
          </Link>
        </div>
      </div>

      {/* QR Code download */}
      <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center gap-4">
          <div className="size-24 shrink-0 overflow-hidden rounded-lg border border-line bg-white p-1.5">
            <img
              src={`/${slug}/qr?format=svg`}
              alt={`QR code de ${pageUrl}`}
              width={96}
              height={96}
              className="size-full object-contain"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="font-display text-body font-semibold">
              QR code da sua página
            </h2>
            <p className="text-small text-ink-muted">
              Imprima no balcão, embalagem ou cartão de visita.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`/${slug}/qr?format=png&download=1`}
            download={`linkmural-${slug}.png`}
            onClick={() => {
              trackAction(pageId, "qr_baixado", "png");
              trackGaEvent("qrcode_baixado", {
                origem: "onboarding",
                formato: "png",
                slug,
              });
            }}
            className={buttonClasses({ variant: "outline", size: "md" })}
          >
            <Icon name="qr" size={16} />
            Baixar PNG
          </a>
          <a
            href={`/${slug}/qr?format=svg&download=1`}
            download={`linkmural-${slug}.svg`}
            onClick={() => {
              trackAction(pageId, "qr_baixado", "svg");
              trackGaEvent("qrcode_baixado", {
                origem: "onboarding",
                formato: "svg",
                slug,
              });
            }}
            className={buttonClasses({ variant: "outline", size: "md" })}
          >
            <Icon name="qr" size={16} />
            Baixar SVG
          </a>
        </div>
      </section>

      {/* Instagram bio guide */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-body font-semibold">
          Como colocar na bio do Instagram
        </h2>
        <ol className="flex flex-col gap-2.5 text-small text-ink-muted">
          <li className="flex gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-lime-soft text-caption font-bold text-ink">
              1
            </span>
            <span>
              Toque em <strong className="text-ink">Copiar link</strong> acima e
              abra seu perfil no Instagram.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-lime-soft text-caption font-bold text-ink">
              2
            </span>
            <span>
              Vá em <strong className="text-ink">Editar perfil</strong> →{" "}
              <strong className="text-ink">Links</strong> →{" "}
              <strong className="text-ink">Adicionar link externo</strong>.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-lime-soft text-caption font-bold text-ink">
              3
            </span>
            <span>
              Cole o endereço e salve. Pronto: quem clicar vai direto para o seu
              mural!
            </span>
          </li>
        </ol>
      </section>
    </OnboardingShell>
  );
}
