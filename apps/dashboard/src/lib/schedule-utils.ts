import type { Course, Schedule } from "@/types";
import { getWibMinutesOfDay, getWibParts, getWibWeekday, toWibInputValue, wibDate } from "./datetime";

export interface ScheduleDayResult {
  day: number;
  schedules: Schedule[];
  isToday: boolean;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(/[:.]/).map(Number);

  return (hours || 0) * 60 + (minutes || 0);
}

export function getTodayDay() {
  return getWibWeekday();
}

export function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export function getNextSchedules(schedules: Schedule[]): ScheduleDayResult {
  if (schedules.length === 0) {
    return {
      day: getTodayDay(),
      schedules: [],
      isToday: true,
    };
  }

  const today = getTodayDay();

  const currentMinutes = getWibMinutesOfDay();

  const todaySchedules = sortSchedules(schedules.filter((schedule) => schedule.day === today));

  /*
   * Cari kelas hari ini yang belum selesai.
   */
  const remainingToday = todaySchedules.filter((schedule) => timeToMinutes(schedule.endTime) > currentMinutes);

  if (remainingToday.length > 0) {
    return {
      day: today,
      schedules: remainingToday,
      isToday: true,
    };
  }

  /*
   * Kalau hari ini sudah selesai,
   * cari hari kuliah berikutnya.
   */
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = ((today - 1 + offset) % 7) + 1;

    const nextSchedules = sortSchedules(schedules.filter((schedule) => schedule.day === nextDay));

    if (nextSchedules.length > 0) {
      return {
        day: nextDay,
        schedules: nextSchedules,
        isToday: false,
      };
    }
  }

  return {
    day: today,
    schedules: [],
    isToday: true,
  };
}

export function getDayLabel(day: number) {
  const labels: Record<number, string> = {
    1: "Senin",
    2: "Selasa",
    3: "Rabu",
    4: "Kamis",
    5: "Jumat",
    6: "Sabtu",
    7: "Minggu",
  };

  return labels[day] ?? "Hari";
}

export type LiveClassStatus =
  | { state: "ONGOING"; schedule: Schedule; minutesRemaining: number }
  | { state: "UPCOMING_SOON"; schedule: Schedule; minutesUntilStart: number }
  | { state: "DONE_FOR_DAY" }
  | { state: "NO_CLASS_TODAY" }
  | { state: "FUTURE_CLASS"; nextDayLabel: string; schedule: Schedule };

export function getCurrentLiveClassStatus(schedules: Schedule[]): LiveClassStatus {
  if (!schedules || schedules.length === 0) {
    return { state: "NO_CLASS_TODAY" };
  }

  const today = getTodayDay();
  const currentMinutes = getWibMinutesOfDay();

  const todaySchedules = sortSchedules(schedules.filter((s) => s.day === today));

  if (todaySchedules.length === 0) {
    const nextDayResult = getNextSchedules(schedules);
    if (nextDayResult.schedules.length > 0 && !nextDayResult.isToday) {
      return {
        state: "FUTURE_CLASS",
        nextDayLabel: getDayLabel(nextDayResult.day),
        schedule: nextDayResult.schedules[0],
      };
    }
    return { state: "NO_CLASS_TODAY" };
  }

  // 1. Cek apakah ada kuliah yang sedang berlangsung saat ini
  for (const s of todaySchedules) {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    if (currentMinutes >= start && currentMinutes < end) {
      return {
        state: "ONGOING",
        schedule: s,
        minutesRemaining: Math.max(1, end - currentMinutes),
      };
    }
  }

  // 2. Cek apakah ada kuliah berikutnya hari ini
  const upcomingToday = todaySchedules.filter((s) => timeToMinutes(s.startTime) > currentMinutes);
  if (upcomingToday.length > 0) {
    const nextClass = upcomingToday[0];
    const diff = timeToMinutes(nextClass.startTime) - currentMinutes;
    return {
      state: "UPCOMING_SOON",
      schedule: nextClass,
      minutesUntilStart: diff,
    };
  }

  // 3. Semua kuliah hari ini telah selesai
  return { state: "DONE_FOR_DAY" };
}

export interface NextCourseClassDue {
  dueDateValue: string;
  dayLabel: string;
  startTime: string;
}

/**
 * Hitung waktu mulai pertemuan kuliah berikutnya untuk mata kuliah yang dipilih
 * (format YYYY-MM-DDTHH:mm WIB untuk input datetime-local).
 */
export function getNextCourseClassDueDate(
  schedules: Schedule[],
  courseId: string,
  courses: Course[] = [],
  now: Date = new Date()
): NextCourseClassDue | null {
  if (!courseId || schedules.length === 0) return null;

  const matchedCourse = courses.find((c) => c.id === courseId);
  const schedPrefixName = courseId.startsWith("sched-")
    ? decodeURIComponent(courseId.replace(/^sched-/, "")).trim().toLowerCase()
    : null;
  const targetName = (matchedCourse?.name ?? schedPrefixName ?? "").trim().toLowerCase();

  const candidateSchedules = schedules.filter((s) => {
    if (s.courseId === courseId || s.course?.id === courseId) return true;
    const schedCourseName = (s.course?.name ?? s.courseName ?? "").trim().toLowerCase();
    return Boolean(targetName && schedCourseName && schedCourseName === targetName);
  });

  if (candidateSchedules.length === 0) return null;

  const wibNow = getWibParts(now);
  let earliestDate: Date | null = null;
  let earliestMeta: { day: number; startTime: string } | null = null;

  for (const s of candidateSchedules) {
    const [rawH, rawM] = s.startTime.split(/[:.]/).map(Number);
    const startH = Number.isFinite(rawH) ? rawH : 8;
    const startM = Number.isFinite(rawM) ? rawM : 0;

    for (let offset = 0; offset <= 7; offset++) {
      const candidateDay = ((wibNow.weekday - 1 + offset) % 7) + 1;
      if (candidateDay !== s.day) continue;

      const candidateDate = wibDate(wibNow.year, wibNow.month, wibNow.day + offset, startH, startM);
      if (candidateDate.getTime() <= now.getTime() + 5 * 60 * 1000) continue;

      if (!earliestDate || candidateDate.getTime() < earliestDate.getTime()) {
        earliestDate = candidateDate;
        earliestMeta = { day: s.day, startTime: s.startTime };
      }
      break;
    }
  }

  if (!earliestDate || !earliestMeta) return null;

  return {
    dueDateValue: toWibInputValue(earliestDate),
    dayLabel: getDayLabel(earliestMeta.day),
    startTime: earliestMeta.startTime,
  };
}


