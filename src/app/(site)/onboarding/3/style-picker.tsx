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
      subtitle="Cores e tipografia prontas para destacar seu negócio. Você pode trocar quando quiser."
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
              className={`group relative flex min-h-[132px] cursor-pointer flex-col justify-between overflow-hidden rounded-lg border-2 p-3.5 text-left transition-[transform,box-shadow,border-color] duration-(--duration-fast) ease-out active:scale-[0.98] ${
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
                <div className="min-w-0">
                  <span
                    className={`${font.className} block truncate text-[17px] leading-tight font-bold`}
                    style={{ fontFamily: font.family }}
                  >
                    {style.label}
                  </span>
                  <span
                    className="block truncate text-[11.5px]"
                    style={{ color: style.palette.muted }}
                  >
                    {style.font}
                  </span>
                </div>

                {isSelected && (
                  <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-ink text-lime">
                    <Icon name="check" size={14} />
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <span
                  className="flex h-6 items-center justify-between rounded-sm px-2 text-[11px] font-semibold"
                  style={{
                    backgroundColor: style.palette.accent,
                    color: style.palette.onAccent,
                  }}
                >
                  <span>WhatsApp</span>
                  <span aria-hidden>↗</span>
                </span>
                <span
                  className="h-5 rounded-sm border"
                  style={{
                    backgroundColor: style.palette.surface,
                    borderColor: style.palette.line,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
