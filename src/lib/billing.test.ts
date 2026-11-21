import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...a: unknown[]) => revalidateTag(...a),
}));

type Row = Record<string, unknown>;
const db: Record<string, Row[]> = {};

/** Tiny in-memory stand-in for the Supabase admin client (only what billing.ts uses). */
function table(name: string) {
  const filters: ((r: Row) => boolean)[] = [];
  let op: "select" | "update" | "upsert" = "select";
  let payload: Row = {};
  let cols = "";

  const rows = () => (db[name] ?? []).filter((r) => filters.every((f) => f(r)));
  const run = (): { data: unknown; error: null } => {
    if (op === "upsert") {
      const list = (db[name] ??= []);
      const i = list.findIndex((r) => r.id === payload.id);
      if (i >= 0) list[i] = { ...list[i], ...payload };
      else list.push({ ...payload });
      // Stand-in for the sync_profile_plan trigger.
      const paid = ["active", "trialing", "past_due"];
      const mine = list.filter(
        (s) =>
          s.user_id === payload.user_id && paid.includes(s.status as string),
      );
      const profile = db.profiles.find((p) => p.id === payload.user_id);
      if (profile) profile.plan = mine.length ? "pro" : "free";
      return { data: null, error: null };
    }
    if (op === "update") {
      for (const r of rows()) Object.assign(r, payload);
      return { data: null, error: null };
    }
    const found = rows().map((r) => {
      if (name === "pages" && cols.includes("links(")) {
        return {
          ...r,
          links: (db.links ?? []).filter((l) => l.page_id === r.id),
        };
      }
      return r;
    });
    return { data: found, error: null };
  };

  const builder: Record<string, unknown> = {
    select(c: string) {
      cols = c;
      return builder;
    },
    update(p: Row) {
      op = "update";
      payload = p;
      return builder;
    },
    upsert(p: Row) {
      op = "upsert";
      payload = p;
      return Promise.resolve(run());
    },
    eq(col: string, v: unknown) {
      filters.push((r) => r[col] === v);
      return builder;
    },
    in(col: string, vs: unknown[]) {
      filters.push((r) => vs.includes(r[col]));
      return builder;
    },
    maybeSingle() {
      const res = run();
      return Promise.resolve({
        data: (res.data as Row[])[0] ?? null,
        error: null,
      });
    },
    then(resolve: (v: unknown) => void) {
      resolve(run());
    },
  };
  return builder;
}

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => ({ from: (n: string) => table(n) }),
}));

const retrieve = vi.fn();
const delCustomer = vi.fn();
vi.mock("./stripe", () => ({
  getStripe: () => ({
    subscriptions: { retrieve },
    customers: { del: delCustomer },
  }),
  isBillingEnabled: () => true,
}));

import { deleteStripeCustomerForUser, handleStripeEvent } from "./billing";

const price = {
  id: "price_m",
  lookup_key: "pro_monthly",
  metadata: { plan: "pro" },
  recurring: { interval: "month" },
};
const stripeSub = (status: string, extra: Row = {}) => ({
  id: "sub_1",
  customer: "cus_1",
  status,
  cancel_at_period_end: false,
  metadata: { user_id: "u1" },
  items: { data: [{ current_period_end: 1_800_000_000, price }] },
  ...extra,
});
const event = (type: string, object: unknown) =>
  ({ type, id: "evt_1", data: { object } }) as never;

beforeEach(() => {
  retrieve.mockReset();
  delCustomer.mockReset();
  revalidateTag.mockReset();
  db.profiles = [{ id: "u1", plan: "free", stripe_customer_id: "cus_1" }];
  db.subscriptions = [];
  db.pages = [{ id: "p1", slug: "loja", owner_id: "u1", show_branding: false }];
  db.links = Array.from({ length: 8 }, (_, i) => ({
    id: `l${i}`,
    page_id: "p1",
    active: true,
    featured: false,
    position: i,
  }));
});

