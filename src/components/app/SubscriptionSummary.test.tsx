import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { summarizeSubscription } from "@/lib/billing-core";
import { SubscriptionSummary } from "./SubscriptionSummary";

const base = {
  planLabel: "Pro",
  status: "active",
  discountPercent: 50,
  features: ["Links ilimitados"],
  actions: <button type="button">Gerenciar assinatura</button>,
};

function yearly(over: { cancelAtPeriodEnd?: boolean } = {}) {
  const cancelAtPeriodEnd = over.cancelAtPeriodEnd ?? false;
  const periodEnd = new Date("2027-11-21T12:00:00Z");
  return {
    ...base,
    cancelAtPeriodEnd,
    endsOn: periodEnd,
    summary: summarizeSubscription({
      interval: "year",
      createdAt: new Date("2026-11-21T12:00:05Z"),
      periodEnd,
      cancelAtPeriodEnd,
      now: new Date("2026-11-22T12:00:00Z"),
    }),
  };
}

describe("SubscriptionSummary", () => {
  it("shows a yearly subscriber the price now, when the discount ends and the next charge", () => {
    render(<SubscriptionSummary {...yearly()} />);
    expect(screen.getByText("Sua assinatura")).toBeTruthy();
    expect(screen.getByText("Ativa")).toBeTruthy();
    expect(screen.getByText(/Pro · Anual/)).toBeTruthy();
    expect(screen.getByText(/R\$ 30,00 por ano/)).toBeTruthy();
    expect(
      screen.getByText(
        /Desconto de lançamento de 50% até 21 de novembro de 2027/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/21 de novembro de 2027 · R\$ 60,00/)).toBeTruthy();
    expect(screen.getByText(/Preço regular/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Gerenciar assinatura" }),
    ).toBeTruthy();
  });

  it("shows the end of a plan set to cancel instead of a next charge", () => {
    render(<SubscriptionSummary {...yearly({ cancelAtPeriodEnd: true })} />);
    expect(screen.getByText("Cancelamento agendado")).toBeTruthy();
    expect(screen.getByText("Fim do plano")).toBeTruthy();
    expect(screen.queryByText("Próxima cobrança")).toBeNull();
    expect(screen.getByText(/Sem novas cobranças/)).toBeTruthy();
  });

  it("flags a pending payment", () => {
    render(<SubscriptionSummary {...yearly()} status="past_due" />);
    expect(screen.getByText("Pagamento pendente")).toBeTruthy();
  });

  it("still renders when there is no subscription row", () => {
    render(<SubscriptionSummary {...yearly()} summary={null} />);
    expect(screen.getByText("Pro")).toBeTruthy();
    expect(screen.queryByText("Valor")).toBeNull();
  });
});
