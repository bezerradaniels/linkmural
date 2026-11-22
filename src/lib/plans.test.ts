import { describe, expect, it } from "vitest";
import {
  formatBrl,
  monthlyEquivalent,
  PLANS,
  SALE_PLANS,
  yearlySavingsPercent,
} from "./plans";

describe("plans", () => {
  it("sells Grátis, Pro and Studio", () => {
    expect(SALE_PLANS).toEqual(["free", "pro", "business"]);
    expect(PLANS.business.label).toBe("Studio");
  });

  it("Pro and Studio launch prices are exactly 50% off the regular price", () => {
    const { price, listPrice, promo } = PLANS.pro;
    expect(promo).toEqual({ percentOff: 50, months: 12 });
    expect(listPrice).toEqual({ monthly: 998, yearly: 6000 });
    expect(
      Math.round((listPrice!.monthly * (100 - promo!.percentOff)) / 100),
    ).toBe(price.monthly);
    expect(
      Math.round((listPrice!.yearly * (100 - promo!.percentOff)) / 100),
    ).toBe(price.yearly);
    expect(price).toEqual({ monthly: 499, yearly: 3000 });

    const studio = PLANS.business;
    expect(studio.promo).toEqual({ percentOff: 50, months: 12 });
    expect(studio.listPrice).toEqual({ monthly: 3980, yearly: 29800 });
    expect(studio.price).toEqual({ monthly: 1990, yearly: 14900 });
  });

  it("the price after the promotion is never more than double", () => {
    const { listPrice, promo } = PLANS.pro;
    expect(promo!.percentOff).toBeLessThanOrEqual(50);
    expect(listPrice!.monthly / PLANS.pro.price.monthly).toBeLessThanOrEqual(2);
    expect(listPrice!.yearly / PLANS.pro.price.yearly).toBeLessThanOrEqual(2);
  });

  it("yearly price shows R$ 2,50 a month and saves about half", () => {
    expect(monthlyEquivalent(PLANS.pro.price.yearly)).toBe(250);
    expect(monthlyEquivalent(PLANS.pro.listPrice!.yearly)).toBe(500);
    expect(yearlySavingsPercent(PLANS.pro.price)).toBe(50);
    expect(yearlySavingsPercent({ monthly: 0, yearly: 0 })).toBe(0);
  });

  it("formats prices in reais with a comma", () => {
    expect(formatBrl(0)).toBe("R$ 0");
    expect(formatBrl(499)).toBe("R$ 4,99");
    expect(formatBrl(998)).toBe("R$ 9,98");
    expect(formatBrl(3000)).toBe("R$ 30,00");
  });
});