describe("handleStripeEvent", () => {
  it("turns the Pro plan on when the subscription becomes active", async () => {
    retrieve.mockResolvedValue(stripeSub("active"));
    await handleStripeEvent(
      event("checkout.session.completed", {
        mode: "subscription",
        subscription: "sub_1",
      }),
    );
    expect(db.subscriptions).toHaveLength(1);
    expect(db.subscriptions[0]).toMatchObject({
      id: "sub_1",
      user_id: "u1",
      plan: "pro",
      status: "active",
      billing_interval: "month",
    });
    expect(db.profiles[0].plan).toBe("pro");
    // Pro keeps every link.
    expect(db.links.every((l) => l.active)).toBe(true);
  });

  it("is idempotent: the same event twice leaves one row", async () => {
    retrieve.mockResolvedValue(stripeSub("active"));
    const e = event("customer.subscription.updated", stripeSub("active"));
    await handleStripeEvent(e);
    await handleStripeEvent(e);
    expect(db.subscriptions).toHaveLength(1);
  });

  it("downgrades on cancellation: extra links off (not deleted), branding back, caches refreshed", async () => {
    retrieve.mockResolvedValue(stripeSub("active"));
    await handleStripeEvent(
      event("customer.subscription.created", stripeSub("active")),
    );
    db.pages[0].show_branding = false;

    retrieve.mockResolvedValue(stripeSub("canceled"));
    await handleStripeEvent(
      event("customer.subscription.deleted", stripeSub("canceled")),
    );

    expect(db.profiles[0].plan).toBe("free");
    expect(db.links).toHaveLength(8);
    expect(db.links.filter((l) => l.active).map((l) => l.id)).toEqual([
      "l0",
      "l1",
      "l2",
      "l3",
      "l4",
    ]);
    expect(db.pages[0].show_branding).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith(
      expect.stringContaining("loja"),
      "max",
    );
  });

  it("keeps Pro while a payment is past due", async () => {
    retrieve.mockResolvedValue(stripeSub("past_due"));
    await handleStripeEvent(
      event("invoice.payment_failed", {
        parent: { subscription_details: { subscription: "sub_1" } },
      }),
    );
    expect(db.profiles[0].plan).toBe("pro");
    expect(db.links.every((l) => l.active)).toBe(true);
  });

  it("uses the event payload when Stripe no longer has the subscription", async () => {
    retrieve.mockRejectedValue({ code: "resource_missing" });
    await handleStripeEvent(
      event("customer.subscription.deleted", stripeSub("canceled")),
    );
    expect(db.subscriptions[0]).toMatchObject({ status: "canceled" });
  });

  it("finds the user by customer id when the metadata is missing", async () => {
    retrieve.mockResolvedValue(stripeSub("active", { metadata: {} }));
    await handleStripeEvent(
      event("customer.subscription.created", stripeSub("active")),
    );
    expect(db.subscriptions[0]).toMatchObject({ user_id: "u1" });
  });

  it("ignores events for an account that was already deleted", async () => {
    db.profiles = [];
    retrieve.mockResolvedValue(stripeSub("canceled"));
    await handleStripeEvent(
      event("customer.subscription.deleted", stripeSub("canceled")),
    );
    expect(db.subscriptions).toHaveLength(0);
  });

  it("ignores checkout sessions that are not subscriptions and unknown events", async () => {
    await handleStripeEvent(
      event("checkout.session.completed", { mode: "payment" }),
    );
    await handleStripeEvent(event("charge.refunded", {}));
    expect(retrieve).not.toHaveBeenCalled();
  });
});

describe("deleteStripeCustomerForUser", () => {
  it("deletes the customer, which cancels its subscriptions", async () => {
    delCustomer.mockResolvedValue({});
    expect(await deleteStripeCustomerForUser("u1")).toEqual({ ok: true });
    expect(delCustomer).toHaveBeenCalledWith("cus_1");
  });
  it("is fine when there is no customer or Stripe already forgot it", async () => {
    db.profiles = [{ id: "u2", plan: "free", stripe_customer_id: null }];
    expect(await deleteStripeCustomerForUser("u2")).toEqual({ ok: true });
    delCustomer.mockRejectedValue({ code: "resource_missing" });
    expect(await deleteStripeCustomerForUser("u1")).toEqual({ ok: true });
  });
  it("blocks the deletion when Stripe fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    delCustomer.mockRejectedValue(new Error("network"));
    expect(await deleteStripeCustomerForUser("u1")).toEqual({ ok: false });
    spy.mockRestore();
  });
});
