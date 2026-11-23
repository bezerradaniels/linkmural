import { describe, expect, it } from "vitest";
import {
  COMPARISON_SLUGS,
  COMPARISONS,
  getComparisonBySlug,
} from "./comparisons";
import { getNicheBySlug, NICHE_SLUGS, NICHES } from "./niches";

describe("comparisons dataset", () => {
  it("contains all 5 priority comparison pages with unique slugs", () => {
    expect(COMPARISONS).toHaveLength(5);
    expect(new Set(COMPARISON_SLUGS).size).toBe(COMPARISONS.length);
  });

  it("has valid cross-links to existing niches, AEO answers, tables and FAQs", () => {
    for (const item of COMPARISONS) {
      expect(getComparisonBySlug(item.slug)).toBe(item);
      expect(item.aeoAnswer.length).toBeGreaterThan(80);
      expect(item.table.length).toBeGreaterThanOrEqual(5);
      expect(item.faqs.length).toBeGreaterThanOrEqual(3);
      for (const nicheSlug of item.relatedNiches) {
        expect(getNicheBySlug(nicheSlug)).toBeDefined();
      }
    }
  });
});

describe("niches dataset", () => {
  it("contains all 14 programmatic niche pages with unique slugs", () => {
    expect(NICHES).toHaveLength(14);
    expect(new Set(NICHE_SLUGS).size).toBe(NICHES.length);
  });

  it("has valid cross-links, AEO answers, preview links, checklists and FAQs", () => {
    for (const item of NICHES) {
      expect(getNicheBySlug(item.slug)).toBe(item);
      expect(item.aeoAnswer.length).toBeGreaterThan(80);
      expect(item.preview.links.length).toBeGreaterThanOrEqual(4);
      expect(item.essentialLinks.length).toBeGreaterThanOrEqual(4);
      expect(item.faqs.length).toBeGreaterThanOrEqual(3);
      for (const rel of item.relatedSlugs) {
        expect(rel).not.toBe(item.slug);
        expect(getNicheBySlug(rel)).toBeDefined();
      }
      for (const comp of item.recommendedComparisons) {
        expect(getComparisonBySlug(comp)).toBeDefined();
      }
    }
  });
});
