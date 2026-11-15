import crypto from "crypto";
import { getWibParts, wibDate } from "./datetime";

const DAY_CODES: Record<number, string> = {
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
  7: "SU",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export interface CalendarFeedScheduleInput {
  id: string;
  courseName: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string | null;
  lecturer: string | null;
  rawClassCode: string | null;
}

export interface CalendarFeedTaskInput {
  id: string;
  title: string;
  courseName: string | null;
  description: string | null;
  status: string;
  scope: string;
  dueDate: Date | string | null;
}

export interface CalendarFeedExamInput {
  id: string;
  type: string;
  courseName: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface BuildCalendarFeedInput {
  schedules: CalendarFeedScheduleInput[];
  tasks: CalendarFeedTaskInput[];
  exams: CalendarFeedExamInput[];
  prodi?: string | null;
  kelas?: string | null;
  now?: Date;
}

export function generateCalendarFeedToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function parseHoursMinutes(timeStr: string): { hours: number; minutes: number } {
  const [rawH, rawM] = timeStr.split(/[:.]/);
  const hours = Number.parseInt(rawH || "0", 10);
  const minutes = Number.parseInt(rawM || "0", 10);
  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
}

function formatWibLocalStamp(date: Date): string {
  const p = getWibParts(date);
  return `${p.year}${pad2(p.month)}${pad2(p.day)}T${pad2(p.hours)}${pad2(p.minutes)}00`;
}

function formatUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

function getNearestWibDateForDay(targetDayNum: number, timeStr: string, referenceDate: Date): Date {
  const nowParts = getWibParts(referenceDate);
  const deltaDays = (targetDayNum - nowParts.weekday + 7) % 7;
  const { hours, minutes } = parseHoursMinutes(timeStr);
  return wibDate(nowParts.year, nowParts.month, nowParts.day + deltaDays, hours, minutes);
}

export function buildCalendarFeedIcs({
  schedules,
  tasks,
  exams,
  prodi,
  kelas,
  now = new Date(),
}: BuildCalendarFeedInput): string {
  const dtstamp = formatUtcStamp(now);
  const nowParts = getWibParts(now);
  const untilDate = wibDate(nowParts.year, nowParts.month + 4, nowParts.day, 23, 59);
  const untilStamp = formatUtcStamp(untilDate);
  const prodiLabel = (prodi || "INFORMATIKA").replace(/_/g, " ");
  const calName = kelas ? `FATISDA 2026 - ${prodiLabel} (${kelas})` : `FATISDA 2026 - ${prodiLabel}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FATISDA 2026//TaskPanel Live Feed v4.1//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    "X-WR-TIMEZONE:Asia/Jakarta",
    "REFRESH-INTERVAL;VALUE=DURATION:PT30M",
    "X-PUBLISHED-TTL:PT30M",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Jakarta",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:WIB",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  // 1. Recurring Class Schedules
  for (const sched of schedules) {
    const start = getNearestWibDateForDay(sched.day, sched.startTime, now);
    let end = getNearestWibDateForDay(sched.day, sched.endTime, now);
    if (end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 50 * 60 * 1000);
    }
    const dayCode = DAY_CODES[sched.day] || "MO";
    const summary = sched.rawClassCode ? `${sched.courseName} (${sched.rawClassCode})` : sched.courseName;
    const descParts = [
      sched.lecturer ? `Dosen: ${sched.lecturer}` : null,
      sched.room ? `Ruang: ${sched.room}` : null,
      "Disinkronkan otomatis dari FATISDA TaskPanel.",
    ].filter(Boolean);

    lines.push(
      "BEGIN:VEVENT",
      `UID:schedule-${sched.id}@fatisda.uns.ac.id`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Asia/Jakarta:${formatWibLocalStamp(start)}`,
      `DTEND;TZID=Asia/Jakarta:${formatWibLocalStamp(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilStamp}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `LOCATION:${escapeIcsText(sched.room || "Kampus FATISDA UNS")}`,
      `DESCRIPTION:${escapeIcsText(descParts.join("\n"))}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  // 2. Open Tasks with Due Dates
  for (const task of tasks) {
    if (!task.dueDate || task.status === "DONE") continue;
    const due = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) continue;

    const start = new Date(due.getTime() - 60 * 60 * 1000);
    const scopeLabel = task.scope === "GROUP" ? "Kelompok" : task.scope === "CLASS" ? "Kelas" : "Pribadi";
    const descParts = [
      task.courseName ? `Mata Kuliah: ${task.courseName}` : null,
      `Tipe: Tugas ${scopeLabel}`,
      task.description ? task.description.trim().slice(0, 300) : null,
    ].filter(Boolean);

    lines.push(
      "BEGIN:VEVENT",
      `UID:task-${task.id}@fatisda.uns.ac.id`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Asia/Jakarta:${formatWibLocalStamp(start)}`,
      `DTEND;TZID=Asia/Jakarta:${formatWibLocalStamp(due)}`,
      `SUMMARY:${escapeIcsText(`[Tugas] ${task.title}`)}`,
      `DESCRIPTION:${escapeIcsText(descParts.join("\n"))}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT60M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(`Pengingat: ${task.title}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  // 3. Exam Schedules (UTS / UAS)
  for (const exam of exams) {
    const rawDate = exam.date instanceof Date ? exam.date : new Date(exam.date);
    if (Number.isNaN(rawDate.getTime())) continue;

    const dateParts = getWibParts(rawDate);
    const startHm = parseHoursMinutes(exam.startTime);
    const endHm = parseHoursMinutes(exam.endTime);
    const startDate = wibDate(dateParts.year, dateParts.month, dateParts.day, startHm.hours, startHm.minutes);
    let endDate = wibDate(dateParts.year, dateParts.month, dateParts.day, endHm.hours, endHm.minutes);
    if (endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(startDate.getTime() + 90 * 60 * 1000);
    }

    lines.push(
      "BEGIN:VEVENT",
      `UID:exam-${exam.id}@fatisda.uns.ac.id`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Asia/Jakarta:${formatWibLocalStamp(startDate)}`,
      `DTEND;TZID=Asia/Jakarta:${formatWibLocalStamp(endDate)}`,
      `SUMMARY:${escapeIcsText(`[${exam.type}] ${exam.courseName}`)}`,
      `LOCATION:${escapeIcsText(exam.room || "Kampus FATISDA UNS")}`,
      `DESCRIPTION:${escapeIcsText(`Jadwal Ujian ${exam.type} - ${exam.courseName}`)}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT60M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(`Persiapan [${exam.type}] ${exam.courseName}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
