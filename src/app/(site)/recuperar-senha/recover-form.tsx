"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  signInWithEmail,
  signInWithGoogle,
  type EmailState,
} from "@/app/(site)/entrar/actions";
import { Button, Icon, Input } from "@/components/ui";
import { trackGaEvent } from "@/lib/gtm";

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}

function SendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      className="w-full"
      disabled={disabled || pending}
      loading={pending}
    >
      {pending ? "Enviando link…" : "Enviar novo link de acesso"}
    </Button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      className="w-full"
      loading={pending}
    >
      {!pending && <GoogleMark />}
      {pending ? "Abrindo o Google…" : "Entrar direto com Google"}
    </Button>
  );
}

const initial: EmailState = { status: "idle" };

export function RecoverForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInWithEmail, initial);
  const [email, setEmail] = useState("");
  const [editing, setEditing] = useState(false);

  if (state.status === "sent" && !editing) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-paper p-6 text-center">
        <span className="grid size-14 place-items-center rounded-[18px] bg-ink text-lime">
          <Icon name="mail" size={26} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-title tracking-[-0.03em]">
            Link enviado!
          </h2>
          <p className="text-small text-ink-muted">
            Mandamos um novo link de entrada para{" "}
            <strong className="text-ink">{state.email}</strong>. Ele vale por 1
            hora e já libera seu painel direto.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Tentar outro e-mail
          </Button>
          <Link
            href="/entrar"
            className="text-small font-semibold text-ink underline underline-offset-2"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  const trimmedEmail = email.trim();
  const canSubmit = trimmedEmail.includes("@") && trimmedEmail.length >= 5;

  return (
    <div className="flex flex-col gap-5">
      <form
        action={(fd) => {
          trackGaEvent("login_iniciado", { metodo: "email" });
          setEditing(false);
          formAction(fd);
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        <input type="hidden" name="next" value={next} />

        <Input
          label="E-mail da conta"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="voce@seunegocio.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={state.status === "error" ? state.message : undefined}
        />

        <SendButton disabled={!canSubmit} />
      </form>

      <div
        className="flex items-center gap-3 text-caption text-ink-muted"
        aria-hidden
      >
        <span className="h-px flex-1 bg-line" />
        ou recupere em 1 clique
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        action={signInWithGoogle}
        onSubmit={() => trackGaEvent("login_iniciado", { metodo: "google" })}
      >
        <input type="hidden" name="next" value={next} />
        <GoogleButton />
      </form>
    </div>
  );
}
