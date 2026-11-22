"use client";

import { useState, useTransition } from "react";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, Button, Icon } from "@/components/ui";
import { publicFont } from "@/lib/public-fonts";
import { STYLE_KEYS, STYLES, type StyleKey } from "@/lib/styles";
import { saveStyleAction } from "../actions";

export function StylePicker({
  slug,
  initialStyle,
}: {
  slug: string;
  initialStyle: StyleKey;
}) {
  const [selected, setSelected] = useState<StyleKey>(initialStyle);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(skip = false) {
    setError(null);
    const fd = new FormData();
    fd.set("style", selected);
    if (skip) fd.set("skip", "1");
    startTransition(async () => {
      try {
        await saveStyleAction(fd);
      } catch (err) {
        if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError("Não conseguimos salvar o estilo agora. Tente de novo.");
      }
    });
  }

  return (
    <OnboardingShell
      step={3}
      title="Escolha o estilo da sua página"
      subtitle="Paleta e tipografia prontas para destacar sua vitrine em Bento Grid. Você pode trocar quando quiser."
      slug={slug}
      footer={
        <>
          <Button
            type="button"
            size="lg"
            className="w-full"
            loading={isPending}
            onClick={() => submit(false)}
          >
            {isPending ? "Salvando…" : "Continuar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            disabled={isPending}
            onClick={() => submit(true)}
          >
            Pular (usar Classic)
          </Button>
        </>
      }
    >
      {error && (
        <Alert tone="error" title="Ops">
          {error}
        </Alert>
      )}

      <div
        role="radiogroup"
        aria-label="Estilos disponíveis"
        className="grid grid-cols-2 gap-3"
      >
        {STYLE_KEYS.map((key) => {
          const style = STYLES[key];
          const font = publicFont(style.font);
          const isSelected = selected === key;

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(key)}
              className={`group relative flex min-h-[156px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border-2 p-3.5 text-left transition-[transform,box-shadow,border-color] duration-(--duration-fast) ease-out active:scale-[0.98] ${
                isSelected
                  ? "border-ink shadow-md ring-2 ring-lime ring-offset-2 ring-offset-paper"
                  : "border-line hover:border-ink-muted"
              }`}
              style={{
                backgroundColor: style.palette.bg,
                color: style.palette.ink,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-md text-[11px] font-bold"
                    style={{
                      backgroundColor: style.palette.accent,
                      color: style.palette.onAccent,
                    }}
                  >
                    {style.label.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <span
                      className={`${font.className} block truncate text-[16px] leading-tight font-bold`}
                      style={{ fontFamily: font.family }}
                    >
                      {style.label}
                    </span>
                    <span
                      className="block truncate text-[11px]"
                      style={{ color: style.palette.muted }}
                    >
                      {style.font}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-ink text-lime">
                    <Icon name="check" size={14} />
                  </span>
                )}
              </div>

              {/* Mini Bento Grid preview (2x1 bar + two 1x1 squares) */}
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <span
                  className="col-span-2 flex h-6 items-center justify-between rounded-[7px] px-2 text-[10.5px] font-semibold"
                  style={{
                    backgroundColor: style.palette.accent,
                    color: style.palette.onAccent,
                  }}
                >
                  <span>WhatsApp</span>
                  <span aria-hidden>↗</span>
                </span>
                <span
                  className="flex h-8 flex-col justify-between rounded-[7px] border px-2 py-1 text-[9.5px] font-semibold"
                  style={{
                    backgroundColor: style.palette.surface,
                    borderColor: style.palette.line,
                    color: style.palette.ink,
                  }}
                >
                  <span style={{ color: style.palette.muted }}>1×1</span>
                  <span className="truncate">TikTok</span>
                </span>
                <span
                  className="flex h-8 flex-col justify-between rounded-[7px] border px-2 py-1 text-[9.5px] font-semibold"
                  style={{
                    backgroundColor: style.palette.surface,
                    borderColor: style.palette.line,
                    color: style.palette.ink,
                  }}
                >
                  <span style={{ color: style.palette.muted }}>1×1</span>
                  <span className="truncate">Vitrine</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
