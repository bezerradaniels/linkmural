"use client";

import { useState } from "react";
import { Alert, Button, Dialog, Icon, Input } from "@/components/ui";
import type { ButtonVariant } from "@/components/ui/Button";
import { trackGaEvent } from "@/lib/gtm";

export function WaitlistButton({
  plan,
  label = "Quero ser avisado",
  source = "planos",
  defaultEmail = "",
  variant = "primary",
}: {
  plan: "pro" | "business";
  label?: string;
  source?: string;
  defaultEmail?: string;
  variant?: ButtonVariant;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planName = plan === "pro" ? "Pro" : "Negócios";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan, source }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Não conseguimos salvar agora. Tente de novo.");
      } else {
        trackGaEvent("lista_espera_inscrita", { plano: plan, origem: source });
        setDone(true);
      }
    } catch {
      setError("Sem conexão no momento. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size="md"
        className="w-full"
        onClick={() => {
          trackGaEvent("lista_espera_aberta", { plano: plan, origem: source });
          setDone(false);
          setError(null);
          setOpen(true);
        }}
      >
        {label}
      </Button>

      <Dialog
        open={open}
        onClose={() => !loading && setOpen(false)}
        title={done ? "Você está na lista!" : `Lista de espera · ${planName}`}
        description={
          done
            ? `Avisaremos em ${email} assim que o plano ${planName} for liberado.`
            : `Deixe seu e-mail para ser avisado em primeira mão quando o plano ${planName} estiver disponível.`
        }
        actions={
          done ? (
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form={`waitlist-form-${plan}`}
                loading={loading}
              >
                {loading ? "Salvando…" : "Avise-me"}
              </Button>
            </>
          )
        }
      >
        {done ? (
          <div className="flex items-center gap-3 rounded-lg bg-positive-soft p-3.5 text-small text-positive">
            <Icon name="check" size={18} />
            <span>Cadastro confirmado na lista de espera.</span>
          </div>
        ) : (
          <form
            id={`waitlist-form-${plan}`}
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
            noValidate
          >
            {error && (
              <Alert tone="error" title="Confira seu e-mail">
                {error}
              </Alert>
            )}
            <Input
              label="Seu e-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@seunegocio.com.br"
              required
            />
          </form>
        )}
      </Dialog>
    </>
  );
}
