import { describe, expect, it } from "vitest";
import { isPlanDestination, safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/app")).toBe("/app");
    expect(safeNext("/onboarding/3?x=1")).toBe("/onboarding/3?x=1");
  });
  it("rejects external and protocol-relative targets", () => {
    expect(safeNext("https://evil.com")).toBe("/app");
    expect(safeNext("//evil.com")).toBe("/app");
    expect(safeNext("/\\evil.com")).toBe("/app");
    expect(safeNext("app")).toBe("/app");
  });
  it("falls back on empty or non-string values", () => {
    expect(safeNext(undefined)).toBe("/app");
    expect(safeNext("")).toBe("/app");
    expect(safeNext(["/app"])).toBe("/app");
  });
});

describe("isPlanDestination", () => {
  it("matches /app/plano with or without query string", () => {
    expect(isPlanDestination("/app/plano")).toBe(true);
    expect(isPlanDestination("/app/plano?periodo=year")).toBe(true);
    expect(isPlanDestination("/app/plano?periodo=month")).toBe(true);
  });
  it("ignores other destinations", () => {
    expect(isPlanDestination("/app")).toBe(false);
    expect(isPlanDestination("/app/planos")).toBe(false);
    expect(isPlanDestination("/planos")).toBe(false);
  });
});
