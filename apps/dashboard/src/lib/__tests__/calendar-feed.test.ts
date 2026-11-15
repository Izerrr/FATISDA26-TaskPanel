import { describe, expect, it } from "vitest";
import { buildCalendarFeedIcs, escapeIcsText, generateCalendarFeedToken } from "../calendar-feed";

describe("calendar-feed", () => {
  it("generates a 48-char hex feed token", () => {
    const tokenA = generateCalendarFeedToken();
    const tokenB = generateCalendarFeedToken();
    expect(tokenA).toMatch(/^[a-f0-9]{48}$/);
    expect(tokenB).toMatch(/^[a-f0-9]{48}$/);
    expect(tokenA).not.toBe(tokenB);
  });

  it("escapes RFC-5545 reserved characters and newlines", () => {
    expect(escapeIcsText("Algoritma; Struktur, Data\\Lanjut\nBaris 2")).toBe(
      "Algoritma\\; Struktur\\, Data\\\\Lanjut\\nBaris 2"
    );
  });

  it("emits valid CRLF RFC-5545 feed containing schedules, open tasks, and exams while excluding DONE tasks", () => {
    const ics = buildCalendarFeedIcs({
      prodi: "INFORMATIKA",
      kelas: "A",
      now: new Date("2026-10-01T00:00:00Z"),
      schedules: [
        {
          id: "sched-1",
          courseName: "Pemrograman Web",
          day: 1,
          startTime: "08:00",
          endTime: "09:40",
          room: "Lab 1",
          lecturer: "Dr. Budi",
          rawClassCode: "IF26-A",
        },
      ],
      tasks: [
        {
          id: "task-open",
          title: "Laporan Praktikum; Modul 1",
          courseName: "Pemrograman Web",
          description: "Upload PDF ke LMS",
          status: "TODO",
          scope: "PERSONAL",
          dueDate: "2026-10-15T16:59:00.000Z", // 23:59 WIB
        },
        {
          id: "task-done",
          title: "Tugas Selesai",
          courseName: "Kalkulus",
          description: null,
          status: "DONE",
          scope: "CLASS",
          dueDate: "2026-10-10T10:00:00.000Z",
        },
      ],
      exams: [
        {
          id: "exam-1",
          type: "UTS",
          courseName: "Pemrograman Web",
          date: "2026-10-20T00:00:00.000Z", // Oct 20 07:00 WIB
          startTime: "08:30",
          endTime: "10:00",
          room: "R.402",
        },
      ],
    });

    expect(ics).toContain("\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("X-WR-TIMEZONE:Asia/Jakarta");
    expect(ics).toContain("UID:schedule-sched-1@fatisda.uns.ac.id");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=");
    expect(ics).toContain("UID:task-task-open@fatisda.uns.ac.id");
    expect(ics).toContain("SUMMARY:[Tugas] Laporan Praktikum\\; Modul 1");
    expect(ics).toContain("DTSTART;TZID=Asia/Jakarta:20261015T225900");
    expect(ics).toContain("DTEND;TZID=Asia/Jakarta:20261015T235900");
    expect(ics).not.toContain("UID:task-task-done@fatisda.uns.ac.id");
    expect(ics).toContain("UID:exam-exam-1@fatisda.uns.ac.id");
    expect(ics).toContain("SUMMARY:[UTS] Pemrograman Web");
    expect(ics).toContain("DTSTART;TZID=Asia/Jakarta:20261020T083000");
    expect(ics).toContain("DTEND;TZID=Asia/Jakarta:20261020T100000");
  });
});
