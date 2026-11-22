/**
 * Google Analytics 4 (G-JQDPFEB2Z9) events pushed to Google Tag Manager's
 * `window.dataLayer`.
 *
 * Event names follow GA4 rules (lowercase ASCII snake_case, <= 40 chars) with
 * friendly Portuguese identifiers so they are easy to read in GA4 reports and
 * GTM. Never send personal data (email, phone, Pix key, IP) in parameters.
 */

export const GA_MEASUREMENT_ID = "G-JQDPFEB2Z9";

export type GaEventMap = {
  // Aquisição e marketing
  endereco_reservado: {
    origem: "landing";
    com_indicacao: "sim" | "nao";
  };
  login_iniciado: {
    metodo: "google" | "email";
  };
  lista_espera_aberta: {
    plano: "pro" | "business";
    origem: string;
  };
  lista_espera_inscrita: {
    plano: "pro" | "business";
    origem: string;
  };

  // Onboarding e publicação
  pagina_publicada: {
    origem: "onboarding" | "painel";
    slug: string;
  };
  onboarding_concluido: {
    slug: string;
  };

  // Painel do usuário
  link_adicionado: {
    icone: string;
    destaque: "sim" | "nao";
  };
  link_removido: {
    tipo_link: string;
  };
  aparencia_salva: {
    modelo: string;
    estilo: string;
    plano: string;
  };
  link_pagina_copiado: {
    origem: "onboarding" | "painel";
    slug: string;
  };
  qrcode_baixado: {
    origem: "onboarding" | "painel" | "pagina_publica";
    formato: "png" | "svg";
    slug: string;
  };
  sugestao_enviada: {
    origem: "painel_ajuda";
  };

  // Página pública
  pagina_publica_visualizada: {
    slug: string;
    modelo: string;
    estilo: string;
  };
  link_publico_clicado: {
    slug: string;
    titulo_link: string;
    tipo_link: string;
  };
  pagina_compartilhada: {
    metodo: "nativo" | "copiar_link";
  };
  qrcode_visualizado: {
    slug: string;
  };
  chave_pix_copiada: {
    slug: string;
  };
  denuncia_enviada: {
    motivo: string;
  };

  // Cobrança e Stripe
  clique_assinar_pro: {
    plano: "pro" | "business";
    periodicidade: "month" | "year";
    origem: "planos";
  };
  begin_checkout: {
    currency: "BRL";
    value: number;
    plano: "pro" | "business";
    periodicidade: "month" | "year";
  };
  purchase: {
    currency: "BRL";
    value: number;
    transaction_id: string;
    plano: "pro" | "business";
    periodicidade: "month" | "year";
  };
  checkout_cancelado: {
    origem: "painel_plano";
  };
  portal_assinatura_aberto: {
    plano: "pro" | "business";
  };
};

export type GaEventName = keyof GaEventMap;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/** Pushes a typed GA4 event into `window.dataLayer` for GTM to pick up. */
export function trackGaEvent<E extends GaEventName>(
  event: E,
  params: GaEventMap[E],
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...params,
  });
}
