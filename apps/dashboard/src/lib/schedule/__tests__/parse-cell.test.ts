import { describe, expect, it } from "vitest";
import { normalizeClassCode, parseScheduleCell } from "../parse-cell";

describe("parseScheduleCell", () => {
  it("parses standard course with semester and class correctly", () => {
    const result = parseScheduleCell("Fisika (1) (B)", "INFORMATIKA");

    expect(result).not.toBeNull();
    expect(result?.courseName).toBe("Fisika");
    expect(result?.semester).toBe(1);
    expect(result?.classCode).toBe("B");
    expect(result?.rawClassCode).toBe("B");
    expect(result?.lecturer).toBeNull();
  });

  it("parses MKU format with numerical suffix class like A2 or B2", () => {
    const result = parseScheduleCell("Bahasa Indonesia (1) (A2)", "INFORMATIKA");

    expect(result).not.toBeNull();
    expect(result?.courseName).toBe("Bahasa Indonesia");
    expect(result?.semester).toBe(1);
    expect(result?.classCode).toBe("B"); // A2 maps to Kelas B per CLASS_MAPPING
    expect(result?.rawClassCode).toBe("A2");
  });

  it("parses course with practical marker P and class A", () => {
    const result = parseScheduleCell("Sistem Digital (1) (A) P", "INFORMATIKA");

    expect(result).not.toBeNull();
    expect(result?.courseName).toBe("Sistem Digital");
    expect(result?.semester).toBe(1);
    expect(result?.classCode).toBe("A");
    expect(result?.markers).toContain("P");
  });

  it("parses course with lecturer name after class", () => {
    const result = parseScheduleCell("Pemrograman Web (2) (C) Dr. Budi", "INFORMATIKA");

    expect(result).not.toBeNull();
    expect(result?.courseName).toBe("Pemrograman Web");
    expect(result?.semester).toBe(2);
    expect(result?.classCode).toBe("C");
    expect(result?.lecturer).toBe("Dr. Budi");
  });

  it("returns null for empty strings or ignored headers", () => {
    expect(parseScheduleCell("", "INFORMATIKA")).toBeNull();
    expect(parseScheduleCell("   ", "INFORMATIKA")).toBeNull();
    expect(parseScheduleCell("ISTIRAHAT", "INFORMATIKA")).toBeNull();
    expect(parseScheduleCell("JUMAT BERSIH", "INFORMATIKA")).toBeNull();
  });
});

describe("normalizeClassCode", () => {
  it("maps valid letters to proper Kelas enum values", () => {
    expect(normalizeClassCode("A")).toBe("A");
    expect(normalizeClassCode("b")).toBe("B");
    expect(normalizeClassCode("C")).toBe("C");
    expect(normalizeClassCode("D")).toBe("D");
  });

  it("normalizes MKU combined classes per academic mapping", () => {
    expect(normalizeClassCode("A1")).toBe("A");
    expect(normalizeClassCode("A2")).toBe("B");
    expect(normalizeClassCode("B1")).toBe("C");
    expect(normalizeClassCode("B2")).toBe("D");
  });

  it("returns null for invalid class codes", () => {
    expect(normalizeClassCode("Z")).toBeNull();
    expect(normalizeClassCode("UNKNOWN")).toBeNull();
  });

  it("normalizes alias Sisdig to Sistem Digital", () => {
    const result = parseScheduleCell("Sisdig (1) (B)", "INFORMATIKA");
    expect(result).not.toBeNull();
    expect(result?.courseName).toBe("Sistem Digital");
    expect(result?.semester).toBe(1);
    expect(result?.classCode).toBe("B");
  });

  it("parses various Agama course formats accurately", () => {
    const islam = parseScheduleCell("Pendidikan Agama Islam(1) (B2)", "INFORMATIKA");
    expect(islam).not.toBeNull();
    expect(islam?.courseName).toBe("Pendidikan Agama Islam");
    expect(islam?.semester).toBe(1);
    expect(islam?.classCode).toBe("D"); // B2 -> D

    const kristen = parseScheduleCell("Pendidikan Agama Kristen(1) (A)", "INFORMATIKA");
    expect(kristen).not.toBeNull();
    expect(kristen?.courseName).toBe("Pendidikan Agama Kristen");
    expect(kristen?.semester).toBe(1);
    expect(kristen?.classCode).toBe("A");

    const katholik = parseScheduleCell("Pendidikan Agama Katholik(1) (A)", "INFORMATIKA");
    expect(katholik).not.toBeNull();
    expect(katholik?.courseName).toBe("Pendidikan Agama Katholik");
    expect(katholik?.semester).toBe(1);
    expect(katholik?.classCode).toBe("A");

    const budha = parseScheduleCell("Pendidikan Agama Budha (1) (A)", "INFORMATIKA");
    expect(budha).not.toBeNull();
    expect(budha?.courseName).toBe("Pendidikan Agama Budha");
    expect(budha?.semester).toBe(1);
    expect(budha?.classCode).toBe("A");
  });
});

describe("schedule-informatika.csv parsing verification", () => {
  it("verifies Wednesday Kelas B contains Sistem Digital at 10:15-12:00", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const { parseScheduleCsv } = await import("../parse-csv");
    const { normalizeScheduleEntries } = await import("../normalize");

    const csvPath = path.resolve(__dirname, "../../../../schedule-informatika.csv");
    const csv = fs.readFileSync(csvPath, "utf-8");
    const rawEntries = parseScheduleCsv(csv, "INFORMATIKA");
    const normalized = normalizeScheduleEntries(rawEntries);

    const wednesdayB = normalized.filter((e) => e.day === "WEDNESDAY" && e.classCode === "B" && e.semester === 1);
    const sisdigB = wednesdayB.find((e) => e.courseName.toLowerCase().includes("sistem digital"));

    expect(sisdigB).toBeDefined();
    expect(sisdigB?.startTime).toBe("10:15");
    expect(sisdigB?.endTime).toBe("12:00");
  });
});
