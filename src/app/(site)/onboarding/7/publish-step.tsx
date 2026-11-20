"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { Alert, Button } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";
import { publishPageAction, type StepActionState } from "../actions";

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      form="onboarding-publish-form"
      size="lg"
      className="w-full"
      loading={pending}
    >
      {pending ? "Publicando…" : "Publicar minha página"}
    </Button>
  );
}

const initialState: StepActionState = {};

export function PublishStep({
  slug,
  businessName,
  preview,
}: {
  slug: string;
  businessName: string;
  preview: ReactNode;
}) {
  const [state, formAction] = useActionState(publishPageAction, initialState);

  return (
    <OnboardingShell
      step={7}
      title="Tudo pronto para publicar"
      subtitle={
        <>
          Confira a prévia de{" "}
          <strong className="text-ink">{businessName}</strong> e publique em{" "}
          <strong className="text-ink">linkmural.com/{slug}</strong>.
        </>
      }
      backHref="/onboarding/6"
      slug={slug}
      footer={<PublishButton />}
    >
      {state.error && (
        <Alert tone="error" title="Não foi possível publicar">
          {state.error}
        </Alert>
      )}

      <form
        id="onboarding-publish-form"
        action={formAction}
        onSubmit={() =>
          trackGaEvent("pagina_publicada", { origem: "onboarding", slug })
        }
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-md">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-caption text-ink-muted">
          <span className="truncate font-medium text-ink">
            linkmural.com/{slug}
          </span>
          <span>Prévia</span>
        </div>
        <div
          aria-label="Prévia da página pública"
          className="pointer-events-none max-h-[420px] overflow-hidden select-none"
        >
          {preview}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-small text-ink-muted">
        <Link
          href="/onboarding/3"
          className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink"
        >
          Trocar estilo
        </Link>
        <Link
          href="/onboarding/4"
          className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink"
        >
          Editar dados
        </Link>
        <Link
          href="/onboarding/5"
          className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink"
        >
          Editar links
        </Link>
        <Link
          href="/onboarding/6"
          className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink"
        >
          Trocar modelo
        </Link>
      </div>
    </OnboardingShell>
  );
}
