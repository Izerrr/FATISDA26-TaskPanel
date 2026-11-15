import { describe, expect, it } from "vitest";
import { applySuggestionToVaultLinks, normalizeVaultSuggestionType } from "../vault-suggestions";

describe("vault-suggestions helpers", () => {
  it("normalizes suggestion types safely", () => {
    expect(normalizeVaultSuggestionType("drive")).toBe("DRIVE");
    expect(normalizeVaultSuggestionType("Modul")).toBe("MODUL");
    expect(normalizeVaultSuggestionType("SILABUS")).toBe("SILABUS");
    expect(normalizeVaultSuggestionType("unknown")).toBe("OTHER");
    expect(normalizeVaultSuggestionType(null)).toBe("OTHER");
  });

  it("assigns empty primary slot when approving DRIVE / MODUL / SILABUS suggestion", () => {
    const merged = applySuggestionToVaultLinks(
      { driveUrl: null, modulUrl: "https://modul.old/1", silabusUrl: null, extraLinks: [] },
      {
        id: "1",
        title: "Drive Slide Dosen",
        url: "https://drive.google.com/folder/abc",
        type: "DRIVE",
        description: "Materi pertemuan 1-7",
      },
    );

    expect(merged.driveUrl).toBe("https://drive.google.com/folder/abc");
    expect(merged.modulUrl).toBe("https://modul.old/1");
    expect(merged.extraLinks).toEqual([]);
  });

  it("appends to extraLinks without overwriting existing primary slot", () => {
    const merged = applySuggestionToVaultLinks(
      { driveUrl: "https://drive.google.com/existing", modulUrl: null, silabusUrl: null, extraLinks: [] },
      {
        id: "2",
        title: "Drive Cadangan UTS",
        url: "https://drive.google.com/extra",
        type: "DRIVE",
        description: "Soal tahun lalu",
      },
    );

    expect(merged.driveUrl).toBe("https://drive.google.com/existing");
    expect(merged.extraLinks).toEqual([
      {
        id: "sug-2",
        title: "Drive Cadangan UTS",
        url: "https://drive.google.com/extra",
        type: "DRIVE",
        description: "Soal tahun lalu",
      },
    ]);
  });

  it("deduplicates identical URLs when applying approved suggestion", () => {
    const merged = applySuggestionToVaultLinks(
      { driveUrl: "https://drive.google.com/same", modulUrl: null, silabusUrl: null, extraLinks: [] },
      {
        id: "3",
        title: "Duplicate",
        url: "https://drive.google.com/same",
        type: "OTHER",
      },
    );

    expect(merged.extraLinks).toEqual([]);
  });
});
