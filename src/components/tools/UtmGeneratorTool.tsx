"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { UtmQrDialog } from "@/components/tools/UtmQrDialog";
import {
  Badge,
  Button,
  Icon,
  Input,
  ToastProvider,
  useToast,
} from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";
import {
  buildUrlWithUtm,
  hasUtmParams,
  normalizeUtmValue,
  parseUtmFromUrl,
  stripUtmFromUrl,
  supportsUtmUrl,
} from "@/lib/utm";
import {
  computeRowUrl,
  parseStoredRows,
  rowsToCsv,
  rowsToTsv,
  UTM_PRESETS,
  UTM_SHEET_STORAGE_KEY,
  type UtmSheetRow,
} from "@/lib/utm-sheet";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

function makeRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `utm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const UTM_SHEET_EVENT = "lm:utm-sheet-change";
const EMPTY_SNAPSHOT = "[]";

function subscribeUtmSheet(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(UTM_SHEET_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(UTM_SHEET_EVENT, handler);
  };
}

function getUtmSheetSnapshot(): string {
  try {
    return window.localStorage.getItem(UTM_SHEET_STORAGE_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function getUtmSheetServerSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

function persistRows(next: UtmSheetRow[]) {
  try {
    window.localStorage.setItem(UTM_SHEET_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(UTM_SHEET_EVENT));
  } catch {
    // Ignore quota / storage errors.
  }
}

function UtmGeneratorInner() {
  const toast = useToast();

  // Guided builder form state
  const [label, setLabel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");

  // Spreadsheet rows persisted in localStorage via useSyncExternalStore
  const rawRows = useSyncExternalStore(
    subscribeUtmSheet,
    getUtmSheetSnapshot,
    getUtmSheetServerSnapshot,
  );
  const rows = useMemo(() => parseStoredRows(rawRows), [rawRows]);

  function setRows(updater: UtmSheetRow[] | ((prev: UtmSheetRow[]) => UtmSheetRow[])) {
    const next = typeof updater === "function" ? updater(rows) : updater;
    persistRows(next);
  }

  // QR dialog target
  const [qrTarget, setQrTarget] = useState<{ url: string; label: string } | null>(
    null,
  );

  const urlHasExistingUtm = hasUtmParams(baseUrl);
  const validUrl = supportsUtmUrl(baseUrl);
  const normalizedSource = normalizeUtmValue(source);
  const generatedUrl =
    validUrl && normalizedSource
      ? buildUrlWithUtm(baseUrl, { source, medium, campaign, content, term })
      : null;

  function handleExtractExistingUtm() {
    if (!urlHasExistingUtm) return;
    const parsed = parseUtmFromUrl(baseUrl);
    const clean = stripUtmFromUrl(baseUrl);
    setBaseUrl(clean);
    if (parsed.source) setSource(parsed.source);
    if (parsed.medium) setMedium(parsed.medium);
    if (parsed.campaign) setCampaign(parsed.campaign);
    if (parsed.content) setContent(parsed.content);
    if (parsed.term) setTerm(parsed.term);
    toast("Parâmetros UTM extraídos da URL colada.");
  }

  function applyPreset(presetSource: string, presetMedium: string) {
    setSource(presetSource);
    setMedium(presetMedium);
  }

  function addRowToSheet(keepFields: boolean) {
    if (!generatedUrl) {
      toast("Informe uma URL válida e o campo Origem (utm_source).");
      return;
    }

    const cleanBase = stripUtmFromUrl(baseUrl).trim();
    const newRow: UtmSheetRow = {
      id: makeRowId(),
      label: label.trim(),
      baseUrl: cleanBase || baseUrl.trim(),
      source: normalizeUtmValue(source),
      medium: normalizeUtmValue(medium),
      campaign: normalizeUtmValue(campaign),
      content: normalizeUtmValue(content),
      term: normalizeUtmValue(term),
      createdAt: new Date().toISOString(),
    };

    setRows((prev) => [newRow, ...prev]);
    trackGaEvent("utm_gerado", {
      modo: "ferramenta_publica",
      utm_source: newRow.source,
    });

    if (keepFields) {
      setLabel("");
      setContent("");
      toast("Link adicionado à planilha. Ajuste o conteúdo para a próxima variação.");
    } else {
      setLabel("");
      setSource("");
      setMedium("");
      setCampaign("");
      setContent("");
      setTerm("");
      toast("Link adicionado à planilha.");
    }
  }

  function updateRowField(
    id: string,
    field: keyof Omit<UtmSheetRow, "id" | "createdAt">,
    value: string,
  ) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function duplicateRow(row: UtmSheetRow) {
    const copy: UtmSheetRow = {
      ...row,
      id: makeRowId(),
      label: row.label ? `${row.label} (cópia)` : "",
      createdAt: new Date().toISOString(),
    };
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      if (idx === -1) return [copy, ...prev];
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    toast("Linha duplicada na planilha.");
  }

  function removeRow(id: string) {
    const removed = rows.find((r) => r.id === id);
    if (!removed) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast({
      message: "Linha removida da planilha.",
      action: {
        label: "Desfazer",
        onClick: () => setRows((prev) => [removed, ...prev]),
      },
    });
  }

  function clearSheet() {
    if (rows.length === 0) return;
    const backup = rows;
    setRows([]);
    toast({
      message: "Planilha limpa.",
      action: {
        label: "Desfazer",
        onClick: () => setRows(backup),
      },
    });
  }

  async function handleCopyUrl(url: string) {
    if (!url) return;
    const ok = await copyText(url);
    toast(ok ? "URL com UTM copiada." : "Não foi possível copiar.");
  }

  async function handleCopyTsv() {
    if (rows.length === 0) return;
    const ok = await copyText(rowsToTsv(rows));
    trackGaEvent("utm_planilha_exportada", {
      formato: "tsv",
      quantidade: rows.length,
    });
    toast(
      ok
        ? "Tabela copiada! Cole direto no Google Sheets ou Excel."
        : "Não foi possível copiar a tabela.",
    );
  }

  function handleDownloadCsv() {
    if (rows.length === 0) return;
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `linkmural-utms-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackGaEvent("utm_planilha_exportada", {
      formato: "csv",
      quantidade: rows.length,
    });
    toast("Planilha CSV baixada.");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. GUIDED UTM FORM */}
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <div className="flex flex-col gap-5">
          {/* Quick channel presets dropdown */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="utm-channel-preset"
                className="text-small font-semibold text-ink"
              >
                1. Escolha um canal pronto (opcional)
              </label>
              <span className="text-caption text-ink-muted">
                Preenche origem e mídia automaticamente
              </span>
            </div>
            <select
              id="utm-channel-preset"
              value={
                UTM_PRESETS.find(
                  (p) =>
                    normalizeUtmValue(source) === p.source &&
                    normalizeUtmValue(medium) === p.medium,
                )?.id ?? ""
              }
              onChange={(e) => {
                const chosen = UTM_PRESETS.find((p) => p.id === e.target.value);
                if (chosen) applyPreset(chosen.source, chosen.medium);
              }}
              className="h-11 w-full min-w-0 cursor-pointer rounded-md border border-line-strong bg-surface px-3.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-(--duration-fast) ease-out hover:border-ink-muted focus:border-ink focus:shadow-[0_0_0_3px_var(--lime)] focus:outline-none sm:max-w-md"
            >
              <option value="">Personalizado (preencher manualmente)</option>
              {UTM_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} — {preset.source} / {preset.medium}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: URL + Label */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addRowToSheet(false);
            }}
            className="flex flex-col gap-5 border-t border-line pt-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr]">
              <div className="flex flex-col gap-2">
                <Input
                  label="2. URL de destino *"
                  placeholder="https://seusite.com.br/oferta"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  help="Cole o link da sua página, loja, WhatsApp ou linkmural.com/voce."
                  error={
                    baseUrl.trim() && !validUrl
                      ? "Informe um endereço web válido (ex.: https://seusite.com.br)."
                      : undefined
                  }
                />
                {urlHasExistingUtm && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3.5 py-2 text-caption">
                    <span className="text-ink">
                      Detectamos parâmetros UTM nessa URL. Deseja preencher os
                      campos automaticamente?
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleExtractExistingUtm}
                    >
                      Extrair UTMs da URL
                    </Button>
                  </div>
                )}
              </div>

              <Input
                label="Rótulo / Descrição (opcional)"
                placeholder="Ex.: Stories Promo 20% OFF"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                help="Ajuda a identificar este link na sua planilha."
              />
            </div>

            {/* Step 3: Guided UTM parameters */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Origem · utm_source *"
                placeholder="Ex.: instagram, google, whatsapp"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                help="De onde vem o clique (rede, plataforma ou parceiro)."
              />
              <Input
                label="Mídia · utm_medium"
                placeholder="Ex.: bio, stories, cpc, email"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                help="Formato ou canal do tráfego."
              />
              <Input
                label="Campanha · utm_campaign"
                placeholder="Ex.: black_friday, lancamento_maio"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                help="Nome da promoção, lançamento ou ação."
              />
              <Input
                label="Conteúdo · utm_content"
                placeholder="Ex.: botao_topo, video_01, criativo_a"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                help="Diferencia botões, anúncios ou variações."
              />
              <Input
                label="Termo · utm_term"
                placeholder="Ex.: link_na_bio_gratis"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                help="Opcional — usado para palavras-chave em busca paga."
              />
            </div>

            {/* Live preview + action buttons */}
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-caption font-semibold text-ink">
                  Prévia da URL rastreável (normalizada automaticamente)
                </span>
                {generatedUrl && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUrl(generatedUrl)}
                    >
                      <Icon name="copy" size={14} />
                      Copiar agora
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setQrTarget({
                          url: generatedUrl,
                          label: label.trim() || normalizedSource,
                        })
                      }
                    >
                      <Icon name="qr" size={14} />
                      QR Code
                    </Button>
                  </div>
                )}
              </div>

              <div className="min-h-11 rounded-xl border border-line bg-surface px-3.5 py-2.5 font-mono text-caption break-all text-ink">
                {generatedUrl ? (
                  generatedUrl
                ) : (
                  <span className="font-sans text-ink-muted">
                    Preencha a URL de destino e a Origem (utm_source) para ver o
                    link pronto aqui.
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!generatedUrl}
                >
                  <Icon name="plus" size={16} />
                  Adicionar à planilha
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={!generatedUrl}
                  onClick={() => addRowToSheet(true)}
                >
                  Adicionar e criar variação
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* 2. LIVE EDITABLE SPREADSHEET */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-title tracking-[-0.02em]">
              Sua planilha de UTMs
            </h2>
            <Badge variant="neutral" dot={rows.length > 0 ? "positive" : undefined}>
              {rows.length} {rows.length === 1 ? "link" : "links"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyTsv}
              disabled={rows.length === 0}
            >
              <Icon name="copy" size={14} />
              Copiar p/ Sheets / Excel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownloadCsv}
              disabled={rows.length === 0}
            >
              Baixar CSV
            </Button>
            {rows.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSheet}
              >
                Limpar tudo
              </Button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center">
            <Icon name="link" size={24} className="text-ink-muted" />
            <p className="font-display text-body font-semibold text-ink">
              Nenhum link na planilha ainda
            </p>
            <p className="max-w-md text-small text-ink-muted">
              Cada link que você adicionar acima aparece aqui como uma linha
              editável, salva automaticamente no seu navegador para exportar em
              CSV ou colar no Google Sheets.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[980px] border-collapse text-left text-caption">
              <thead>
                <tr className="border-b border-line bg-paper/70 text-ink-muted">
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Rótulo
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    URL Base
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    source
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    medium
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    campaign
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    content
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    term
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    URL Final
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right font-semibold"
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const finalUrl = computeRowUrl(row);
                  const cellClass =
                    "w-full min-w-[96px] rounded-md border border-transparent bg-transparent px-2 py-1.5 text-caption text-ink focus:border-ink focus:bg-paper focus:outline-none";

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-line last:border-b-0 hover:bg-paper/40"
                    >
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          aria-label="Rótulo da linha"
                          value={row.label}
                          placeholder="—"
                          onChange={(e) =>
                            updateRowField(row.id, "label", e.target.value)
                          }
                          className={cellClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          aria-label="URL base"
                          value={row.baseUrl}
                          onChange={(e) =>
                            updateRowField(row.id, "baseUrl", e.target.value)
                          }
                          className={`${cellClass} min-w-[160px] font-mono`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          aria-label="utm_source"
                          value={row.source}
                          onChange={(e) =>
                            updateRowField(row.id, "source", e.target.value)
                          }
                          className={cellClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          aria-label="utm_medium"
                          value={row.medium}
                          placeholder="—"
                          onChange={(e) =>
                            updateRowField(row.id, "medium", e.target.value)
                          }
                          className={cellClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          aria-label="utm_campaign"
                          value={row.campaign}
                          placeholder="—"
                          onChange={(e) =>
                            updateRowField(row.id, "campaign", e.target.value)
                          }
                          className={cellClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          aria-label="utm_content"
                          value={row.content}
                          placeholder="—"
                          onChange={(e) =>
                            updateRowField(row.id, "content", e.target.value)
                          }
                          className={cellClass}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          aria-label="utm_term"
                          value={row.term}
                          placeholder="—"
                          onChange={(e) =>
                            updateRowField(row.id, "term", e.target.value)
                          }
                          className={cellClass}
                        />
                      </td>
                      <td className="max-w-[210px] px-3 py-2">
                        {finalUrl ? (
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(finalUrl)}
                            title={finalUrl}
                            className="block w-full cursor-pointer truncate text-left font-mono text-[11px] text-ink underline decoration-line underline-offset-2 hover:decoration-ink"
                          >
                            {finalUrl}
                          </button>
                        ) : (
                          <span className="text-[11px] text-danger">
                            URL inválida
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(finalUrl)}
                            disabled={!finalUrl}
                            aria-label="Copiar URL final"
                            title="Copiar URL final"
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-ink disabled:opacity-40"
                          >
                            <Icon name="copy" size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setQrTarget({
                                url: finalUrl,
                                label: row.label || row.source || "utm",
                              })
                            }
                            disabled={!finalUrl}
                            aria-label="Gerar QR Code"
                            title="Gerar QR Code"
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-ink disabled:opacity-40"
                          >
                            <Icon name="qr" size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateRow(row)}
                            aria-label="Duplicar linha"
                            title="Duplicar linha"
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-paper text-ink hover:border-ink"
                          >
                            <Icon name="plus" size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            aria-label="Remover linha"
                            title="Remover linha"
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-paper text-ink-muted hover:border-danger hover:text-danger"
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-caption text-ink-muted">
          Seus links ficam salvos apenas no seu navegador (localStorage) — nada
          é enviado para nossos servidores.
        </p>
      </section>

      <UtmQrDialog
        open={Boolean(qrTarget)}
        url={qrTarget?.url ?? ""}
        label={qrTarget?.label ?? ""}
        onClose={() => setQrTarget(null)}
      />
    </div>
  );
}

export function UtmGeneratorTool() {
  return (
    <ToastProvider>
      <UtmGeneratorInner />
    </ToastProvider>
  );
}
