"use client";

import { useState } from "react";
import { Button, Dialog, Icon, Input, useToast } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";
import {
  buildUrlWithUtm,
  hasUtmParams,
  normalizeUtmValue,
  parseUtmFromUrl,
  stripUtmFromUrl,
  supportsUtmUrl,
} from "@/lib/utm";

type UtmMode = "link" | "page";

const SOURCE_SUGGESTIONS: Record<UtmMode, { label: string; value: string }[]> =
  {
    link: [
      { label: "linkmural", value: "linkmural" },
      { label: "bio", value: "bio" },
      { label: "qrcode", value: "qrcode" },
      { label: "cartao_digital", value: "cartao_digital" },
    ],
    page: [
      { label: "Instagram", value: "instagram" },
      { label: "WhatsApp", value: "whatsapp" },
      { label: "TikTok", value: "tiktok" },
      { label: "YouTube", value: "youtube" },
      { label: "Google", value: "google" },
      { label: "QR Code balcão", value: "qrcode_balcao" },
      { label: "E-mail", value: "email" },
    ],
  };

const MEDIUM_SUGGESTIONS: Record<UtmMode, { label: string; value: string }[]> =
  {
    link: [
      { label: "bio", value: "bio" },
      { label: "social", value: "social" },
      { label: "card", value: "card" },
      { label: "cta", value: "cta" },
    ],
    page: [
      { label: "Bio do perfil", value: "bio" },
      { label: "Stories", value: "stories" },
      { label: "Reels / Vídeo", value: "reels" },
      { label: "Anúncio pago", value: "anuncio" },
      { label: "Impresso / QR", value: "impresso" },
      { label: "Mensagem", value: "mensagem" },
    ],
  };

