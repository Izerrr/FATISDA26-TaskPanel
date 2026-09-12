import { describe, expect, it } from "vitest";
import { normalizeScheduleEntries } from "../normalize";
import type { ParsedScheduleEntry } from "../types";

describe("normalizeScheduleEntries", () => {
  it("merges consecutive sessions into a single block with continuous start and end times", () => {
    const rawEntries: ParsedScheduleEntry[] = [
      {
        prodi: "INFORMATIKA",
        day: "MONDAY",
        session: 1,
        startTime: "07:30",
        endTime: "08:20",
        room: "Lab A",
        rawValue: "Algoritma Pemrograman (2) (A)",
        courseName: "Algoritma Pemrograman",
        semester: 2,
        classCode: "A",
        rawClassCode: "A",
        markers: [],
        lecturer: "Dosen 1",
      },
      {
        prodi: "INFORMATIKA",
        day: "MONDAY",
        session: 2,
        startTime: "08:20",
        endTime: "09:10",
        room: "Lab A",
        rawValue: "Algoritma Pemrograman (2) (A)",
        courseName: "Algoritma Pemrograman",
        semester: 2,
        classCode: "A",
        rawClassCode: "A",
        markers: [],
        lecturer: "Dosen 1",
      },
      {
        prodi: "INFORMATIKA",
        day: "MONDAY",
        session: 3,
        startTime: "09:10",
        endTime: "10:00",
        room: "Lab A",
        rawValue: "Algoritma Pemrograman (2) (A)",
        courseName: "Algoritma Pemrograman",
        semester: 2,
        classCode: "A",
        rawClassCode: "A",
        markers: [],
        lecturer: "Dosen 1",
      },
    ];

    const result = normalizeScheduleEntries(rawEntries);

    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe("07:30");
    expect(result[0].endTime).toBe("10:00");
    expect(result[0].sourceSlots).toEqual([1, 2, 3]);
  });

  it("does not merge disjoint sessions that have gaps in between", () => {
    const rawEntries: ParsedScheduleEntry[] = [
      {
        prodi: "INFORMATIKA",
        day: "TUESDAY",
        session: 1,
        startTime: "07:30",
        endTime: "08:20",
        room: "R.101",
        rawValue: "Kalkulus (2) (B)",
        courseName: "Kalkulus",
        semester: 2,
        classCode: "B",
        rawClassCode: "B",
        markers: [],
        lecturer: "Dosen 2",
      },
      {
        prodi: "INFORMATIKA",
        day: "TUESDAY",
        session: 3, // gap between session 1 and 3
        startTime: "09:10",
        endTime: "10:00",
        room: "R.101",
        rawValue: "Kalkulus (2) (B)",
        courseName: "Kalkulus",
        semester: 2,
        classCode: "B",
        rawClassCode: "B",
        markers: [],
        lecturer: "Dosen 2",
      },
    ];

    const result = normalizeScheduleEntries(rawEntries);

    expect(result).toHaveLength(2);
    expect(result[0].sourceSlots).toEqual([1]);
    expect(result[1].sourceSlots).toEqual([3]);
  });
});
