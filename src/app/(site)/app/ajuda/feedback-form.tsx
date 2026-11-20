"use client";

import { useState, useTransition } from "react";
import { submitFeedbackAction } from "@/app/(site)/app/actions/feedback";
import { Alert, Button, buttonClasses, Icon, useToast } from "@/components/ui";

export function FeedbackForm({
  supportWhatsapp,
}: {
  supportWhatsapp: string | null;
}) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSending(async () => {
      const res = await submitFeedbackAction(message);
      if (res.ok) {
        setMessage("");
        toast("Sugestão enviada! Obrigado.");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Ajuda e sugestões
        </h1>
        <p className="text-small text-ink-muted">
          Precisa de suporte ou tem uma ideia para melhorar o linkmural?
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-small font-semibold">Falar com o suporte</h2>
        <p className="text-small text-ink-muted">
          Respondemos pessoalmente todas as mensagens.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <a
            href="mailto:oi@linkmural.com?subject=Ajuda%20no%20linkmural"
            className={buttonClasses({ variant: "outline", size: "md" })}
          >
            <Icon name="mail" size={16} />
            oi@linkmural.com
          </a>
          {supportWhatsapp && (
            <a
              href={`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent("Olá! Preciso de ajuda no linkmural.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "primary", size: "md" })}
            >
              <Icon name="chat" size={16} />
              Chamar no WhatsApp
            </a>
          )}
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5"
      >
        <div>
          <h2 className="text-small font-semibold">Enviar sugestão</h2>
          <p className="text-caption text-ink-muted">
            Conte o que sentiu falta ou o que podemos melhorar.
          </p>
        </div>

        {error && (
          <Alert tone="error" title="Ops">
            {error}
          </Alert>
        )}

        <textarea
          rows={4}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva sua sugestão ou relato de problema…"
          aria-label="Sua sugestão"
          className="w-full rounded-md border border-line-strong bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus:border-ink focus:shadow-[0_0_0_3px_var(--lime)] focus:outline-none"
          required
        />

        <Button
          type="submit"
          size="md"
          className="self-start"
          loading={sending}
          disabled={message.trim().length < 3}
        >
          {sending ? "Enviando…" : "Enviar sugestão"}
        </Button>
      </form>
    </div>
  );
}
