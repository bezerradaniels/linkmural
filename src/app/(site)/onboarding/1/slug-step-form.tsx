"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, Button, Chip, Icon, Input, Spinner } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";
import {
  finalizeSlug,
  isValidSlug,
  normalizeSlugInput,
  type SlugStatus,
} from "@/lib/slug";
import { createPageWithSlugAction, type StepActionState } from "../actions";

type CheckState =
  | { phase: "idle" }
  | { phase: "checking"; slug: string }
  | {
      phase: "done";
      slug: string;
      status: SlugStatus;
      suggestions: string[];
    }
  | { phase: "error"; message: string };

const STATUS_ERROR: Record<Exclude<SlugStatus, "livre">, string> = {
  invalido:
    "Use de 3 a 30 letras minúsculas, números ou hífen (sem hífen duplo ou nas pontas).",
  reservado: "Esse endereço é reservado. Use o nome do seu negócio.",
  ocupado: "Esse endereço já está em uso. Escolha outro ou use uma sugestão.",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      form="onboarding-slug-form"
      size="lg"
      className="w-full"
      disabled={disabled || pending}
      loading={pending}
    >
      {pending ? "Criando seu endereço…" : "Continuar"}
    </Button>
  );
}

const initialState: StepActionState = {};

export function SlugStepForm({ initialSlug = "" }: { initialSlug?: string }) {
  const [state, formAction] = useActionState(
    createPageWithSlugAction,
    initialState,
  );
  const [value, setValue] = useState(() => normalizeSlugInput(initialSlug));
  const [check, setCheck] = useState<CheckState>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const finalized = finalizeSlug(value);
  const validFormat = finalized.length > 0 && isValidSlug(finalized);

  useEffect(() => {
    abortRef.current?.abort();
    if (!validFormat) return;

    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setCheck({ phase: "checking", slug: finalized });
      try {
        const res = await fetch(
          `/api/slug/check?slug=${encodeURIComponent(finalized)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("check_failed");
        const data = (await res.json()) as {
          status: SlugStatus;
          slug: string;
          suggestions: string[];
        };
        setCheck({
          phase: "done",
          slug: data.slug,
          status: data.status,
          suggestions: data.suggestions ?? [],
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setCheck({
          phase: "error",
          message: "Não deu para verificar agora. Tente de novo em instantes.",
        });
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [finalized, validFormat]);

  const resolvedCheck: CheckState = !finalized
    ? { phase: "idle" }
    : !validFormat
      ? { phase: "done", slug: finalized, status: "invalido", suggestions: [] }
      : check.phase === "done" && check.slug === finalized
        ? check
        : check.phase === "error"
          ? check
          : { phase: "checking", slug: finalized };

  const isFree =
    resolvedCheck.phase === "done" && resolvedCheck.status === "livre";

  const errorText =
    state.error ??
    (resolvedCheck.phase === "error"
      ? resolvedCheck.message
      : resolvedCheck.phase === "done" && resolvedCheck.status !== "livre"
        ? STATUS_ERROR[resolvedCheck.status]
        : undefined);

  const successText = isFree ? "Endereço livre! Pode continuar." : undefined;

  const helpText =
    resolvedCheck.phase === "checking" ? (
      <span className="inline-flex items-center gap-1.5">
        <Spinner className="size-3.5" />
        Verificando disponibilidade…
      </span>
    ) : !finalized ? (
      "Use letras minúsculas, números ou hífen (3 a 30 caracteres)."
    ) : undefined;

  const suggestions =
    resolvedCheck.phase === "done" && resolvedCheck.status !== "livre"
      ? resolvedCheck.suggestions
      : [];

  return (
    <OnboardingShell
      step={2}
      title="Escolha seu endereço"
      subtitle="Esse será o link oficial da sua bio em Bento Grid. Você pode trocar depois."
      footer={<SubmitButton disabled={!isFree} />}
    >
      <form
        id="onboarding-slug-form"
        action={(fd) => {
          trackGaEvent("endereco_reservado", {
            origem: "onboarding",
            com_indicacao: "nao",
          });
          formAction(fd);
        }}
        className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6"
        noValidate
      >
        {state.error && (
          <Alert tone="warning" title="Atenção">
            {state.error}
          </Alert>
        )}

        <Input
          label="Seu endereço"
          name="slug"
          prefix="linkmural.com/"
          value={value}
          onChange={(e) => setValue(normalizeSlugInput(e.target.value))}
          placeholder="seunome"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          maxLength={30}
          error={errorText}
          success={successText}
          help={helpText}
        />

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-caption font-medium text-ink-muted">
              Sugestões livres:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  className="min-h-11"
                  onClick={() => setValue(suggestion)}
                >
                  <Icon name="plus" size={14} />
                  {suggestion}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </form>
    </OnboardingShell>
  );
}
