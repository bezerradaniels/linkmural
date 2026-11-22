import { describe, expect, it } from "vitest";
import {
  isUnsplashCdnUrl,
  isValidUnsplashDownloadUrl,
  mapUnsplashApiPhoto,
} from "./unsplash";

describe("unsplash helpers", () => {
  it("validates official Unsplash CDN image URLs", () => {
    expect(
      isUnsplashCdnUrl(
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1280",
      ),
    ).toBe(true);
    expect(isUnsplashCdnUrl("http://images.unsplash.com/photo-1")).toBe(false);
    expect(isUnsplashCdnUrl("https://evil.com/photo.jpg")).toBe(false);
  });

  it("validates official Unsplash download_location trigger URLs", () => {
    expect(
      isValidUnsplashDownloadUrl(
        "https://api.unsplash.com/photos/AbC_123-xyz/download?ixid=M3w",
      ),
    ).toBe(true);
    expect(
      isValidUnsplashDownloadUrl("https://api.unsplash.com/users/test"),
    ).toBe(false);
    expect(
      isValidUnsplashDownloadUrl("https://evil.com/photos/123/download"),
    ).toBe(false);
  });

  it("maps an Unsplash API photo with UTM attribution links", () => {
    const mapped = mapUnsplashApiPhoto({
      id: "abc123xyz",
      color: "#112233",
      alt_description: "Modern studio",
      urls: {
        small: "https://images.unsplash.com/photo-1?w=400",
        regular: "https://images.unsplash.com/photo-1?w=1080",
      },
      user: {
        name: "Maria Silva",
        username: "mariasilva",
      },
      links: {
        download_location:
          "https://api.unsplash.com/photos/abc123xyz/download?ixid=1",
      },
    });
    expect(mapped).toEqual({
      id: "abc123xyz",
      thumbUrl: "https://images.unsplash.com/photo-1?w=400",
      regularUrl: "https://images.unsplash.com/photo-1?w=1080",
      alt: "Modern studio",
      color: "#112233",
      authorName: "Maria Silva",
      authorUrl:
        "https://unsplash.com/@mariasilva?utm_source=linkmural&utm_medium=referral",
      unsplashUrl:
        "https://unsplash.com/?utm_source=linkmural&utm_medium=referral",
      downloadLocation:
        "https://api.unsplash.com/photos/abc123xyz/download?ixid=1",
    });
  });
});
