/**
 * Semua waktu akademik FATISDA berjalan di WIB (Asia/Jakarta, UTC+7, tanpa DST).
 * Jangan pakai getHours()/getDay()/toLocale* tanpa timeZone: hasilnya ikut zona
 * waktu device/server (server production = UTC), sehingga meleset 7 jam.
 */
export const APP_TIME_ZONE = "Asia/Jakarta";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

export interface WibParts {
  year: number;
  month: number; // 1-12
  day: number;
  hours: number;
  minutes: number;
  /** 1 = Senin ... 7 = Minggu (sama dengan Schedule.day) */
  weekday: number;
}

export function getWibParts(date: Date = new Date()): WibParts {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
  const jsDay = shifted.getUTCDay();
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    weekday: jsDay === 0 ? 7 : jsDay,
  };
}

/** Bangun Date dari jam dinding WIB. Overflow (mis. day = 32) otomatis digulung. */
export function wibDate(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - WIB_OFFSET_MS);
}

export function getWibWeekday(date: Date = new Date()): number {
  return getWibParts(date).weekday;
}

export function getWibMinutesOfDay(date: Date = new Date()): number {
  const { hours, minutes } = getWibParts(date);
  return hours * 60 + minutes;
}

/** Date -> "YYYY-MM-DDTHH:mm" (WIB) untuk value <input type="datetime-local">. */
export function toWibInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const p = getWibParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hours)}:${pad(p.minutes)}`;
}

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse deadline dari client. String tanpa zona waktu dianggap WIB,
 * tanggal saja dianggap 23:59 WIB. Return null jika kosong/tidak valid.
 */
export function parseWibDateInput(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || !value.trim()) return null;

  const raw = value.trim();
  const normalized = LOCAL_DATETIME.test(raw) ? `${raw}+07:00` : DATE_ONLY.test(raw) ? `${raw}T23:59:00+07:00` : raw;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

type DateInput = string | Date | number;

function toDate(value: DateInput): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formatter id-ID yang selalu dikunci ke WIB. */
export function formatWib(value: DateInput, options: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  if (!date) return "Tanggal tidak valid";
  return new Intl.DateTimeFormat("id-ID", { ...options, timeZone: APP_TIME_ZONE }).format(date);
}

/** "5 Okt, 23.59" — tahun hanya muncul jika beda dengan tahun ini. */
export function formatWibShort(value: DateInput, withTime = true): string {
  const date = toDate(value);
  if (!date) return "Tanggal tidak valid";
  const sameYear = getWibParts(date).year === getWibParts().year;
  return formatWib(date, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** "5 menit lalu", "2 jam lalu", "kemarin", lalu fallback ke tanggal. */
export function formatRelativeWib(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return "";
  const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);

  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffMin < 24 * 60) return `${Math.floor(diffMin / 60)} jam lalu`;

  const today = getWibParts(now);
  const yesterday = getWibParts(wibDate(today.year, today.month, today.day - 1));
  const target = getWibParts(date);
  if (target.year === yesterday.year && target.month === yesterday.month && target.day === yesterday.day) {
    return `kemarin, ${formatWib(date, { hour: "2-digit", minute: "2-digit" })}`;
  }
  return formatWibShort(date);
}
