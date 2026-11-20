"use client";

import { useState, useTransition, type ReactNode } from "react";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, Button, Icon } from "@/components/ui";
import type { TemplateKey } from "@/lib/styles";
import { saveTemplateAction } from "../actions";

const TEMPLATE_META: {
  key: TemplateKey;
  label: string;
  description: string;
}[] = [
  {
    key: "balcao",
    label: "Balcão",
    description: "Lista vertical direta com ações rápidas no topo.",
  },
  {
    key: "mosaico",
    label: "Mosaico",
    description: "Grade visual em blocos para destacar cada link.",
  },
  {
    key: "cartao",
    label: "Cartão",
    description: "Estilo cartão de visita com ações grandes e lista limpa.",
  },
];

export function TemplatePicker({
  slug,
  initialTemplate,
  previews,
}: {
  slug: string;
  initialTemplate: TemplateKey;
  previews: Record<TemplateKey, ReactNode>;
}) {
  const [selected, setSelected] = useState<TemplateKey>(initialTemplate);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);
    const fd = new FormData();
    fd.set("template", selected);
    startTransition(async () => {
      try {
        await saveTemplateAction(fd);
      } catch (err) {
        if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError("Não conseguimos salvar o modelo agora. Tente de novo.");
      }
    });
  }

  return (
    <OnboardingShell
      step={6}
      title="Escolha o modelo da página"
      subtitle="Prévia com os seus dados reais. Você pode mudar de modelo a qualquer momento."
      backHref="/onboarding/5"
      slug={slug}
      footer={
        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={isPending}
          onClick={handleContinue}
        >
          {isPending ? "Salvando…" : "Continuar"}
        </Button>
      }
    >
      {error && (
        <Alert tone="error" title="Ops">
          {error}
        </Alert>
      )}

      <div
        role="radiogroup"
        aria-label="Modelos de página"
        className="flex flex-col gap-4"
      >
        {TEMPLATE_META.map((item) => {
          const isSelected = selected === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(item.key)}
              className={`flex cursor-pointer flex-col gap-3 rounded-xl border-2 bg-surface p-4 text-left transition-[border-color,box-shadow] duration-(--duration-fast) ease-out ${
                isSelected
                  ? "border-ink shadow-md ring-2 ring-lime ring-offset-2 ring-offset-paper"
                  : "border-line hover:border-ink-muted"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="block font-display text-body font-semibold text-ink">
                    {item.label}
                  </span>
                  <span className="block text-small text-ink-muted">
                    {item.description}
                  </span>
                </div>
                <span
                  aria-hidden
                  className={`grid size-6 shrink-0 place-items-center rounded-pill border-2 ${
                    isSelected
                      ? "border-ink bg-ink text-lime"
                      : "border-line-strong bg-transparent"
                  }`}
                >
                  {isSelected && <Icon name="check" size={14} />}
                </span>
              </div>

              <div
                aria-hidden
                className="pointer-events-none relative h-[220px] w-full overflow-hidden rounded-lg border border-line select-none"
              >
                <div className="w-[172.4%] origin-top-left scale-[0.58]">
                  {previews[item.key]}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
