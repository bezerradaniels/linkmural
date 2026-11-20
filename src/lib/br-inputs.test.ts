import { describe, expect, it } from "vitest";
import { BR_CITIES, formatBrPhoneMask, searchBrCities } from "./br-inputs";

describe("formatBrPhoneMask", () => {
  it("formats mobile and landline numbers progressively", () => {
    expect(formatBrPhoneMask("")).toBe("");
    expect(formatBrPhoneMask("11")).toBe("(11");
    expect(formatBrPhoneMask("119999")).toBe("(11) 9999");
    expect(formatBrPhoneMask("1133334444")).toBe("(11) 3333-4444");
    expect(formatBrPhoneMask("11999998888")).toBe("(11) 99999-8888");
  });

  it("locks at 11 digits and ignores letters/symbols", () => {
    expect(formatBrPhoneMask("11abc99999-888899999")).toBe("(11) 99999-8888");
  });

  it("strips leading 55 country code from stored numbers", () => {
    expect(formatBrPhoneMask("5511999998888")).toBe("(11) 99999-8888");
    expect(formatBrPhoneMask("551133334444")).toBe("(11) 3333-4444");
  });
});

describe("searchBrCities", () => {
  it("contains all IBGE Brazilian municipalities", () => {
    expect(BR_CITIES.length).toBeGreaterThanOrEqual(5570);
  });

  it("matches capitals and interior municipalities ignoring accents", () => {
    const res = searchBrCities("sao pau");
    expect(res).toContain("São Paulo, SP");

    const vitoria = searchBrCities("vitoria");
    expect(vitoria).toContain("Vitória, ES");

    expect(searchBrCities("bom jesus da lapa")).toContain(
      "Bom Jesus da Lapa, BA",
    );
    expect(searchBrCities("pirenopolis")).toContain("Pirenópolis, GO");
  });

  it("returns empty array when query is empty", () => {
    expect(searchBrCities("")).toEqual([]);
  });
});
