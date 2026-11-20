import { describe, expect, it } from "vitest";
import {
  cleanUtm,
  countryOf,
  deviceOf,
  isBot,
  isPrefetch,
  referrerHost,
} from "./analytics";

const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
  androidTablet:
    "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  instagramInApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0",
};

describe("isBot", () => {
  it("lets real browsers and in-app browsers through", () => {
    for (const ua of Object.values(UA)) expect(isBot(ua)).toBe(false);
  });
  it("blocks crawlers, link previews and scripts", () => {
    expect(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("WhatsApp/2.23.20.0")).toBe(true);
    expect(isBot("curl/8.4.0")).toBe(true);
    expect(isBot("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/130.0")).toBe(
      true,
    );
    expect(isBot("")).toBe(true);
    expect(isBot(null)).toBe(true);
  });
});

describe("isPrefetch", () => {
  it("detects prefetch and prerender requests", () => {
    expect(isPrefetch(new Headers({ purpose: "prefetch" }))).toBe(true);
    expect(
      isPrefetch(new Headers({ "sec-purpose": "prefetch;prerender" })),
    ).toBe(true);
    expect(isPrefetch(new Headers({}))).toBe(false);
  });
});

describe("deviceOf", () => {
  it("classifies phones, tablets and computers", () => {
    expect(deviceOf(UA.iphone)).toBe("mobile");
    expect(deviceOf(UA.android)).toBe("mobile");
    expect(deviceOf(UA.instagramInApp)).toBe("mobile");
    expect(deviceOf(UA.ipad)).toBe("tablet");
    expect(deviceOf(UA.androidTablet)).toBe("tablet");
    expect(deviceOf(UA.mac)).toBe("desktop");
    expect(deviceOf(UA.windows)).toBe("desktop");
    expect(deviceOf("SomethingElse/1.0")).toBe("other");
  });
});

describe("referrer, country and utm", () => {
  it("keeps only the referrer host and ignores our own", () => {
    expect(referrerHost("https://www.instagram.com/some/path?x=1")).toBe(
      "instagram.com",
    );
    expect(
      referrerHost("https://linkmural.com/studioforca", ["linkmural.com"]),
    ).toBeNull();
    expect(referrerHost("not a url")).toBeNull();
    expect(referrerHost(null)).toBeNull();
  });
  it("reads the Cloudflare country header", () => {
    expect(countryOf(new Headers({ "cf-ipcountry": "br" }))).toBe("BR");
    expect(countryOf(new Headers({ "cf-ipcountry": "XX" }))).toBeNull();
    expect(countryOf(new Headers({}))).toBeNull();
  });
  it("accepts simple utm_source values only", () => {
    expect(cleanUtm("Instagram")).toBe("instagram");
    expect(cleanUtm("<script>")).toBeNull();
    expect(cleanUtm(42)).toBeNull();
  });
});
