import { beforeEach, describe, expect, it } from "vitest";
import { GA_MEASUREMENT_ID, trackGaEvent, type GaEventName } from "./gtm";

const ALL_EVENTS: GaEventName[] = [
  "endereco_reservado",
  "login_iniciado",
  "lista_espera_aberta",
  "lista_espera_inscrita",
  "pagina_publicada",
  "onboarding_concluido",
  "link_adicionado",
  "link_removido",
  "aparencia_salva",
  "link_pagina_copiado",
  "qrcode_baixado",
  "sugestao_enviada",
  "pagina_publica_visualizada",
  "link_publico_clicado",
  "pagina_compartilhada",
  "qrcode_visualizado",
  "chave_pix_copiada",
  "denuncia_enviada",
];

describe("gtm", () => {
  beforeEach(() => {
    delete window.dataLayer;
  });

  it("exports the configured GA4 measurement ID", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-JQDPFEB2Z9");
  });

  it("initializes dataLayer and pushes event with parameters", () => {
    trackGaEvent("endereco_reservado", {
      origem: "landing",
      com_indicacao: "nao",
    });

    expect(window.dataLayer).toEqual([
      {
        event: "endereco_reservado",
        origem: "landing",
        com_indicacao: "nao",
      },
    ]);
  });

  it("appends to an existing dataLayer without overwriting previous entries", () => {
    window.dataLayer = [{ event: "gtm.js" }];

    trackGaEvent("qrcode_baixado", {
      origem: "painel",
      formato: "png",
      slug: "minha-loja",
    });

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[1]).toEqual({
      event: "qrcode_baixado",
      origem: "painel",
      formato: "png",
      slug: "minha-loja",
    });
  });

  it("uses valid GA4 event names (lowercase ASCII snake_case, max 40 chars)", () => {
    for (const name of ALL_EVENTS) {
      expect(name).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
    }
  });
});
