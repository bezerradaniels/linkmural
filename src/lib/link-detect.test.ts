import { describe, expect, it } from "vitest";
import linkIcons from "../../design/link-icons.json";
import { isKnownIcon } from "./icons";
import {
  DOMAINS,
  detectLink,
  detectPixKey,
  isValidCnpj,
  isValidCpf,
  linkUrlSchema,
  normalizeUrl,
} from "./link-detect";

describe("domain map", () => {
  it("matches design/link-icons.json", () => {
    expect(DOMAINS).toEqual(linkIcons.domains);
  });

  it.each(DOMAINS)("recognizes $host", ({ host, icon, title }) => {
    const found = detectLink(`https://${host}/algum-perfil`);
    expect(found?.icon).toBe(icon);
    expect(found?.title).toBe(title);
    expect(isKnownIcon(icon)).toBe(true);
  });

  it("accepts www, subdomains and missing https", () => {
    expect(detectLink("www.instagram.com/studioforca")).toMatchObject({
      icon: "si:instagram",
      url: "https://instagram.com/studioforca",
    });
    expect(detectLink("m.facebook.com/studioforca")?.icon).toBe("si:facebook");
    expect(detectLink("https://vm.tiktok.com/abc")?.icon).toBe("si:tiktok");
  });

  it("does not confuse look-alike hosts", () => {
    expect(detectLink("https://notinstagram.com/x")?.icon).toBe("lm:link");
    expect(detectLink("https://instagram.com.golpe.ru/x")?.icon).toBe(
      "lm:link",
    );
  });

  it("uses the path for goo.gl/maps only", () => {
    expect(detectLink("https://goo.gl/maps/abc123")?.icon).toBe(
      "si:googlemaps",
    );
    expect(detectLink("https://goo.gl/other")?.icon).toBe("lm:link");
  });

  it("sets kind for WhatsApp and maps", () => {
    expect(detectLink("https://wa.me/5511999990000")?.kind).toBe("whatsapp");
    expect(detectLink("https://maps.app.goo.gl/xyz")?.kind).toBe("map");
    expect(detectLink("https://waze.com/ul?ll=1,2")?.kind).toBe("map");
    expect(detectLink("https://instagram.com/x")?.kind).toBe("link");
  });
});

describe("schemes and fallbacks", () => {
  it("handles tel:, mailto: and PDFs", () => {
    expect(detectLink("tel:+5511999990000")).toMatchObject({
      kind: "phone",
      icon: "lm:phone",
    });
    expect(detectLink("mailto:oi@studio.com")).toMatchObject({
      kind: "email",
      icon: "lm:mail",
    });
    expect(detectLink("https://studio.com/cardapio.PDF")).toMatchObject({
      icon: "lm:pdf",
      title: "PDF",
    });
  });

  it("falls back to the generic link icon and the host as title", () => {
    expect(detectLink("meusite.com.br/contato")).toMatchObject({
      kind: "link",
      icon: "lm:link",
      title: "meusite.com.br",
      url: "https://meusite.com.br/contato",
    });
  });

  it("rejects text that is not a link", () => {
    expect(detectLink("")).toBeNull();
    expect(detectLink("olá mundo")).toBeNull();
    expect(detectLink("localhost")).toBeNull();
    expect(detectLink("javascript:alert(1)")).toBeNull();
    expect(detectLink("ftp://arquivos.com/x")).toBeNull();
    expect(normalizeUrl("data:text/html,oi")).toBeNull();
  });
});

describe("Pix keys", () => {
  it("validates CPF and CNPJ check digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-26")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
  });

  it("detects each key type and normalizes it", () => {
    expect(detectPixKey("529.982.247-25")).toEqual({
      type: "cpf",
      key: "52998224725",
    });
    expect(detectPixKey("11.222.333/0001-81")).toEqual({
      type: "cnpj",
      key: "11222333000181",
    });
    expect(detectPixKey("Pix@Studio.com")).toEqual({
      type: "email",
      key: "pix@studio.com",
    });
    expect(detectPixKey("+55 (11) 99999-0000")).toEqual({
      type: "phone",
      key: "+5511999990000",
    });
    expect(detectPixKey("123E4567-E89B-12D3-A456-426614174000")).toEqual({
      type: "random",
      key: "123e4567-e89b-12d3-a456-426614174000",
    });
  });

  it("does not treat other numbers or URLs as Pix", () => {
    expect(detectPixKey("12345")).toBeNull();
    expect(detectPixKey("11 99999-0000")).toBeNull();
    expect(detectPixKey("https://pix.com")).toBeNull();
  });

  it("turns a pasted key into a Pix link", () => {
    expect(detectLink("529.982.247-25")).toMatchObject({
      kind: "pix",
      icon: "si:pix",
      title: "Pagar com Pix",
      url: "52998224725",
    });
  });
});

describe("linkUrlSchema", () => {
  it("accepts links and Pix keys, rejects the rest with a friendly message", () => {
    expect(linkUrlSchema.safeParse("instagram.com/x").success).toBe(true);
    expect(linkUrlSchema.safeParse("529.982.247-25").success).toBe(true);
    const bad = linkUrlSchema.safeParse("isso não é link");
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.message).toMatch(/não parece válido/);
  });
});
