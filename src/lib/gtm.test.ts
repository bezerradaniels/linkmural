import fs from "node:fs";
import path from "node:path";
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
  "card_redimensionado",
  "aparencia_salva",
  "unsplash_foto_selecionada",
  "utm_gerado",
  "utm_planilha_exportada",
  "link_pagina_copiado",
  "qrcode_baixado",
  "sugestao_enviada",
  "pagina_publica_visualizada",
  "link_publico_clicado",
  "pagina_compartilhada",
  "qrcode_visualizado",
  "chave_pix_copiada",
  "denuncia_enviada",
  "clique_assinar_pro",
  "begin_checkout",
  "purchase",
  "checkout_cancelado",
  "portal_assinatura_aberto",
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

  it("keeps docs/gtm/linkmural-gtm-ga4.json in sync with every tracked event", () => {
    const gtmPath = path.resolve(
      process.cwd(),
      "docs/gtm/linkmural-gtm-ga4.json",
    );
    const json = JSON.parse(fs.readFileSync(gtmPath, "utf8")) as {
      containerVersion: {
        tag: { parameter?: { key: string; value?: string }[] }[];
        trigger: {
          customEventFilter?: { parameter: { key: string; value: string }[] }[];
        }[];
      };
    };

    const tagEventNames = new Set(
      json.containerVersion.tag
        .map(
          (t) => t.parameter?.find((p) => p.key === "eventName")?.value ?? "",
        )
        .filter(Boolean),
    );
    const triggerEventNames = new Set(
      json.containerVersion.trigger
        .map(
          (tr) =>
            tr.customEventFilter?.[0]?.parameter.find((p) => p.key === "arg1")
              ?.value ?? "",
        )
        .filter(Boolean),
    );

    for (const name of ALL_EVENTS) {
      expect(tagEventNames.has(name), `missing GTM tag for ${name}`).toBe(true);
      expect(
        triggerEventNames.has(name),
        `missing GTM trigger for ${name}`,
      ).toBe(true);
    }
  });
});
