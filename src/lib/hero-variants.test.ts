import { describe, expect, it } from "vitest";
import { HERO_VARIANTS, resolveHeroVariant } from "./hero-variants";

describe("resolveHeroVariant", () => {
  it("resolves valid utm_content keys to their exact variant", () => {
    expect(resolveHeroVariant("concorrentes")).toEqual({
      key: "concorrentes",
      content: HERO_VARIANTS.concorrentes,
    });
    expect(resolveHeroVariant("link_na_bio")).toEqual({
      key: "link_na_bio",
      content: HERO_VARIANTS.link_na_bio,
    });
    expect(resolveHeroVariant("link_para_instagram")).toEqual({
      key: "link_para_instagram",
      content: HERO_VARIANTS.link_para_instagram,
    });
  });

  it("normalizes uppercase and surrounding whitespace", () => {
    expect(resolveHeroVariant("LINK_NA_BIO").key).toBe("link_na_bio");
    expect(resolveHeroVariant("  Concorrentes  ").key).toBe("concorrentes");
    expect(resolveHeroVariant("  LINK_PARA_INSTAGRAM\n").key).toBe(
      "link_para_instagram",
    );
  });

  it("falls back to default when utm_content is missing, empty or unmapped", () => {
    expect(resolveHeroVariant()).toEqual({
      key: "default",
      content: HERO_VARIANTS.default,
    });
    expect(resolveHeroVariant(null).key).toBe("default");
    expect(resolveHeroVariant("").key).toBe("default");
    expect(resolveHeroVariant("   ").key).toBe("default");
    expect(resolveHeroVariant("outro_valor").key).toBe("default");
  });
});
