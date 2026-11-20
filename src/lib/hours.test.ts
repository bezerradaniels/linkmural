import { describe, expect, it } from "vitest";
import { formatTime, localNow, openStatus } from "./hours";

// 2026-11-20 is a Friday. São Paulo is UTC-3 (no daylight saving).
const at = (iso: string) => new Date(`${iso}-03:00`);

const gym = {
  mon: [["06:00", "22:00"]],
  tue: [["06:00", "22:00"]],
  wed: [["06:00", "22:00"]],
  thu: [["06:00", "22:00"]],
  fri: [["06:00", "22:00"]],
  sat: [
    ["08:00", "12:00"],
    ["14:00", "18:00"],
  ],
};

describe("localNow", () => {
  it("uses São Paulo time regardless of the server time zone", () => {
    expect(localNow(new Date("2026-11-21T01:30:00Z"))).toEqual({
      day: 5,
      minutes: 22 * 60 + 30,
    });
  });
});

describe("formatTime", () => {
  it("formats hours the Brazilian way", () => {
    expect(formatTime(22 * 60)).toBe("22h");
    expect(formatTime(8 * 60 + 30)).toBe("8h30");
    expect(formatTime(0)).toBe("meia-noite");
  });
});

describe("openStatus", () => {
  it("is open with the closing time", () => {
    expect(openStatus(gym, at("2026-11-20T18:00:00"))).toEqual({
      open: true,
      label: "Aberto agora · até 22h",
    });
  });

  it("closes exactly at the closing time and points to the next opening", () => {
    expect(openStatus(gym, at("2026-11-20T22:00:00"))).toEqual({
      open: false,
      label: "Fechado · abre amanhã às 8h",
    });
  });

  it("handles a lunch break", () => {
    expect(openStatus(gym, at("2026-11-21T13:00:00"))?.label).toBe(
      "Fechado · abre hoje às 14h",
    );
    expect(openStatus(gym, at("2026-11-21T15:00:00"))?.label).toBe(
      "Aberto agora · até 18h",
    );
  });

  it("names the weekday when the next opening is further away", () => {
    // Saturday 19h → Sunday closed → Monday 6h.
    expect(openStatus(gym, at("2026-11-21T19:00:00"))?.label).toBe(
      "Fechado · abre seg às 6h",
    );
  });

  it("supports hours past midnight", () => {
    const bar = { fri: [["18:00", "02:00"]] };
    expect(openStatus(bar, at("2026-11-20T23:30:00"))?.label).toBe(
      "Aberto agora · até 2h",
    );
    expect(openStatus(bar, at("2026-11-21T01:00:00"))?.label).toBe(
      "Aberto agora · até 2h",
    );
    expect(openStatus(bar, at("2026-11-21T03:00:00"))?.label).toBe(
      "Fechado · abre sex às 18h",
    );
    const lateNight = { fri: [["20:00", "00:00"]] };
    expect(openStatus(lateNight, at("2026-11-20T21:00:00"))?.label).toBe(
      "Aberto agora · até meia-noite",
    );
  });

  it("returns null without usable hours", () => {
    expect(openStatus(null)).toBeNull();
    expect(openStatus({})).toBeNull();
    expect(openStatus({ mon: [["25:00", "26:00"]] })).toBeNull();
    expect(openStatus("seg a sex")).toBeNull();
  });
});
