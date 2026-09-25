export const DAY_MAP = {
  Senin: "MONDAY",
  Selasa: "TUESDAY",
  Rabu: "WEDNESDAY",
  Kamis: "THURSDAY",
  Jumat: "FRIDAY",
} as const;

export type SourceDay = keyof typeof DAY_MAP;

export const CLASS_MAPPING = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",

  // MKU
  A1: "A",
  A2: "B",
  B1: "C",
  B2: "D",
} as const;

export const MARKERS_BY_PRODI = {
  INFORMATIKA: ["P"],
  SAINS_DATA: ["*", "MKWK"],
  INFORMATIKA_PSDKU_KEBUMEN: ["MKU"],
} as const;

export const IGNORED_CELL_PREFIXES = ["Digunakan S-1 Sains Data", "Digunakan S-1 Informatika", "Digunakan S-1", "Digunakan"];

export const SCHEDULE_HEADER_ROW = 3;

/**
 * Kolom timetable:
 *
 * 0  = Hari
 * 1  = Sesi
 * 2+ = Ruangan
 */
export const ROOM_START_COLUMN = 2;
export const ROOM_END_COLUMN = 12;

export const KNOWN_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;

export const DEFAULT_WEEKDAY_SESSION_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "07:30", end: "08:20" },
  2: { start: "08:25", end: "09:15" },
  3: { start: "09:20", end: "10:10" },
  4: { start: "10:15", end: "11:05" },
  5: { start: "11:10", end: "12:00" },
  6: { start: "13:00", end: "13:50" },
  7: { start: "13:55", end: "14:45" },
  8: { start: "15:30", end: "16:20" },
  9: { start: "16:25", end: "17:15" },
  10: { start: "18:00", end: "18:50" },
  11: { start: "18:55", end: "19:45" },
  12: { start: "19:50", end: "20:40" },
  13: { start: "20:45", end: "21:35" },
  14: { start: "21:40", end: "22:30" },
};

export const DEFAULT_FRIDAY_SESSION_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "07:30", end: "08:20" },
  2: { start: "08:25", end: "09:15" },
  3: { start: "09:20", end: "10:10" },
  4: { start: "10:15", end: "11:05" },
  5: { start: "13:00", end: "13:50" },
  6: { start: "13:55", end: "14:45" },
  7: { start: "15:30", end: "16:20" },
  8: { start: "16:25", end: "17:15" },
  9: { start: "18:00", end: "18:50" },
  10: { start: "18:55", end: "19:45" },
  11: { start: "19:50", end: "20:40" },
};
