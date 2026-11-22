import { describe, expect, it } from "vitest";
import {
  buildUrlWithUtm,
  hasUtmParams,
  normalizeUtmValue,
  parseUtmFromUrl,
  stripUtmFromUrl,
  supportsUtmUrl,
} from "./utm";

describe("utm helpers", () => {
  it("normalizes UTM values consistently", () => {
    expect(normalizeUtmValue("  Promoção de Verão!! ")).toBe(
      "promocao_de_verao",
    );
    expect(normalizeUtmValue("Instagram Stories / Bio")).toBe(
      "instagram_stories_bio",
    );
    expect(normalizeUtmValue("cartão-digital")).toBe("cartao-digital");
    expect(normalizeUtmValue("___")).toBe("");
  });

  it("detects web URLs that support UTM parameters and rejects Pix/mailto/tel", () => {
    expect(supportsUtmUrl("https://meusite.com.br/loja")).toBe(true);
    expect(supportsUtmUrl("wa.me/5511999999999?text=Oi")).toBe(true);
    expect(supportsUtmUrl("mailto:oi@empresa.com")).toBe(false);
    expect(supportsUtmUrl("tel:+5511999999999")).toBe(false);
    expect(supportsUtmUrl("pix@empresa.com")).toBe(false);
    expect(supportsUtmUrl("12345678909")).toBe(false);
    expect(supportsUtmUrl("")).toBe(false);
  });

  it("builds URLs with UTM while preserving existing query params and hash", () => {
    const out = buildUrlWithUtm(
      "https://wa.me/5511999999999?text=Quero+agendar#topo",
      {
        source: "Linkmural",
        medium: "Botão Bio",
        campaign: "Promoção Junho",
        content: "Card Principal",
        term: "",
      },
    );
    expect(out).toBe(
      "https://wa.me/5511999999999?text=Quero+agendar&utm_source=linkmural&utm_medium=botao_bio&utm_campaign=promocao_junho&utm_content=card_principal#topo",
    );
  });

  it("parses, detects and strips UTM parameters cleanly", () => {
    const tagged =
      "https://linkmural.com/cafedavila?ref=1&utm_source=instagram&utm_medium=bio&utm_campaign=lancamento";
    expect(hasUtmParams(tagged)).toBe(true);
    expect(parseUtmFromUrl(tagged)).toEqual({
      source: "instagram",
      medium: "bio",
      campaign: "lancamento",
      content: "",
      term: "",
    });
    expect(stripUtmFromUrl(tagged)).toBe(
      "https://linkmural.com/cafedavila?ref=1",
    );
    expect(hasUtmParams("https://linkmural.com/cafedavila")).toBe(false);
  });
});
