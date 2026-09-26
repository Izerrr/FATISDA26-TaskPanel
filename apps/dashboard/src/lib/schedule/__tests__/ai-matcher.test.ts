import { describe, expect, it } from "vitest";
import { analyzeScheduleAndFreeTime, parseQueryEntities } from "../ai-matcher";

describe("AI Schedule Matcher NLP Entity Parsing", () => {
  it("parses mutual classes from natural Indonesian queries", () => {
    const result1 = parseQueryEntities("kelas a sama kelas b freenya kapan", "INFORMATIKA");
    expect(result1.classes).toEqual(["A", "B"]);
    expect(result1.intent).toBe("MUTUAL_FREE_TIME");

    const result2 = parseQueryEntities("kapan kelas A dan B bisa rapat bareng?", "INFORMATIKA");
    expect(result2.classes).toEqual(["A", "B"]);
    expect(result2.intent).toBe("MUTUAL_FREE_TIME");
  });

  it("parses single class and semester queries", () => {
    const result = parseQueryEntities("kelas b smt 1 freenya kapan aja ya?", "INFORMATIKA");
    expect(result.classes).toEqual(["B"]);
    expect(result.semester).toBe(1);
    expect(result.intent).toBe("SINGLE_CLASS_FREE");
  });

  it("detects day keywords accurately", () => {
    const result = parseQueryEntities("cari jam kosong hari rabu kelas a dan b", "INFORMATIKA");
    expect(result.day).toBe("rabu");
    expect(result.classes).toEqual(["A", "B"]);
  });

  it("detects prodi keywords (Sains Data & PSDKU Kebumen)", () => {
    const sadat = parseQueryEntities("sadat kelas a freenya kapan", "INFORMATIKA");
    expect(sadat.prodi).toBe("SAINS_DATA");

    const psdku = parseQueryEntities("psdku kelas b freenya kapan", "INFORMATIKA");
    expect(psdku.prodi).toBe("INFORMATIKA_PSDKU_KEBUMEN");
  });
});

describe("AI Schedule Free-Time Calculation Engine", () => {
  const mockSchedules = [
    // Senin: Kelas A kuliah sesi 1-3 (07:30 - 10:10)
    {
      prodi: "INFORMATIKA" as const,
      kelas: "A",
      semester: 1,
      day: 1,
      startTime: "07:30",
      endTime: "10:10",
      sourceSlots: [1, 2, 3],
      courseName: "Matematika Diskrit",
    },
    // Senin: Kelas B kuliah sesi 4-5 (10:15 - 12:00)
    {
      prodi: "INFORMATIKA" as const,
      kelas: "B",
      semester: 1,
      day: 1,
      startTime: "10:15",
      endTime: "12:00",
      sourceSlots: [4, 5],
      courseName: "Dasar Pemrograman",
    },
  ];

  it("calculates mutual free slots where neither class has lectures", () => {
    const analysis = analyzeScheduleAndFreeTime("kapan kelas a dan b free bareng hari senin", mockSchedules, [], "INFORMATIKA", 1);

    expect(analysis.targetClasses).toEqual(["A", "B"]);
    expect(analysis.freeSlots.length).toBeGreaterThan(0);

    // Sesi 1-3 terisi Kelas A, Sesi 4-5 terisi Kelas B.
    // Maka sesi 6 ke atas (13:00 ke atas) harus FREE untuk kedua kelas!
    const afternoonFree = analysis.freeSlots.find((s) => s.dayNumber === 1 && s.startSession >= 6);
    expect(afternoonFree).toBeDefined();
    expect(afternoonFree?.classesFree).toEqual(["A", "B"]);
  });

  it("calculates individual class free slots for Kelas B", () => {
    const analysis = analyzeScheduleAndFreeTime("kelas b smt 1 freenya kapan aja ya?", mockSchedules, [], "INFORMATIKA", 1);

    expect(analysis.targetClasses).toEqual(["B"]);
    expect(analysis.freeSlots.length).toBeGreaterThan(0);

    // Kelas B kuliah di sesi 4-5, jadi sesi 1-3 pagi harus terdaftar sebagai free slot untuk Kelas B
    const morningFree = analysis.freeSlots.find((s) => s.dayNumber === 1 && s.startSession === 1);
    expect(morningFree).toBeDefined();
  });
});
