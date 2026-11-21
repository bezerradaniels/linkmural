import { Badge, EmptyState } from "@/components/ui";
import { createAdminClient } from "@/utils/supabase/admin";

const ACTION_LABELS: Record<string, string> = {
  suspend_account: "Conta suspensa",
  reactivate_account: "Conta reativada",
  block_page: "Página bloqueada",
  unblock_page: "Página desbloqueada",
  flag_link: "Link sinalizado",
  dismiss_report: "Denúncia descartada",
};

const EMAIL_KIND_LABELS: Record<string, string> = {
  onboarding_1h: "Cadastro parado (1h)",
  onboarding_24h: "Cadastro parado (24h)",
  put_in_bio: "Coloque na bio (Dia 1)",
  day3_first_clicks: "Primeiros cliques (Dia 3)",
  day7_tip: "Dica da semana (Dia 7)",
  free_link_limit: "Limite de 5 links",
  renewal_price_increase: "Aviso de renovação (preço regular)",
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export default async function AdminAtividadesPage() {
  const admin = createAdminClient();

  const [actionsRes, emailsRes] = await Promise.all([
    admin
      .from("admin_actions")
      .select(
        "id, action, target_type, target_id, details, created_at, profiles(email)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("email_logs")
      .select("id, kind, sent_at, profiles(email)")
      .order("sent_at", { ascending: false })
      .limit(50),
  ]);

  const actions = actionsRes.data ?? [];
  const emails = emailsRes.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Atividades
        </h1>
        <p className="text-small text-ink-muted">
          Registro de ações administrativas e histórico de e-mails automáticos
          disparados.
        </p>
      </div>

      {/* Admin audit log */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-title tracking-[-0.02em]">
          Ações do admin ({actions.length})
        </h2>

        {actions.length === 0 ? (
          <EmptyState
            icon="check"
            title="Nenhuma ação administrativa registrada"
            text="Suspensões, bloqueios e resoluções de denúncias aparecem aqui com data e responsável."
          />
        ) : (
          <div className="divide-y divide-line">
            {actions.map((row) => {
              const prof = Array.isArray(row.profiles)
                ? row.profiles[0]
                : row.profiles;
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-small"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {ACTION_LABELS[row.action] ?? row.action}{" "}
                      <span className="font-normal text-ink-muted">
                        ({row.target_type}: <code>{row.target_id}</code>)
                      </span>
                    </p>
                    <p className="text-caption text-ink-muted">
                      Por {prof?.email ?? "admin removido"}
                    </p>
                  </div>
                  <span className="text-caption text-ink-muted">
                    {formatDateTime(row.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lifecycle emails sent */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-title tracking-[-0.02em]">
          E-mails automáticos enviados ({emails.length})
        </h2>

        {emails.length === 0 ? (
          <EmptyState
            icon="mail"
            title="Nenhum e-mail automático enviado ainda"
            text="Os disparos de onboarding, dicas e renovação aparecerão aqui conforme forem enviados."
          />
        ) : (
          <div className="divide-y divide-line">
            {emails.map((row) => {
              const prof = Array.isArray(row.profiles)
                ? row.profiles[0]
                : row.profiles;
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-small"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">
                      {EMAIL_KIND_LABELS[row.kind] ?? row.kind}
                    </Badge>
                    <span className="text-ink">
                      {prof?.email ?? "(sem e-mail)"}
                    </span>
                  </div>
                  <span className="text-caption text-ink-muted">
                    {formatDateTime(row.sent_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
