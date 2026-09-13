import type { Schedule } from "@/types";

const DAY_MAP: Record<number, string> = {
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
  7: "SU",
};

/**
 * Format string waktu "07:30" ke Date object pada tanggal tertentu
 */
function parseTimeOnDate(baseDate: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Format Date ke format ICS: YYYYMMDDTHHMMSS
 */
function formatICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Menemukan tanggal terdekat dari hari tertentu (1 = Senin, ..., 7 = Minggu)
 */
function getNearestDateForDay(targetDay: number): Date {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  const diff = targetDay - currentDay;

  const result = new Date(now);
  result.setDate(now.getDate() + diff);
  return result;
}

/**
 * Generate berkas .ics (iCalendar RFC 5545) untuk kumpulan jadwal perkuliahan
 */
export function generateICS(
  schedules: Schedule[],
  options?: {
    alarmMinutes?: number;
    semesterUntilMonths?: number;
  },
): string {
  const alarmMinutes = options?.alarmMinutes ?? 15;
  const nowStr = formatICSDate(new Date()) + "Z";

  // Batas akhir semester aktif (kurang lebih 5 bulan ke depan)
  const untilDate = new Date();
  untilDate.setMonth(untilDate.getMonth() + (options?.semesterUntilMonths ?? 5));
  const untilStr = formatICSDate(untilDate) + "Z";

  const events = schedules.map((schedule) => {
    const courseName = schedule.course?.name || schedule.courseName || "Kuliah";
    const courseCode = schedule.course?.code ? `[${schedule.course.code}] ` : "";
    const summary = `${courseCode}${courseName}`;

    const baseDate = getNearestDateForDay(schedule.day);
    const startDate = parseTimeOnDate(baseDate, schedule.startTime);
    const endDate = parseTimeOnDate(baseDate, schedule.endTime);

    const startICS = formatICSDate(startDate);
    const endICS = formatICSDate(endDate);

    const description = [schedule.lecturer ? `Dosen: ${schedule.lecturer}` : "", schedule.room ? `Ruang: ${schedule.room}` : "", `Kelas: ${schedule.kelas} (${schedule.prodi})`, `Sync by TaskPanel FATISDA 2026`].filter(Boolean).join("\\n");

    const location = schedule.room ? schedule.room.replace(/,/g, "\\,") : "Kampus FATISDA UNS";
    const dayCode = DAY_MAP[schedule.day] || "MO";

    return [
      "BEGIN:VEVENT",
      `UID:fatisda-schedule-${schedule.id}@ftsduaenam.web.id`,
      `DTSTAMP:${nowStr}`,
      `DTSTART;TZID=Asia/Jakarta:${startICS}`,
      `DTEND;TZID=Asia/Jakarta:${endICS}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      `TRIGGER:-PT${alarmMinutes}M`,
      "ACTION:DISPLAY",
      `DESCRIPTION:Pengingat Kuliah ${summary}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FATISDA UNS//TaskPanel Calendar//ID", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Jadwal Kuliah FATISDA 2026", "X-WR-TIMEZONE:Asia/Jakarta", ...events, "END:VCALENDAR"].join(
    "\r\n",
  );
}

/**
 * Generate URL langsung untuk Google Calendar Event (1 mata kuliah berulang)
 */
export function getGoogleCalendarUrl(schedule: Schedule): string {
  const courseName = schedule.course?.name || schedule.courseName || "Kuliah";
  const courseCode = schedule.course?.code ? `[${schedule.course.code}] ` : "";
  const title = `${courseCode}${courseName}`;

  const baseDate = getNearestDateForDay(schedule.day);
  const startDate = parseTimeOnDate(baseDate, schedule.startTime);
  const endDate = parseTimeOnDate(baseDate, schedule.endTime);

  const startStr = formatICSDate(startDate);
  const endStr = formatICSDate(endDate);

  const untilDate = new Date();
  untilDate.setMonth(untilDate.getMonth() + 5);
  const untilStr = formatICSDate(untilDate) + "Z";

  const details = [
    schedule.lecturer ? `Dosen: ${schedule.lecturer}` : "",
    schedule.room ? `Ruangan: ${schedule.room}` : "",
    `Kelas: ${schedule.kelas} - ${schedule.prodi}`,
    `Sinkronisasi otomatis oleh FATISDA TaskPanel (https://taskpanel.ftsduaenam.web.id)`,
  ]
    .filter(Boolean)
    .join("\n");

  const location = schedule.room || "Kampus FATISDA UNS";
  const dayCode = DAY_MAP[schedule.day] || "MO";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStr}/${endStr}`,
    ctz: "Asia/Jakarta",
    details,
    location,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilStr}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Trigger download file di browser
 */
export function downloadFile(content: string, filename: string, mimeType = "text/calendar;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
