"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  reactivateUserAction,
  suspendUserAction,
} from "@/app/(site)/admin/actions";
import { Badge, Button, Input, useToast } from "@/components/ui";

type EmpresaRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: string;
  role: string;
  created_at: string;
  suspended_at: string | null;
  slug: string | null;
  business_name: string | null;
  published: boolean;
  blocked: boolean;
};

export function EmpresasTable({
  initialQuery,
  rows,
}: {
  initialQuery: string;
  rows: EmpresaRow[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(
      q ? `/admin/empresas?q=${encodeURIComponent(q)}` : "/admin/empresas",
    );
  }

  function handleSuspend(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const res = await suspendUserAction(id);
      setPendingId(null);
      if (res.ok) {
        toast("Conta suspensa");
        router.refresh();
      } else {
        toast(res.error);
      }
    });
  }

  function handleReactivate(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const res = await reactivateUserAction(id);
      setPendingId(null);
      if (res.ok) {
        toast("Conta reativada");
        router.refresh();
      } else {
        toast(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Empresas
        </h1>
        <p className="text-small text-ink-muted">
          {rows.length} conta{rows.length === 1 ? "" : "s"} encontrada
          {rows.length === 1 ? "" : "s"}.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
        <Input
          label="Buscar por nome, e-mail ou endereço"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ex.: studioforca ou nome@dominio.com"
          className="min-w-[240px] flex-1"
        />
        <Button type="submit" size="md">
          Buscar
        </Button>
      </form>

      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-small text-ink-muted">
            Nenhuma conta encontrada.
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-small font-semibold text-ink">
                    {row.business_name || row.full_name || row.email}
                  </p>
                  <Badge variant="neutral">{row.plan}</Badge>
                  {row.suspended_at ? (
                    <Badge variant="neutral" dot="negative">
                      Suspensa
                    </Badge>
                  ) : row.published ? (
                    <Badge variant="neutral" dot="positive">
                      Publicada
                    </Badge>
                  ) : (
                    <Badge variant="neutral" dot="warning">
                      Rascunho
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-caption text-ink-muted">
                  {row.email} · cadastro em{" "}
                  {new Date(row.created_at).toLocaleDateString("pt-BR")}
                  {row.slug && (
                    <>
                      {" · "}
                      <Link
                        href={`/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-ink underline"
                      >
                        linkmural.com/{row.slug}
                      </Link>
                    </>
                  )}
                </p>
              </div>

              {row.role !== "admin" && (
                <div className="flex shrink-0 gap-2">
                  {row.suspended_at ? (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={pendingId === row.id}
                      onClick={() => handleReactivate(row.id)}
                    >
                      Reativar
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={pendingId === row.id}
                      onClick={() => handleSuspend(row.id)}
                    >
                      Suspender
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
