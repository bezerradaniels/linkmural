import { describe, expect, it } from "vitest";
import {
  buildSlugCandidates,
  finalizeSlug,
  isFamousBrandSlug,
  isOffensiveSlug,
  isPlatformReservedSlug,
  isValidSlug,
  normalizeSlugInput,
  parseHoldCookie,
  serializeHoldCookie,
} from "./slug";

describe("slug normalization and validation", () => {
  it("normalizes accents, uppercase, spaces and repeated hyphens", () => {
    expect(normalizeSlugInput("Studio Força!")).toBe("studio-forca");
    expect(normalizeSlugInput("Café   da  Esquina")).toBe("cafe-da-esquina");
    expect(normalizeSlugInput("---meu__site")).toBe("meu-site");
    // Keeps a single trailing hyphen while typing
    expect(normalizeSlugInput("studio ")).toBe("studio-");
    expect(finalizeSlug("studio ")).toBe("studio");
  });

  it("caps slug length at 30 characters", () => {
    const long = "a".repeat(45);
    expect(normalizeSlugInput(long)).toHaveLength(30);
    expect(isValidSlug(finalizeSlug(long))).toBe(true);
  });

  it("validates slug rules", () => {
    expect(isValidSlug("studioforca")).toBe(true);
    expect(isValidSlug("a-b")).toBe(true);
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("-abc")).toBe(false);
    expect(isValidSlug("abc-")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("Studio")).toBe(false);
  });

  it("builds valid, deduplicated suggestion candidates", () => {
    const candidates = buildSlugCandidates("studioforca");
    expect(candidates.slice(0, 3)).toEqual([
      "studioforca-oficial",
      "studioforcabr",
      "meustudioforca",
    ]);
    for (const c of candidates) {
      expect(isValidSlug(c)).toBe(true);
    }
  });

  it("clips long bases when building candidates", () => {
    const base = "academia-funcional-paulista-sp";
    const candidates = buildSlugCandidates(base);
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    for (const c of candidates) {
      expect(c.length).toBeLessThanOrEqual(30);
      expect(isValidSlug(c)).toBe(true);
    }
  });

  it("serializes and parses hold cookies safely", () => {
    const token = "550e8400-e29b-41d4-a716-446655440000";
    const raw = serializeHoldCookie("studioforca", token);
    expect(parseHoldCookie(raw)).toEqual({ slug: "studioforca", token });
    expect(parseHoldCookie("invalid")).toBeNull();
    expect(parseHoldCookie("ab." + token)).toBeNull();
    expect(parseHoldCookie("studioforca.not-a-uuid")).toBeNull();
  });

  it("blocks profanity, slurs and scam words without false positives", () => {
    for (const bad of [
      "porra",
      "porra123",
      "p0rra",
      "caralho",
      "buceta",
      "merda",
      "bosta",
      "puta",
      "loja-puta",
      "fdp",
      "golpe",
      "pix-premiado",
      "fuck",
    ]) {
      expect(isOffensiveSlug(bad)).toBe(true);
      expect(isValidSlug(bad)).toBe(false);
    }

    for (const good of [
      "studioforca",
      "academia-funcional-paulista-sp",
      "computadores",
      "culinaria-br",
      "curitiba-oficial",
    ]) {
      expect(isOffensiveSlug(good)).toBe(false);
      expect(isValidSlug(good)).toBe(true);
    }
  });

  it("protects multilingual platform routes and famous brands", () => {
    for (const route of [
      "admin",
      "administrador",
      "administrator",
      "login",
      "entrar",
      "connexion",
      "iniciar-sesion",
      "dashboard",
      "painel",
      "faturamento",
      "billing",
      "facturacion",
      "settings",
      "configuracoes",
      "ajustes",
      "parametres",
      "suporte",
      "support",
      "soporte",
      "linkmural",
      "admin-portal",
    ]) {
      expect(isPlatformReservedSlug(route)).toBe(true);
      expect(isValidSlug(route)).toBe(false);
    }

    for (const brand of [
      "apple",
      "apple-oficial",
      "apple-br",
      "google",
      "instagram",
      "tiktok",
      "nubank",
      "meu-nubank",
      "nike",
      "loja-nike",
      "cocacola",
      "coca-cola",
      "mercadolivre",
      "itau",
    ]) {
      expect(isFamousBrandSlug(brand)).toBe(true);
      expect(isValidSlug(brand)).toBe(false);
    }
  });
});
