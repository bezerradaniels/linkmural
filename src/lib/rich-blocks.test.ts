import { describe, expect, it } from "vitest";
import {
  extractYoutubeId,
  isRichBlockKind,
  parseGalleryData,
  parseServiceData,
  parseYoutubeVideoId,
} from "./rich-blocks";

describe("rich-blocks", () => {
  it("identifies studio rich block kinds", () => {
    expect(isRichBlockKind("gallery")).toBe(true);
    expect(isRichBlockKind("youtube")).toBe(true);
    expect(isRichBlockKind("service")).toBe(true);
    expect(isRichBlockKind("link")).toBe(false);
    expect(isRichBlockKind(null)).toBe(false);
  });

  it("extracts YouTube video IDs from watch, short, shorts, embed and live URLs", () => {
    expect(
      extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeId("https://youtu.be/dQw4w9WgXcQ?si=123")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(
      extractYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractYoutubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYoutubeId("https://instagram.com/linkmural")).toBeNull();
  });

  it("parses gallery, youtube and service data safely", () => {
    expect(
      parseGalleryData({
        images: [{ url: "https://example.com/a.jpg", caption: "Foto 1" }],
      }),
    ).toEqual({
      images: [{ url: "https://example.com/a.jpg", caption: "Foto 1" }],
    });
    expect(parseGalleryData({})).toEqual({ images: [] });

    expect(
      parseYoutubeVideoId(
        {},
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      ),
    ).toBe("dQw4w9WgXcQ");

    expect(
      parseServiceData({
        price: "R$ 150",
        duration: "60 min",
        ctaLabel: "Agendar",
        badge: "Top",
      }),
    ).toEqual({
      price: "R$ 150",
      duration: "60 min",
      ctaLabel: "Agendar",
      badge: "Top",
    });
  });
});
