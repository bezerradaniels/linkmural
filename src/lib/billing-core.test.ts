import { describe, expect, it } from "vitest";
import {
  isSameOrigin,
  linksToDeactivate,
  planFromPrice,
  PRICE_LOOKUP_KEYS,
  subscriptionRow,
  type StripeSubscriptionLike,
} from "./billing-core";

const proMonthly = {
  id: "price_monthly",
  lookup_key: "pro_monthly",
  metadata: { plan: "pro", interval: "month" },
  recurring: { interval: "month" },
};

function sub(
  over: Partial<StripeSubscriptionLike> = {},
): StripeSubscriptionLike {
  return {
    id: "sub_1",
    customer: "cus_1",
    status: "active",
    cancel_at_period_end: false,
    items: { data: [{ current_period_end: 1_800_000_000, price: proMonthly }] },
    ...over,
  };
}

describe("planFromPrice", () => {
  it("reads the plan from metadata first", () => {
    expect(planFromPrice({ metadata: { plan: "business" } })).toBe("business");
  });
  it("falls back to the lookup key", () => {
    expect(planFromPrice({ lookup_key: "pro_yearly" })).toBe("pro");
    expect(planFromPrice({ lookup_key: "business_monthly" })).toBe("business");
  });
  it("returns null for prices we do not sell", () => {
    expect(planFromPrice({ lookup_key: "other" })).toBeNull();
    expect(planFromPrice({})).toBeNull();
  });
  it("matches the lookup keys of the configured prices", () => {
    expect(planFromPrice({ lookup_key: PRICE_LOOKUP_KEYS.month })).toBe("pro");
    expect(planFromPrice({ lookup_key: PRICE_LOOKUP_KEYS.year })).toBe("pro");
  });
});

describe("subscriptionRow", () => {
  it("maps an active monthly subscription", () => {
    expect(subscriptionRow(sub(), "user-1")).toEqual({
      id: "sub_1",
      user_id: "user-1",
      stripe_customer_id: "cus_1",
      price_id: "price_monthly",
      plan: "pro",
      billing_interval: "month",
      status: "active",
      current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      cancel_at_period_end: false,
    });
  });

  it("accepts an expanded customer and keeps cancel_at_period_end", () => {
    const row = subscriptionRow(
      sub({ customer: { id: "cus_9" }, cancel_at_period_end: true }),
      "user-1",
    );
    expect(row?.stripe_customer_id).toBe("cus_9");
    expect(row?.cancel_at_period_end).toBe(true);
  });

  it("keeps past_due and canceled statuses as they are", () => {
    expect(subscriptionRow(sub({ status: "past_due" }), "u")?.status).toBe(
      "past_due",
    );
    expect(subscriptionRow(sub({ status: "canceled" }), "u")?.status).toBe(
      "canceled",
    );
  });

  it("ignores subscriptions without a price we sell or with an unknown status", () => {
    const foreign = { id: "price_x", lookup_key: "other", metadata: {} };
    expect(
      subscriptionRow(sub({ items: { data: [{ price: foreign }] } }), "u"),
    ).toBeNull();
    expect(subscriptionRow(sub({ status: "weird" }), "u")).toBeNull();
  });

  it("leaves the period end empty when Stripe sends none", () => {
    const row = subscriptionRow(
      sub({ items: { data: [{ price: proMonthly }] } }),
      "u",
    );
    expect(row?.current_period_end).toBeNull();
  });
});

describe("linksToDeactivate", () => {
  const make = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `l${i}`,
      active: true,
      featured: false,
      position: i,
    }));

  it("keeps the first 5 and deactivates the rest, never deleting", () => {
    expect(linksToDeactivate(make(8))).toEqual(["l5", "l6", "l7"]);
  });
  it("does nothing within the free limit", () => {
    expect(linksToDeactivate(make(5))).toEqual([]);
  });
  it("keeps the featured link even when it is far down", () => {
    const links = make(8);
    links[7].featured = true;
    const off = linksToDeactivate(links);
    expect(off).not.toContain("l7");
    expect(off).toHaveLength(3);
  });
  it("ignores links that are already inactive", () => {
    const links = make(7);
    links[0].active = false;
    links[1].active = false;
    expect(linksToDeactivate(links)).toEqual([]);
  });
});

describe("isSameOrigin", () => {
  it("allows requests without an Origin", () => {
    expect(isSameOrigin(new Headers({ host: "linkmural.com" }))).toBe(true);
  });
  it("allows the same host and blocks another one", () => {
    expect(
      isSameOrigin(
        new Headers({ origin: "https://linkmural.com", host: "linkmural.com" }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new Headers({ origin: "https://evil.example", host: "linkmural.com" }),
      ),
    ).toBe(false);
  });
  it("prefers x-forwarded-host behind a proxy", () => {
    expect(
      isSameOrigin(
        new Headers({
          origin: "https://beta.linkmural.com",
          host: "127.0.0.1:3000",
          "x-forwarded-host": "beta.linkmural.com",
        }),
      ),
    ).toBe(true);
  });
  it("rejects a malformed Origin", () => {
    expect(
      isSameOrigin(new Headers({ origin: "not a url", host: "a.com" })),
    ).toBe(false);
  });
});
