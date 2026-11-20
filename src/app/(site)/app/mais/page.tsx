import type { Metadata } from "next";
import Link from "next/link";
import { SignOutForm } from "@/components/app/SignOutForm";
import { Badge, Button, Icon } from "@/components/ui";
import { getPanelContext } from "@/lib/panel-data";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Mais",
};

export default async function MaisPage() {
  const { email, plan } = await getPanelContext();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-display-md tracking-[-0.03em]">
          Mais
        </h1>
        <p className="text-small text-ink-muted">{email}</p>
      </div>

      <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        <Link
          href="/app/informacoes"
          className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-body font-medium transition-colors hover:bg-hover"
        >
          <span className="flex items-center gap-3">
            <Icon name="edit" size={20} className="text-ink-muted" />
            Informações do negócio
          </span>
          <Icon name="arrow" size={16} className="text-ink-muted" />
        </Link>

        <Link
          href="/app/plano"
          className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-body font-medium transition-colors hover:bg-hover"
        >
          <span className="flex items-center gap-3">
            <Icon name="payment" size={20} className="text-ink-muted" />
            Plano e cobrança
          </span>
          <span className="flex items-center gap-2">
            <Badge variant={plan === "free" ? "neutral" : "pro"}>
              {PLANS[plan].label}
            </Badge>
            <Icon name="arrow" size={16} className="text-ink-muted" />
          </span>
        </Link>

        <Link
          href="/app/previa"
          className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-body font-medium transition-colors hover:bg-hover"
        >
          <span className="flex items-center gap-3">
            <Icon name="external" size={20} className="text-ink-muted" />
            Ver prévia da página
          </span>
          <Icon name="arrow" size={16} className="text-ink-muted" />
        </Link>
      </div>

      <SignOutForm>
        <Button type="submit" variant="outline" size="lg" className="w-full">
          Sair da conta
        </Button>
      </SignOutForm>
    </div>
  );
}
