import { describe, expect, it } from "vitest";
import {
  computeRowUrl,
  parseStoredRows,
  rowsToCsv,
  rowsToTsv,
  UTM_PRESETS,
  type UtmSheetRow,
} from "./utm-sheet";

const SAMPLE_ROW: UtmSheetRow = {
  id: "r1",
  label: "Stories Promo, Maio",
  baseUrl: "https://linkmural.com/clinica",
  source: "Instagram",
  medium: "Stories",
  campaign: "Dia das Mães",
  content: "Botão topo",
  term: "",
  createdAt: "2026-11-23T10:00:00.000Z",
};

describe("utm-sheet helpers", () => {
  it("computes normalized UTM URL from row fields", () => {
    expect(computeRowUrl(SAMPLE_ROW)).toBe(
      "https://linkmural.com/clinica?utm_source=instagram&utm_medium=stories&utm_campaign=dia_das_maes&utm_content=botao_topo",
    );
  });

  it("exports UTF-8 BOM CSV with quoted cells", () => {
    const csv = rowsToCsv([SAMPLE_ROW]);
    expect(csv.startsWith("\uFEFFRótulo,URL Final,URL Base,utm_source")).toBe(
      true,
    );
    expect(csv).toContain('"Stories Promo, Maio"');
    expect(csv).toContain("utm_campaign=dia_das_maes");
  });

  it("exports tab-separated TSV for Google Sheets / Excel paste", () => {
    const tsv = rowsToTsv([SAMPLE_ROW]);
    const lines = tsv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0].split("\t")).toHaveLength(8);
    expect(lines[1].split("\t")[3]).toBe("instagram");
  });

  it("safely parses stored rows and ignores corrupted JSON", () => {
    expect(parseStoredRows(null)).toEqual([]);
    expect(parseStoredRows("{invalid")).toEqual([]);
    const parsed = parseStoredRows(JSON.stringify([SAMPLE_ROW, { bad: true }]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("r1");
  });

  it("has valid unique presets", () => {
    expect(UTM_PRESETS.length).toBeGreaterThanOrEqual(7);
    expect(new Set(UTM_PRESETS.map((p) => p.id)).size).toBe(UTM_PRESETS.length);
  });
});
