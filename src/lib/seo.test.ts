import { describe, expect, it } from "vitest";
import {
  buildFaqPageSchema,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildOrganizationSchema,
  buildSoftwareApplicationSchema,
  isEmptyPublicPage,
  isProductionHost,
  serializeJsonLd,
} from "./seo";

describe("isProductionHost", () => {
  it("accepts linkmural.com and www.linkmural.com", () => {
    expect(isProductionHost("linkmural.com")).toBe(true);
    expect(isProductionHost("www.linkmural.com")).toBe(true);
    expect(isProductionHost("LINKMURAL.COM:443")).toBe(true);
  });

  it("rejects beta, localhost, and empty hosts", () => {
    expect(isProductionHost("beta.linkmural.com")).toBe(false);
    expect(isProductionHost("localhost:3000")).toBe(false);
    expect(isProductionHost(null)).toBe(false);
    expect(isProductionHost("")).toBe(false);
  });
});

describe("isEmptyPublicPage", () => {
  it("returns true when page has no links, bio, or contact", () => {
    expect(
      isEmptyPublicPage({
        links: [],
        bio: "",
        whatsapp: null,
        phone: null,
        email: null,
      }),
    ).toBe(true);
  });

  it("returns false when page has at least one link, bio, or contact", () => {
    expect(isEmptyPublicPage({ links: [{ id: "1" }] })).toBe(false);
    expect(isEmptyPublicPage({ links: [], bio: "Dentista em SP" })).toBe(false);
    expect(isEmptyPublicPage({ links: [], whatsapp: "11999999999" })).toBe(
      false,
    );
  });
});

describe("serializeJsonLd", () => {
  it("escapes < characters to prevent script tag breakout", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script>");
  });
});

describe("structured data builders", () => {
  it("builds Organization and SoftwareApplication schemas in BRL", () => {
    const org = buildOrganizationSchema("https://linkmural.com");
    expect(org["@type"]).toBe("Organization");
    expect(org.url).toBe("https://linkmural.com");

    const app = buildSoftwareApplicationSchema("https://linkmural.com");
    expect(app["@type"]).toBe("SoftwareApplication");
    expect(app.offers.length).toBe(5);
    expect(app.offers.every((o) => o.priceCurrency === "BRL")).toBe(true);
  });

  it("builds FAQPage schema from FAQs", () => {
    const faq = buildFaqPageSchema([{ q: "É grátis?", a: "Sim." }]);
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity).toHaveLength(1);
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe("Sim.");
  });
});

describe("llms.txt builders", () => {
  it("includes plans, BRL pricing and canonical links", () => {
    const short = buildLlmsTxt("https://linkmural.com");
    expect(short).toContain("# linkmural");
    expect(short).toContain("R$ 4,99/mês");
    expect(short).toContain("R$ 19,90/mês");
    expect(short).toContain("https://linkmural.com/llms-full.txt");

    const full = buildLlmsFullTxt("https://linkmural.com");
    expect(full).toContain("Plano Grátis");
    expect(full).toContain("Plano Pro");
    expect(full).toContain("Plano Studio");
    expect(full).toContain("LGPD");
  });
});
