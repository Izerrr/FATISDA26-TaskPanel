import { describe, expect, it } from "vitest";

function normalizeStr(str?: string | null): string {
  return (str ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractWords(str?: string | null): string[] {
  return (str ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

describe("group members matching helper", () => {
  it("normalizes and compares names regardless of punctuation or spaces", () => {
    expect(normalizeStr("M. Rizky Pratama")).toBe("mrizkypratama");
    expect(normalizeStr("Muhammad Rizky")).toBe("muhammadrizky");
  });

  it("extracts significant words for fuzzy matching", () => {
    const words = extractWords("Budi Santoso S.Kom");
    expect(words).toEqual(["budi", "santoso", "kom"]);
  });
});
