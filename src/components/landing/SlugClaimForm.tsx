"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Chip, Icon, Input, Spinner } from "@/components/ui";
import {
  finalizeSlug,
  isValidSlug,
  normalizeSlugInput,
  type SlugStatus,
} from "@/lib/slug";
import { useLocalDraft } from "@/lib/use-local-draft";

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

export function SlugClaimForm({
  initialSlug = "",
  referralSlug,
  notice,
}: {
  initialSlug?: string;
  referralSlug?: string;
  notice?: { title: string; message: string };
}) {
  const router = useRouter();
  const [value, setValue] = useState(() => normalizeSlugInput(initialSlug));
  const [check, setCheck] = useState<CheckState>({ phase: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const restoreDraft = useCallback(
    (saved: string) => {
      if (!initialSlug && typeof saved === "string" && saved) {
        setValue(normalizeSlugInput(saved));
      }
    },
    [initialSlug],
  );
  const { clear: clearDraft } = useLocalDraft(
    "landing-slug",
    value,
    restoreDraft,
  );

  const finalized = finalizeSlug(value);
  const validFormat = finalized.length > 0 && isValidSlug(finalized);

  function updateValue(nextRaw: string) {
    setValue(normalizeSlugInput(nextRaw));
    setSubmitError(null);
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalized || !isValidSlug(finalized) || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/slug/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: finalized,
          ...(referralSlug ? { ref: referralSlug } : {}),
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        status?: SlugStatus;
        slug?: string;
        suggestions?: string[];
        error?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        if (data?.status && data.status !== "livre") {
          setCheck({
            phase: "done",
            slug: data.slug ?? finalized,
            status: data.status,
            suggestions: data.suggestions ?? [],
          });
        } else {
          setSubmitError(
            data?.error ?? "Não foi possível reservar esse endereço agora.",
          );
        }
        setSubmitting(false);
        return;
      }

      clearDraft();
      router.push("/onboarding/2");
    } catch {
      setSubmitError("Sem conexão no momento. Tente de novo em instantes.");
      setSubmitting(false);
    }
  }

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
    submitError ??
    (resolvedCheck.phase === "error"
      ? resolvedCheck.message
      : resolvedCheck.phase === "done" && resolvedCheck.status !== "livre"
        ? STATUS_ERROR[resolvedCheck.status]
        : undefined);

  const successText = isFree ? "Endereço livre! Reserve agora." : undefined;

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {notice && (
        <Alert tone="warning" title={notice.title}>
          {notice.message}
        </Alert>
      )}

      <Input
        label="Escolha seu endereço"
        name="slug"
        prefix="linkmural.com/"
        value={value}
        onChange={(e) => updateValue(e.target.value)}
        placeholder="seunegocio"
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
                onClick={() => updateValue(suggestion)}
              >
                <Icon name="plus" size={14} />
                {suggestion}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!isFree || submitting}
        loading={submitting}
      >
        {submitting ? "Reservando endereço…" : "Criar minha página"}
      </Button>
    </form>
  );
}
