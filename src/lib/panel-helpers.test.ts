import { describe, expect, it } from "vitest";
import {
  calcDeltaPercent,
  editorStateToHours,
  filterIconGroups,
  formatDelta,
  formatMetricNumber,
  hoursToEditorState,
  reorderById,
  retargetWhatsappUrl,
} from "./panel-helpers";

describe("hours editor conversion", () => {
  it("round-trips hours with up to 2 ranges per day (lunch break)", () => {
    const dbHours = {
      mon: [
        ["08:00", "12:00"],
        ["13:30", "18:00"],
      ],
      sat: [["09:00", "13:00"]],
    };
    const editor = hoursToEditorState(dbHours);
    expect(editor.mon.enabled).toBe(true);
    expect(editor.mon.ranges).toEqual([
      { open: "08:00", close: "12:00" },
      { open: "13:30", close: "18:00" },
    ]);
    expect(editor.tue.enabled).toBe(false);
    expect(editor.sat.enabled).toBe(true);

    expect(editorStateToHours(editor)).toEqual(dbHours);
  });

  it("returns null when all days are disabled", () => {
    const editor = hoursToEditorState(null);
    expect(editorStateToHours(editor)).toBeNull();
  });
});

describe("reorderById", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("moves an item to a new position", () => {
    expect(reorderById(items, "c", "a").map((i) => i.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(reorderById(items, "a", "c").map((i) => i.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("returns a shallow copy unchanged when ids match or are missing", () => {
    expect(reorderById(items, "b", "b").map((i) => i.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(reorderById(items, "x", "a").map((i) => i.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("filterIconGroups (IconPicker search & synonyms)", () => {
  it("returns all 4 groups when query is empty", () => {
    const groups = filterIconGroups("");
    expect(groups).toHaveLength(4);
  });

  it("matches Portuguese synonyms like zap, insta and cardápio", () => {
    const zap = filterIconGroups("zap").flatMap((g) => g.icons);
    expect(zap).toContain("si:whatsapp");

    const insta = filterIconGroups("insta").flatMap((g) => g.icons);
    expect(insta).toContain("si:instagram");

    const cardapio = filterIconGroups("cardápio").flatMap((g) => g.icons);
    expect(cardapio).toContain("lm:menu");
  });

  it("returns empty list when nothing matches", () => {
    expect(filterIconGroups("xyz-inexistente-999")).toEqual([]);
  });
});

describe("metrics formatting", () => {
  it("formats pt-BR numbers and compact large values", () => {
    expect(formatMetricNumber(0)).toBe("0");
    expect(formatMetricNumber(1250)).toBe("1.250");
    expect(formatMetricNumber(-5)).toBe("0");
  });

  it("computes and formats deltas", () => {
    expect(calcDeltaPercent(150, 100)).toBe(50);
    expect(calcDeltaPercent(50, 100)).toBe(-50);
    expect(calcDeltaPercent(10, 0)).toBe(100);
    expect(calcDeltaPercent(0, 0)).toBeNull();

    expect(formatDelta(50)).toBe("+50%");
    expect(formatDelta(-25)).toBe("-25%");
    expect(formatDelta(0)).toBe("0%");
    expect(formatDelta(null)).toBeNull();
  });
});

describe("retargetWhatsappUrl", () => {
  it("moves wa.me links from the old number to the new one, keeping the message", () => {
    expect(
      retargetWhatsappUrl(
        "https://wa.me/5511988887777",
        "5511988887777",
        "5521977776666",
      ),
    ).toBe("https://wa.me/5521977776666");
    expect(
      retargetWhatsappUrl(
        "https://wa.me/5511988887777?text=Ol%C3%A1",
        "5511988887777",
        "5521977776666",
      ),
    ).toBe("https://wa.me/5521977776666?text=Ol%C3%A1");
  });
  it("handles api.whatsapp.com links", () => {
    expect(
      retargetWhatsappUrl(
        "https://api.whatsapp.com/send?phone=5511988887777",
        "5511988887777",
        "5521977776666",
      ),
    ).toBe("https://api.whatsapp.com/send?phone=5521977776666");
  });
  it("leaves links to other numbers or other sites alone", () => {
    expect(
      retargetWhatsappUrl(
        "https://wa.me/5531900000000",
        "5511988887777",
        "5521977776666",
      ),
    ).toBeNull();
    expect(
      retargetWhatsappUrl(
        "https://instagram.com/x",
        "5511988887777",
        "5521977776666",
      ),
    ).toBeNull();
    expect(
      retargetWhatsappUrl("nada", "5511988887777", "5521977776666"),
    ).toBeNull();
  });
});
