import { describe, expect, it } from "vitest";
import { draftToRestore, serializeDraft } from "./use-local-draft";

const server = { name: "Café", bio: "Bio do servidor" };
const base = serializeDraft(server);
const entry = (value: unknown, b = base, v = 2) =>
  JSON.stringify({ v, base: b, value });

describe("draftToRestore", () => {
  it("restores an unsaved edit while the server data is unchanged", () => {
    const edited = { name: "Café Novo", bio: "Bio do servidor" };
    expect(draftToRestore(entry(edited), base)).toEqual({
      restore: edited,
      drop: false,
    });
  });

  it("drops the draft when the server changed meanwhile (another device)", () => {
    const changedOnPhone = serializeDraft({
      name: "Café",
      bio: "Bio salva no celular",
    });
    expect(
      draftToRestore(
        entry({ name: "Café Novo", bio: "Bio do servidor" }),
        changedOnPhone,
      ),
    ).toEqual({
      restore: null,
      drop: true,
    });
  });

  it("drops a draft equal to the server data", () => {
    expect(draftToRestore(entry(server), base)).toEqual({
      restore: null,
      drop: true,
    });
  });

  it("drops old-format and broken entries", () => {
    expect(draftToRestore(JSON.stringify({ name: "x" }), base).drop).toBe(true);
    expect(draftToRestore(entry({ name: "x" }, base, 1), base).drop).toBe(true);
    expect(draftToRestore("{not json", base).drop).toBe(true);
  });

  it("does nothing when there is no draft", () => {
    expect(draftToRestore(null, base)).toEqual({ restore: null, drop: false });
  });
});
