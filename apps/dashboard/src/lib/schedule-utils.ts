import type { Schedule } from "@/types";

export interface ScheduleDayResult {
  day: number;
  schedules: Schedule[];
  isToday: boolean;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 7];

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function getTodayDay() {
  const day = new Date().getDay();

  return day === 0 ? 7 : day;
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

  const now = new Date();

  const today = getTodayDay();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

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
