import { describe, expect, it } from "vitest";
import { parseTaskNaturalLanguage } from "../ai-task-parser";
import { getNextCourseClassDueDate } from "../schedule-utils";
import type { Course, Schedule } from "@/types";

const MOCK_COURSES: Course[] = [
  { id: "c1", code: "INF101", name: "Fisika Dasar", prodi: "INFORMATIKA", kelas: "A", pjMatkulId: null },
  { id: "c2", code: "INF102", name: "Algoritma dan Pemrograman", prodi: "INFORMATIKA", kelas: "A", pjMatkulId: null },
  { id: "c3", code: "INF201", name: "Basis Data", prodi: "INFORMATIKA", kelas: "A", pjMatkulId: null },
];

describe("parseTaskNaturalLanguage", () => {
  // Sunday, 2026-11-15 10:00 WIB (03:00 UTC)
  const fixedNow = new Date("2026-11-15T03:00:00.000Z");

  it("maps group keywords to GROUP scope and class keywords to CLASS scope", () => {
    const groupRes = parseTaskNaturalLanguage("Tugas kelompok basis data besok jam 8 malam", MOCK_COURSES, fixedNow);
    expect(groupRes.scope).toBe("GROUP");
    expect(groupRes.courseId).toBe("c3");
    expect(groupRes.dueDate).toBe("2026-11-16T20:00");

    const classRes = parseTaskNaturalLanguage("Tugas kelas fisika krakatau rabu jam 10 pagi", MOCK_COURSES, fixedNow);
    expect(classRes.scope).toBe("CLASS");
    expect(classRes.courseId).toBe("c1");
    expect(classRes.dueDate).toBe("2026-11-18T10:00");
  });

  it("parses explicit Indonesian month dates and numeric dd/mm dates in WIB", () => {
    const monthRes = parseTaskNaturalLanguage("Presentasi basdat 20 nov jam 14.30", MOCK_COURSES, fixedNow);
    expect(monthRes.courseId).toBe("c3");
    expect(monthRes.dueDate).toBe("2026-11-20T14:30");
    expect(monthRes.title.toLowerCase()).not.toContain("20 nov");

    const slashRes = parseTaskNaturalLanguage("Laporan alpro 25/11 jam 23.59", MOCK_COURSES, fixedNow);
    expect(slashRes.courseId).toBe("c2");
    expect(slashRes.dueDate).toBe("2026-11-25T23:59");
  });

  it("parses tanggal/tgl day-of-month and rolls to next month when day passed", () => {
    const futureDay = parseTaskNaturalLanguage("Resume fisika tgl 28", MOCK_COURSES, fixedNow);
    expect(futureDay.dueDate).toBe("2026-11-28T23:59");

    const rolledDay = parseTaskNaturalLanguage("Resume fisika tanggal 5", MOCK_COURSES, fixedNow);
    expect(rolledDay.dueDate).toBe("2026-12-05T23:59");
  });
});

describe("getNextCourseClassDueDate", () => {
  const fixedNow = new Date("2026-11-15T03:00:00.000Z"); // Sunday 10:00 WIB

  const schedules: Schedule[] = [
    {
      id: "s1",
      prodi: "INFORMATIKA",
      kelas: "A",
      courseId: "c2",
      courseName: "Algoritma dan Pemrograman",
      day: 2, // Tuesday
      startTime: "09:30",
      endTime: "11:10",
      room: "B4-11",
      lecturer: null,
      course: { id: "c2", code: "INF102", name: "Algoritma dan Pemrograman" },
    },
    {
      id: "s2",
      prodi: "INFORMATIKA",
      kelas: "A",
      courseId: "c2",
      courseName: "Algoritma dan Pemrograman",
      day: 4, // Thursday
      startTime: "13:00",
      endTime: "14:40",
      room: "B4-11",
      lecturer: null,
      course: { id: "c2", code: "INF102", name: "Algoritma dan Pemrograman" },
    },
  ];

  it("picks earliest upcoming class session in WIB", () => {
    const res = getNextCourseClassDueDate(schedules, "c2", MOCK_COURSES, fixedNow);
    expect(res).toEqual({
      dueDateValue: "2026-11-17T09:30",
      dayLabel: "Selasa",
      startTime: "09:30",
    });
  });

  it("returns null when courseId has no matching schedule", () => {
    expect(getNextCourseClassDueDate(schedules, "unknown", MOCK_COURSES, fixedNow)).toBeNull();
  });
});
