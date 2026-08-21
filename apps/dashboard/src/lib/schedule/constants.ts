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

export const IGNORED_CELL_PREFIXES = ["Digunakan S-1 Sains Data"];

export const SCHEDULE_HEADER_ROW = 3;

/**
 * Kolom timetable:
 *
 * 0  = Hari
 * 1  = Sesi
 * 2+ = Ruangan
 *
 * Berdasarkan CSV saat ini, ruangan berada
 * pada kolom 2 sampai 12.
 */
export const ROOM_START_COLUMN = 2;
export const ROOM_END_COLUMN = 12;

/**
 * CSV punya banyak section setelah timetable.
 *
 * Kita tidak menggunakan fixed end row lagi.
 * Parser akan berhenti ketika sudah keluar
 * dari blok hari + sesi.
 */
export const KNOWN_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
