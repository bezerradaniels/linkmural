/**
 * Plans, limits and features. The single source for the app; the database
 * enforces pages, links, branding and domains on its own (docs/HANDOFF.md §1, §5).
 */

export type Plan = "free" | "pro" | "business";

export type PlanInfo = {
  label: string;
  /** Sold today? Business stays out of the price pages until Phase 6. */
  onSale: boolean;
  /** What the customer pays, monthly and yearly, in cents (BRL), launch discount included. */
  price: { monthly: number; yearly: number };
  /** Regular price in cents (BRL), shown crossed out while the launch discount runs. */
  listPrice?: { monthly: number; yearly: number };
  /** Launch discount: percentage off, applied for this many months after signup. */
  promo?: { percentOff: number; months: number };
  maxPages: number;
  /** null = unlimited. */
  maxLinks: number | null;
  /** Font, palette, card size, fill and corners. */
  customTheme: boolean;
  /** Can hide "Feito com linkmural". */
  removeBranding: boolean;
  customDomain: boolean;
  metrics: "total" | "per_link" | "full";
  businessFeatures: boolean;
};

export const PLANS: Record<Plan, PlanInfo> = {
  free: {
    label: "Grátis",
    onSale: true,
    price: { monthly: 0, yearly: 0 },
    maxPages: 1,
    maxLinks: 5,
    customTheme: false,
    removeBranding: false,
    customDomain: false,
    metrics: "total",
    businessFeatures: false,
  },
  pro: {
    label: "Pro",
    onSale: true,
    // 50% off the regular price (R$ 9,98 and R$ 60,00) for 12 months:
    // 998 × 0,5 = 499 and 6000 × 0,5 = 3000. After that the price doubles at most.
    price: { monthly: 499, yearly: 3000 },
    listPrice: { monthly: 998, yearly: 6000 },
    promo: { percentOff: 50, months: 12 },
    maxPages: 1,
    maxLinks: null,
    customTheme: true,
    removeBranding: true,
    customDomain: false,
    metrics: "per_link",
    businessFeatures: false,
  },
  business: {
    label: "Studio",
    onSale: true,
    // 50% off the regular price (R$ 39,80 and R$ 298,00) for 12 months:
    // 3980 × 0,5 = 1990 and 29800 × 0,5 = 14900.
    price: { monthly: 1990, yearly: 14900 },
    listPrice: { monthly: 3980, yearly: 29800 },
    promo: { percentOff: 50, months: 12 },
    maxPages: 3,
    maxLinks: null,
    customTheme: true,
    removeBranding: true,
    customDomain: true,
    metrics: "full",
    businessFeatures: true,
  },
};

/** Plans shown on the price pages, in display order. */
export const SALE_PLANS: Plan[] = (
  ["free", "pro", "business"] as Plan[]
).filter((p) => PLANS[p].onSale);

/** 499 → "R$ 4,99"; 0 → "R$ 0". */
export function formatBrl(cents: number): string {
  if (cents === 0) return "R$ 0";
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** Billing cadence of a paid plan. */
export type BillingInterval = "year" | "month";

/** Yearly price spread over 12 months, in cents (3000 → 250). */
export function monthlyEquivalent(yearlyCents: number): number {
  return Math.round(yearlyCents / 12);
}

/** How much cheaper the yearly price is than 12 monthly payments, in whole percent. */
export function yearlySavingsPercent(prices: {
  monthly: number;
  yearly: number;
}): number {
  if (prices.monthly <= 0) return 0;
  return Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100);
}

export function planInfo(plan: Plan | null | undefined): PlanInfo {
  return PLANS[plan ?? "free"] ?? PLANS.free;
}
