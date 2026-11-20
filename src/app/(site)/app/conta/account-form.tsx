"use client";

import { useState, useTransition } from "react";
import { signOut } from "@/app/auth/actions";
import {
  deleteAccountAction,
  updateProfileNameAction,
} from "@/app/(site)/app/actions/account";
import { Alert, Button, Dialog, Input, useToast } from "@/components/ui";
import { finalizeSlug } from "@/lib/slug";

export function AccountForm({
  initialName,
  email,
  slug,
}: {
  initialName: string;
  email: string;
  slug: string;
}) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDeleting] = useTransition();

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSaving(async () => {
      const res = await updateProfileNameAction(name);
      if (res.ok) {
        toast("Salvo");
      } else {
        setError(res.error);
      }
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startDeleting(async () => {
      const res = await deleteAccountAction(confirmSlug);
      if (!res.ok) {
        setDeleteError(res.error);
      }
    });
  }

  const slugMatches = finalizeSlug(confirmSlug) === slug;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Minha conta
        </h1>
        <p className="text-small text-ink-muted">
          Dados de acesso e exclusão de conta (LGPD).
        </p>
      </div>

      <form
        onSubmit={handleSaveName}
        className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5"
      >
        {error && (
          <Alert tone="error" title="Não foi possível salvar">
            {error}
          </Alert>
        )}

        <Input
          label="Seu nome"
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como prefere ser chamado"
        />

        <Input
          label="E-mail de acesso"
          value={email}
          disabled
          help="Usado para entrar com Google ou link mágico."
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button type="submit" size="md" loading={saving}>
            {saving ? "Salvando…" : "Salvar nome"}
          </Button>
        </div>
      </form>

      <section className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-5">
        <div>
          <h2 className="text-small font-semibold">Encerrar sessão</h2>
          <p className="text-caption text-ink-muted">
            Sai da sua conta neste navegador.
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="md">
            Sair
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-negative/40 bg-negative-soft/30 p-5">
        <h2 className="text-small font-semibold text-negative">
          Excluir minha conta
        </h2>
        <p className="text-small text-ink-muted">
          Esta ação é permanente: apaga seu perfil, sua página{" "}
          <strong className="text-ink">linkmural.com/{slug}</strong>, seus
          links, métricas e imagens enviadas.
        </p>
        <Button
          type="button"
          variant="danger"
          size="md"
          className="self-start"
          onClick={() => {
            setConfirmSlug("");
            setDeleteError(null);
            setDeleteOpen(true);
          }}
        >
          Excluir conta
        </Button>
      </section>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Excluir conta permanentemente?"
        description={
          <>
            Para confirmar, digite o endereço da sua página:{" "}
            <strong className="text-ink">{slug}</strong>
          </>
        }
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={!slugMatches || deleting}
              loading={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Excluindo…" : "Excluir conta permanentemente"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {deleteError && (
            <Alert tone="error" title="Erro">
              {deleteError}
            </Alert>
          )}
          <Input
            label={`Digite "${slug}" para confirmar`}
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            placeholder={slug}
            autoCapitalize="none"
            autoComplete="off"
          />
        </div>
      </Dialog>
    </div>
  );
}
