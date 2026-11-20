import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import { createAdminClient } from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Lista de espera & Feedback",
};

export default async function AdminFeedbackPage() {
  const admin = createAdminClient();

  const [waitlistRes, feedbackRes] = await Promise.all([
    admin
      .from("waitlist")
      .select("id, email, plan, source, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("feedback")
      .select("id, message, status, created_at, profiles(email, full_name)")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const waitlist = waitlistRes.data ?? [];
  const feedbacks = feedbackRes.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Lista de espera & Feedback
        </h1>
        <p className="text-small text-ink-muted">
          Interesse nos planos pagos e sugestões enviadas pelo painel.
        </p>
      </div>

      {/* Waitlist */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-title">Lista de espera</h2>
          <Badge variant="pro">{waitlist.length} inscritos</Badge>
        </div>

        {waitlist.length === 0 ? (
          <p className="text-small text-ink-muted">
            Nenhum e-mail na lista de espera ainda.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {waitlist.map((w) => (
              <div
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-small"
              >
                <div>
                  <span className="font-semibold text-ink">{w.email}</span>
                  <span className="ml-2 text-caption text-ink-muted">
                    origem: {w.source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={w.plan === "pro" ? "pro" : "business"}>
                    {w.plan === "pro" ? "Pro" : "Negócios"}
                  </Badge>
                  <span className="text-caption text-ink-muted">
                    {new Date(w.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feedback */}
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-title">Sugestões dos usuários</h2>
          <Badge variant="neutral">{feedbacks.length}</Badge>
        </div>

        {feedbacks.length === 0 ? (
          <p className="text-small text-ink-muted">
            Nenhuma sugestão enviada ainda.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {feedbacks.map((f) => {
              const prof = Array.isArray(f.profiles)
                ? f.profiles[0]
                : f.profiles;
              return (
                <div key={f.id} className="flex flex-col gap-1.5 py-3">
                  <div className="flex items-center justify-between gap-2 text-caption text-ink-muted">
                    <span>{prof?.full_name || prof?.email || "Usuário"}</span>
                    <span>
                      {new Date(f.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-small whitespace-pre-wrap text-ink">
                    {f.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
