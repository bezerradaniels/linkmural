"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { verifyEmailOtp, type VerifyOtpState } from "@/app/(site)/entrar/actions";
import { Button, Icon, Input } from "@/components/ui";

function VerifyCodeButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={disabled || pending}
      loading={pending}
    >
      {pending ? "Verificando…" : "Entrar com código"}
    </Button>
  );
}

const initialOtpState: VerifyOtpState = { status: "idle" };

export function EmailSentCard({
  email,
  next,
  description,
  onChangeEmail,
  bordered = false,
}: {
  email: string;
  next: string;
  description: string;
  onChangeEmail: () => void;
  bordered?: boolean;
}) {
  const [otpState, otpAction] = useActionState(verifyEmailOtp, initialOtpState);
  const [token, setToken] = useState("");
  const digits = token.replace(/\D/g, "").slice(0, 6);

  return (
    <div
      className={
        bordered
          ? "flex flex-col items-center gap-4 rounded-xl border border-line bg-paper p-6 text-center"
          : "flex flex-col items-center gap-4 text-center"
      }
    >
      <span className="grid size-14 place-items-center rounded-[18px] bg-ink text-lime">
        <Icon name="mail" size={26} />
      </span>

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-title tracking-[-0.03em]">
          Confira seu e-mail
        </h2>
        <p className="text-small text-ink-muted">
          Enviamos um link e um código para{" "}
          <strong className="text-ink">{email}</strong>. {description}
        </p>
      </div>

      <form
        action={otpAction}
        className="flex w-full flex-col gap-3 text-left"
        noValidate
      >
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />

        <Input
          label="Código de 6 dígitos"
          name="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={digits}
          onChange={(e) => setToken(e.target.value)}
          className="text-center font-mono text-lg tracking-[0.28em]"
          error={otpState.status === "error" ? otpState.message : undefined}
        />

        <VerifyCodeButton disabled={digits.length < 6} />
      </form>

      <Button variant="ghost" onClick={onChangeEmail}>
        Usar outro e-mail
      </Button>
    </div>
  );
}
