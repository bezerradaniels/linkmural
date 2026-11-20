"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { saveAppearanceAction } from "@/app/(site)/app/actions/appearance";
import { PhonePreview } from "@/components/app/PhonePreview";
import {
  Alert,
  Badge,
  Button,
  DraftNotice,
  Icon,
  Segmented,
  Switch,
  useToast,
} from "@/components/ui";
import { planInfo, type Plan } from "@/lib/plans";
import { publicFont } from "@/lib/public-fonts";
import type { PublicPage } from "@/lib/public-page";
import { useLocalDraft } from "@/lib/use-local-draft";
import {
  CARD_FILLS,
  CARD_SIZES,
  FONTS,
  RADIUS,
  STYLE_KEYS,
  STYLES,
  TEMPLATES,
  type CardFill,
  type CardSize,
  type FontName,
  type StyleKey,
  type TemplateKey,
} from "@/lib/styles";
import type { Theme } from "@/lib/theme";

export function AppearanceForm({
  initialTemplate,
  initialStyle,
  initialTheme,
  initialShowBranding,
  previewBase,
  pageUrl,
  plan,
}: {
  initialTemplate: TemplateKey;
  initialStyle: StyleKey;
  initialTheme: Theme;
  initialShowBranding: boolean;
  previewBase: PublicPage;
  pageUrl: string;
  plan: Plan;
}) {
  const toast = useToast();
  const limits = planInfo(plan);
  const [template, setTemplate] = useState<TemplateKey>(initialTemplate);
  const [style, setStyle] = useState<StyleKey>(initialStyle);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [showBranding, setShowBranding] =
    useState<boolean>(initialShowBranding);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const appearanceDraft = useMemo(
    () => ({ template, style, theme, showBranding }),
    [template, style, theme, showBranding],
  );
  const restoreDraft = useCallback((d: typeof appearanceDraft) => {
    if (d.template) setTemplate(d.template);
    if (d.style) setStyle(d.style);
    if (d.theme && typeof d.theme === "object") setTheme(d.theme);
    if (typeof d.showBranding === "boolean") setShowBranding(d.showBranding);
  }, []);
  const {
    clear: clearDraft,
    discard: discardDraft,
    restored: draftRestored,
  } = useLocalDraft(
    `panel-appearance:${previewBase.id}`,
    appearanceDraft,
    restoreDraft,
  );

  function handleSave() {
    setError(null);
    startSaving(async () => {
      const res = await saveAppearanceAction({
        template,
        style,
        theme,
        show_branding: showBranding,
      });
      if (res.ok) {
        clearDraft();
        toast("Salvo");
      } else {
        setError(res.error);
      }
    });
  }

  const livePreview: PublicPage = {
    ...previewBase,
    template,
    style,
    theme,
    show_branding: limits.removeBranding ? showBranding : true,
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-display-md tracking-[-0.03em]">
              Aparência
            </h1>
            <p className="text-small text-ink-muted">
              Escolha o modelo, o estilo e a cor dos ícones da sua página.
            </p>
          </div>
          <Button size="md" loading={saving} onClick={handleSave}>
            {saving ? "Salvando…" : "Salvar aparência"}
          </Button>
        </div>

        {draftRestored && <DraftNotice onDiscard={discardDraft} />}

        {error && (
          <Alert tone="error" title="Não foi possível salvar">
            {error}
          </Alert>
        )}

        {/* Template */}
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-small font-semibold">Modelo</h2>
          <Segmented<TemplateKey>
            label="Modelo da página"
            value={template}
            onChange={setTemplate}
            options={(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => ({
              value: key,
              label: TEMPLATES[key],
            }))}
          />
        </section>

        {/* 8 Styles */}
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-small font-semibold">Estilo</h2>
          <div
            role="radiogroup"
            aria-label="Estilos disponíveis"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {STYLE_KEYS.map((key) => {
              const def = STYLES[key];
              const font = publicFont(def.font);
              const selected = style === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setStyle(key)}
                  className={`flex min-h-[108px] cursor-pointer flex-col justify-between rounded-lg border-2 p-3 text-left transition-[transform,border-color] active:scale-[0.98] ${
                    selected
                      ? "border-ink ring-2 ring-lime ring-offset-2 ring-offset-surface"
                      : "border-line hover:border-ink-muted"
                  }`}
                  style={{
                    backgroundColor: def.palette.bg,
                    color: def.palette.ink,
                  }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`${font.className} truncate text-[15px] font-bold`}
                      style={{ fontFamily: font.family }}
                    >
                      {def.label}
                    </span>
                    {selected && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-pill bg-ink text-lime">
                        <Icon name="check" size={12} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className="h-4 rounded-sm"
                      style={{ backgroundColor: def.palette.accent }}
                    />
                    <span
                      className="h-3 rounded-sm border"
                      style={{
                        backgroundColor: def.palette.surface,
                        borderColor: def.palette.line,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Icon Color (all plans) */}
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-small font-semibold">Cor dos ícones</h2>
          <Segmented<"brand" | "style">
            label="Cor dos ícones"
            value={theme.iconColor ?? "brand"}
            onChange={(iconColor) =>
              setTheme((prev) => ({ ...prev, iconColor }))
            }
            options={[
              { value: "brand", label: "Cor oficial" },
              { value: "style", label: "Cor do estilo" },
            ]}
          />
        </section>

        {/* Pro+ Customization */}
        <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-small font-semibold">
                Personalização avançada
              </h2>
              <p className="text-caption text-ink-muted">
                Fonte, cores próprias, tamanho, preenchimento, cantos e rodapé.
              </p>
            </div>
            {!limits.customTheme && (
              <Link
                href="/app/plano"
                className="inline-flex min-h-11 items-center gap-1.5"
              >
                <Badge variant="pro">
                  <Icon name="lock" size={12} />
                  Pro
                </Badge>
              </Link>
            )}
          </div>

          {!limits.customTheme ? (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line-strong bg-paper p-4">
              <div className="grid grid-cols-2 gap-2.5 opacity-60 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                  <Icon name="lock" size={14} /> Fonte própria
                </div>
                <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                  <Icon name="lock" size={14} /> Paleta de cores
                </div>
                <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                  <Icon name="lock" size={14} /> Tamanho dos cards
                </div>
                <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                  <Icon name="lock" size={14} /> Preenchimento
                </div>
                <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                  <Icon name="lock" size={14} /> Cantos (0–32 px)
                </div>
                <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-caption">
                  <Icon name="lock" size={14} /> Remover marca
                </div>
              </div>
              <Link
                href="/app/plano"
                className="self-start text-small font-semibold underline underline-offset-2"
              >
                Conhecer o plano Pro →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="custom-font"
                  className="text-small font-semibold"
                >
                  Fonte
                </label>
                <select
                  id="custom-font"
                  value={theme.font ?? STYLES[style].font}
                  onChange={(e) =>
                    setTheme((p) => ({
                      ...p,
                      font: e.target.value as FontName,
                    }))
                  }
                  className="h-11 rounded-md border border-line-strong bg-surface px-3 text-small"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-small font-semibold">Paleta</span>
                <Segmented<"style" | "custom">
                  label="Paleta"
                  value={theme.palette ?? "style"}
                  onChange={(palette) =>
                    setTheme((p) => ({
                      ...p,
                      palette,
                      background: p.background ?? STYLES[style].palette.bg,
                      accent: p.accent ?? STYLES[style].palette.accent,
                    }))
                  }
                  options={[
                    { value: "style", label: "Do estilo" },
                    { value: "custom", label: "Personalizada" },
                  ]}
                />
                {theme.palette === "custom" && (
                  <div className="mt-1 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-small">
                      <span>Fundo</span>
                      <input
                        type="color"
                        value={theme.background ?? STYLES[style].palette.bg}
                        onChange={(e) =>
                          setTheme((p) => ({
                            ...p,
                            background: e.target.value,
                          }))
                        }
                        className="size-10 cursor-pointer rounded border border-line"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-small">
                      <span>Acento</span>
                      <input
                        type="color"
                        value={theme.accent ?? STYLES[style].palette.accent}
                        onChange={(e) =>
                          setTheme((p) => ({ ...p, accent: e.target.value }))
                        }
                        className="size-10 cursor-pointer rounded border border-line"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-small font-semibold">
                  Tamanho dos cards
                </span>
                <Segmented<CardSize>
                  label="Tamanho dos cards"
                  value={theme.cardSize ?? "regular"}
                  onChange={(cardSize) => setTheme((p) => ({ ...p, cardSize }))}
                  options={(Object.keys(CARD_SIZES) as CardSize[]).map((k) => ({
                    value: k,
                    label: CARD_SIZES[k].label,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-small font-semibold">
                  Preenchimento dos cards
                </span>
                <Segmented<CardFill>
                  label="Preenchimento dos cards"
                  value={theme.cardFill ?? "solid"}
                  onChange={(cardFill) => setTheme((p) => ({ ...p, cardFill }))}
                  options={(Object.keys(CARD_FILLS) as CardFill[]).map((k) => ({
                    value: k,
                    label: CARD_FILLS[k],
                  }))}
                />
              </div>

              <label className="flex flex-col gap-1.5 text-small font-semibold">
                <span>Cantos: {theme.radius ?? RADIUS.default}px</span>
                <input
                  type="range"
                  min={RADIUS.min}
                  max={RADIUS.max}
                  step={RADIUS.step}
                  value={theme.radius ?? RADIUS.default}
                  onChange={(e) =>
                    setTheme((p) => ({ ...p, radius: Number(e.target.value) }))
                  }
                />
              </label>

              <Switch
                label="Mostrar “Feito com linkmural” no rodapé"
                checked={showBranding}
                onChange={(e) => setShowBranding(e.target.checked)}
              />
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            loading={saving}
            onClick={handleSave}
          >
            {saving ? "Salvando…" : "Salvar aparência"}
          </Button>
        </div>
      </div>

      <PhonePreview page={livePreview} pageUrl={pageUrl} />
    </div>
  );
}
