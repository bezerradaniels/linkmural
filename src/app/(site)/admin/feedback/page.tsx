import type { Metadata } from "next";
import { EmptyState } from "@/components/ui";
import { createAdminClient } from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Feedback",
};

export default async function AdminFeedbackPage() {
  const admin = createAdminClient();

  const { data } = await admin
    .from("feedback")
    .select("id, message, status, created_at, profiles(email, full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const feedbacks = data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#101828]">
          Feedback
        </h1>
        <p className="mt-0.5 text-[15px] font-medium text-[#667085]">
          Sugestões e comentários enviados pelos usuários no painel.
        </p>
      </div>

      <section className="flex flex-col gap-2.5 rounded-[10px] border border-[#EAECF0] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[#101828]">
            Sugestões dos usuários
          </h2>
          <span className="inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-2 text-[12px] leading-none font-semibold text-[#5B4FE9]">
            {feedbacks.length}
          </span>
        </div>

        {feedbacks.length === 0 ? (
          <EmptyState
            icon="mail"
            title="Nenhuma sugestão enviada ainda"
            text="Quando os usuários enviarem sugestões pelo painel, elas aparecerão aqui."
          />
        ) : (
          <div className="divide-y divide-[#F2F4F7]">
            {feedbacks.map((f) => {
              const prof = Array.isArray(f.profiles)
                ? f.profiles[0]
                : f.profiles;
              return (
                <div key={f.id} className="flex flex-col gap-1 py-3">
                  <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-[#667085]">
                    <span className="font-semibold text-[#344054]">
                      {prof?.full_name || prof?.email || "Usuário"}
                    </span>
                    <span className="tabular-nums">
                      {new Date(f.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-[14px] whitespace-pre-wrap text-[#101828]">
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
