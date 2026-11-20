/**
 * Plans, limits and features. The single source for the app; the database
 * enforces pages, links, branding and domains on its own (docs/HANDOFF.md §1, §5).
 */

export type Plan = "free" | "pro" | "business";

export type PlanInfo = {
  label: string;
  /** Monthly and yearly price in cents (BRL). */
  price: { monthly: number; yearly: number };
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
    price: { monthly: 1900, yearly: 19000 },
    maxPages: 1,
    maxLinks: null,
    customTheme: true,
    removeBranding: true,
    customDomain: false,
    metrics: "per_link",
    businessFeatures: false,
  },
  business: {
    label: "Negócios",
    price: { monthly: 4900, yearly: 49000 },
    maxPages: 3,
    maxLinks: null,
    customTheme: true,
    removeBranding: true,
    customDomain: true,
    metrics: "full",
    businessFeatures: true,
  },
};

export function planInfo(plan: Plan | null | undefined): PlanInfo {
  return PLANS[plan ?? "free"] ?? PLANS.free;
}
