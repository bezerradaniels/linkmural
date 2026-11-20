import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

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
