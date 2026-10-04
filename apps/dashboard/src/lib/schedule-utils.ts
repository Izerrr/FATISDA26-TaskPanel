import type { Schedule } from "@/types";
import { getWibMinutesOfDay, getWibWeekday } from "./datetime";

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

