"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  blockPageAction,
  dismissReportAction,
  flagLinkAction,
  unblockPageAction,
} from "@/app/(site)/admin/actions";
import { Badge, Button, EmptyState, useToast } from "@/components/ui";

type ModerationItem = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  page: {
    id: string;
    slug: string;
    business_name: string;
    blocked: boolean;
    links: { id: string; title: string; url: string; flagged: boolean }[];
  } | null;
};

const REASON_LABELS: Record<string, string> = {
  golpe: "Golpe / phishing",
  spam: "Spam",
  conteudo_improprio: "Conteúdo impróprio",
  marca: "Uso indevido de marca",
  outro: "Outro",
};

export function ModerationQueue({ items }: { items: ModerationItem[] }) {
  const toast = useToast();
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    okMsg: string,
  ) {
    setBusyKey(key);
    startTransition(async () => {
      const res = await fn();
      setBusyKey(null);
      if (res.ok) {
        toast(okMsg);
        router.refresh();
      } else {
        toast(res.error ?? "Erro ao executar ação.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#101828]">
          Moderação
        </h1>
        <p className="mt-0.5 text-[15px] font-medium text-[#667085]">
          Fila de denúncias enviadas nas páginas públicas.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[10px] border border-[#EAECF0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <EmptyState
            icon="check"
            title="Nenhuma denúncia na fila"
            text="Quando alguém denunciar uma página pública, ela aparece aqui."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-[10px] border border-[#EAECF0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="neutral"
                    dot={
                      item.status === "open"
                        ? "warning"
                        : item.status === "actioned"
                          ? "negative"
                          : "off"
                    }
                  >
                    {item.status === "open"
                      ? "Aberta"
                      : item.status === "actioned"
                        ? "Bloqueada"
                        : "Descartada"}
                  </Badge>
                  <span className="text-[15px] font-semibold text-[#101828]">
                    {REASON_LABELS[item.reason] ?? item.reason}
                  </span>
                </div>
                <span className="text-[13px] text-[#667085] tabular-nums">
                  {new Date(item.created_at).toLocaleString("pt-BR")}
                </span>
              </div>

              {item.details && (
                <p className="rounded-[8px] border border-[#EAECF0] bg-[#F9FAFB] p-3 text-[14px] text-[#101828]">
                  {item.details}
                </p>
              )}

              {item.page && (
                <div className="flex flex-col gap-2.5 border-t border-line pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-small">
                      <strong>
                        {item.page.business_name || item.page.slug}
                      </strong>{" "}
                      ·{" "}
                      <Link
                        href={`/${item.page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        linkmural.com/{item.page.slug}
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.page.blocked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={busyKey === `unblock-${item.page.id}`}
                          onClick={() =>
                            run(
                              `unblock-${item.page!.id}`,
                              () => unblockPageAction(item.page!.id),
                              "Página desbloqueada",
                            )
                          }
                        >
                          Desbloquear página
                        </Button>
                      ) : (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={busyKey === `block-${item.id}`}
                          onClick={() =>
                            run(
                              `block-${item.id}`,
                              () => blockPageAction(item.page!.id, item.id),
                              "Página bloqueada",
                            )
                          }
                        >
                          Bloquear página
                        </Button>
                      )}

                      {item.status === "open" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={busyKey === `dismiss-${item.id}`}
                          onClick={() =>
                            run(
                              `dismiss-${item.id}`,
                              () => dismissReportAction(item.id),
                              "Denúncia descartada",
                            )
                          }
                        >
                          Descartar
                        </Button>
                      )}
                    </div>
                  </div>

                  {item.page.links.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-caption font-semibold text-ink-muted">
                        Links da página:
                      </span>
                      {item.page.links.map((l) => (
                        <div
                          key={l.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2 text-caption"
                        >
                          <span className="min-w-0 truncate">
                            <strong>{l.title}</strong> — {l.url}
                          </span>
                          {l.flagged ? (
                            <Badge variant="neutral" dot="negative">
                              Sinalizado
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={busyKey === `flag-${l.id}`}
                              onClick={() =>
                                run(
                                  `flag-${l.id}`,
                                  () => flagLinkAction(l.id, item.page!.slug),
                                  "Link sinalizado",
                                )
                              }
                            >
                              Sinalizar link
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
