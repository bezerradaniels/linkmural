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
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#101828]">
          Atividades
        </h1>
        <p className="mt-0.5 text-[15px] font-medium text-[#667085]">
          Registro de ações administrativas e histórico de e-mails automáticos
          disparados.
        </p>
      </div>

      {/* Admin audit log */}
      <section className="flex flex-col gap-2.5 rounded-[10px] border border-[#EAECF0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-semibold text-[#101828]">
            Ações do admin
          </h2>
          <span className="inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-2 text-[12px] leading-none font-semibold text-[#5B4FE9]">
            {actions.length}
          </span>
        </div>

        {actions.length === 0 ? (
          <EmptyState
            icon="check"
            title="Nenhuma ação administrativa registrada"
            text="Suspensões, bloqueios e resoluções de denúncias aparecem aqui com data e responsável."
          />
        ) : (
          <div className="divide-y divide-[#F2F4F7]">
            {actions.map((row) => {
              const prof = Array.isArray(row.profiles)
                ? row.profiles[0]
                : row.profiles;
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#101828]">
                      {ACTION_LABELS[row.action] ?? row.action}{" "}
                      <span className="font-medium text-[#667085]">
                        ({row.target_type}: <code>{row.target_id}</code>)
                      </span>
                    </p>
                    <p className="text-[13px] text-[#667085]">
                      Por {prof?.email ?? "admin removido"}
                    </p>
                  </div>
                  <span className="text-[13px] text-[#667085] tabular-nums">
                    {formatDateTime(row.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Lifecycle emails sent */}
      <section className="flex flex-col gap-2.5 rounded-[10px] border border-[#EAECF0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-semibold text-[#101828]">
            E-mails automáticos enviados
          </h2>
          <span className="inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-2 text-[12px] leading-none font-semibold text-[#5B4FE9]">
            {emails.length}
          </span>
        </div>

        {emails.length === 0 ? (
          <EmptyState
            icon="mail"
            title="Nenhum e-mail automático enviado ainda"
            text="Os disparos de onboarding, dicas e renovação aparecerão aqui conforme forem enviados."
          />
        ) : (
          <div className="divide-y divide-[#F2F4F7]">
            {emails.map((row) => {
              const prof = Array.isArray(row.profiles)
                ? row.profiles[0]
                : row.profiles;
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[14px]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">
                      {EMAIL_KIND_LABELS[row.kind] ?? row.kind}
                    </Badge>
                    <span className="text-[#101828]">
                      {prof?.email ?? "(sem e-mail)"}
                    </span>
                  </div>
                  <span className="text-[13px] text-[#667085] tabular-nums">
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