function UtmBuilderForm({
  mode,
  initialUrl,
  defaultContent,
  onClose,
  onApply,
}: {
  mode: UtmMode;
  initialUrl: string;
  defaultContent?: string;
  onClose: () => void;
  onApply?: (generatedUrl: string) => void;
}) {
  const toast = useToast();
  const initialParsed = parseUtmFromUrl(initialUrl);
  const alreadyTagged = hasUtmParams(initialUrl);

  const [baseUrl, setBaseUrl] = useState(() =>
    stripUtmFromUrl(initialUrl).trim(),
  );
  const [source, setSource] = useState(() =>
    initialParsed.source || (mode === "link" ? "linkmural" : ""),
  );
  const [medium, setMedium] = useState(() =>
    initialParsed.medium || (mode === "link" ? "bio" : ""),
  );
  const [campaign, setCampaign] = useState(() => initialParsed.campaign);
  const [content, setContent] = useState(() => initialParsed.content);
  const [term, setTerm] = useState(() => initialParsed.term);
  const [copied, setCopied] = useState(false);

  const normalizedSource = normalizeUtmValue(source);
  const validUrl = supportsUtmUrl(baseUrl);
  const generatedUrl =
    validUrl && normalizedSource
      ? buildUrlWithUtm(baseUrl, {
          source,
          medium,
          campaign,
          content,
          term,
        })
      : null;

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!generatedUrl) return;

    trackGaEvent("utm_gerado", {
      modo: mode,
      utm_source: normalizedSource,
    });

    if (mode === "link") {
      onApply?.(generatedUrl);
      onClose();
      return;
    }

    await copyToClipboard(generatedUrl);
    setCopied(true);
    toast("Link com UTM copiado!");
    onClose();
  }

  const suggestedContent = defaultContent
    ? normalizeUtmValue(defaultContent)
    : "";

  return (
    <form
      id="utm-builder-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3.5"
      noValidate
    >
      {mode === "link" && (
        <Input
          label="URL de destino"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://seusite.com.br/oferta"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          error={
            baseUrl.trim() && !validUrl
              ? "Informe uma URL web válida (ex.: https://seusite.com.br). Chaves Pix, e-mail e telefone não usam UTM."
              : undefined
          }
          required
        />
      )}

      {/* utm_source */}
      <div className="flex flex-col gap-1.5">
        <Input
          label="Origem (utm_source) *"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={
            mode === "link" ? "Ex.: linkmural" : "Ex.: instagram, whatsapp"
          }
          maxLength={64}
          required
        />
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_SUGGESTIONS[mode].map((item) => {
            const active = normalizeUtmValue(source) === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSource(item.value)}
                className={`cursor-pointer rounded-pill border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* utm_medium */}
      <div className="flex flex-col gap-1.5">
        <Input
          label="Mídia (utm_medium)"
          value={medium}
          onChange={(e) => setMedium(e.target.value)}
          placeholder={mode === "link" ? "Ex.: bio, cta" : "Ex.: bio, stories"}
          maxLength={64}
        />
        <div className="flex flex-wrap gap-1.5">
          {MEDIUM_SUGGESTIONS[mode].map((item) => {
            const active = normalizeUtmValue(medium) === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setMedium(item.value)}
                className={`cursor-pointer rounded-pill border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* utm_campaign */}
      <Input
        label="Campanha (utm_campaign)"
        value={campaign}
        onChange={(e) => setCampaign(e.target.value)}
        placeholder="Ex.: promocao_verao, agendamento"
        maxLength={64}
      />

      {/* Optional utm_content & utm_term */}
      <details
        open={Boolean(content || term)}
        className="rounded-lg border border-line bg-paper px-3 py-2"
      >
        <summary className="cursor-pointer text-caption font-semibold text-ink-muted select-none hover:text-ink">
          Parâmetros opcionais (utm_content e utm_term)
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Input
              label="Conteúdo (utm_content)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ex.: botao_principal, card_destaque"
              maxLength={64}
            />
            {mode === "link" && suggestedContent && (
              <button
                type="button"
                onClick={() => setContent(suggestedContent)}
                className="self-start cursor-pointer text-[11px] font-medium text-ink underline underline-offset-2"
              >
                Usar título do card: “{suggestedContent}”
              </button>
            )}
          </div>
          <Input
            label="Termo (utm_term)"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex.: palavra_chave"
            maxLength={64}
          />
        </div>
      </details>

      {/* Live Preview */}
      <div className="flex flex-col gap-1 rounded-lg border border-line bg-paper p-3">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">
          Prévia do link gerado
        </span>
        {generatedUrl ? (
          <code className="text-caption font-medium break-all text-ink select-all">
            {generatedUrl}
          </code>
        ) : (
          <span className="text-caption text-ink-muted">
            {!validUrl
              ? "Digite uma URL web válida acima para visualizar o link com UTM."
              : "Preencha a origem (utm_source) para gerar o link."}
          </span>
        )}
      </div>

      {mode === "page" && (
        <p className="m-0 text-[11px] text-ink-muted">
          As visitas recebidas com este link aparecem em{" "}
          <strong>Métricas → Origem das visitas (UTM)</strong> aqui na
          plataforma e no Google Analytics.
        </p>
      )}

      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {mode === "link" && alreadyTagged && onApply && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onApply(stripUtmFromUrl(initialUrl));
              onClose();
            }}
            className="sm:mr-auto"
          >
            Remover UTMs
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!generatedUrl}>
          <Icon name={copied ? "check" : "link"} size={15} />
          {mode === "link" ? "Gerar link" : "Gerar e copiar link"}
        </Button>
      </div>
    </form>
  );
}

export function UtmBuilderModal({
  open,
  onClose,
  mode,
  initialUrl,
  defaultContent,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  mode: UtmMode;
  initialUrl: string;
  defaultContent?: string;
  onApply?: (generatedUrl: string) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        mode === "link"
          ? "Gerador de UTM para este link"
          : "Gerar link da sua página com UTM"
      }
      description={
        mode === "link"
          ? "Adicione parâmetros de rastreamento para identificar cliques vindos do Linkmural no Google Analytics."
          : "Crie um link rastreável do seu Linkmural para colar no Instagram, WhatsApp, anúncios ou QR Code."
      }
    >
      {open && (
        <UtmBuilderForm
          key={`${mode}:${initialUrl}:${defaultContent ?? ""}`}
          mode={mode}
          initialUrl={initialUrl}
          defaultContent={defaultContent}
          onClose={onClose}
          onApply={onApply}
        />
      )}
    </Dialog>
  );
}
