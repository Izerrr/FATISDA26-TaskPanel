import { describe, expect, it } from "vitest";
import { formatWibShort, getWibParts, parseWibDateInput, toWibInputValue, wibDate } from "../datetime";

describe("datetime (WIB)", () => {
  it("parses datetime-local input as WIB, not server-local", () => {
    expect(parseWibDateInput("2026-10-05T23:59")?.toISOString()).toBe("2026-10-05T16:59:00.000Z");
  });

  it("treats date-only input as end of day WIB", () => {
    expect(parseWibDateInput("2026-10-05")?.toISOString()).toBe("2026-10-05T16:59:00.000Z");
  });

  it("keeps explicit offsets untouched and rejects junk", () => {
    expect(parseWibDateInput("2026-10-05T10:00:00Z")?.toISOString()).toBe("2026-10-05T10:00:00.000Z");
    expect(parseWibDateInput("besok")).toBeNull();
    expect(parseWibDateInput("")).toBeNull();
    expect(parseWibDateInput(null)).toBeNull();
  });

  it("round-trips through the input value", () => {
    const iso = "2026-10-05T16:59:00.000Z";
    expect(toWibInputValue(iso)).toBe("2026-10-05T23:59");
    expect(parseWibDateInput(toWibInputValue(iso))?.toISOString()).toBe(iso);
  });

  it("reads weekday/time in WIB across the UTC date boundary", () => {
    // Minggu 4 Okt 2026 20:30 UTC = Senin 5 Okt 03:30 WIB
    const p = getWibParts(new Date("2026-10-04T20:30:00Z"));
    expect(p).toMatchObject({ day: 5, weekday: 1, hours: 3, minutes: 30 });
  });

  it("wibDate rolls over month ends", () => {
    expect(wibDate(2026, 10, 32, 7, 0).toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("formats in WIB", () => {
    expect(formatWibShort("2026-10-05T16:59:00Z")).toMatch(/5 Okt.*23[.:]59/);
  });
});
