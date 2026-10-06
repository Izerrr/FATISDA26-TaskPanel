import type { Kelas, Prodi } from "@/types";

export const MKU_CLASS_MAPPING: Record<string, Kelas> = {
  A1: "A",
  A2: "B",
  B1: "C",
  B2: "D",
};

export interface ExamScheduleSource {
  prodi: Prodi;
  type: "UTS" | "UAS";
  spreadsheetId: string;
  gid: string;
  label: string;
}

export const DEFAULT_EXAM_SOURCES: ExamScheduleSource[] = [
  {
    prodi: "INFORMATIKA",
    type: "UTS",
    spreadsheetId: "1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc",
    gid: "524464654",
    label: "UTS Informatika Gasal 2026",
  },
];

export const CLEAN_EXAM_COURSE_NAMES: Record<string, string> = {
  "Statistika & Proba...": "Statistika & Probabilitas",
  "Pemrograman Berori...": "Pemrograman Berorientasi Objek",
  "Desain & Analisis ...": "Desain & Analisis Algoritma",
  "Interaksi Manusia ...": "Interaksi Manusia dan Komputer",
  "Pengolahan Citra D...": "Pengolahan Citra Digital",
  "Pengolahan Sinyal ...": "Pengolahan Sinyal Digital",
  "Kapita Selekta Ilm...": "Kapita Selekta Ilmu Komputer",
  "Kecerdasan Komputa...": "Kecerdasan Komputasional",
  "Wireless & Mobile ...": "Wireless & Mobile Computing",
};

export const SESSION_TIMES_NORMAL: Record<number, { start: string; end: string }> = {
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
  12: { start: "19:45", end: "20:35" },
};

export const SESSION_TIMES_FRIDAY: Record<number, { start: string; end: string }> = {
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
  11: { start: "19:25", end: "20:15" },
};

export const ID_MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  mei: "05",
  may: "05",
  jun: "06",
  jul: "07",
  agu: "08",
  agt: "08",
  aug: "08",
  sep: "09",
  okt: "10",
  oct: "10",
  nov: "11",
  des: "12",
  dec: "12",
};

