export const PRODI_VALUES = ["INFORMATIKA", "SAINS_DATA", "INFORMATIKA_PSDKU_KEBUMEN"] as const;

export type Prodi = (typeof PRODI_VALUES)[number];

export const KELAS_VALUES = ["A", "B", "C", "D", "E"] as const;

export type Kelas = (typeof KELAS_VALUES)[number];

export type ScheduleDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

export interface ParsedScheduleEntry {
  prodi: Prodi;

  day: ScheduleDay;

  session: number;

  startTime: string | null;
  endTime: string | null;

  room: string;

  rawValue: string;

  courseName: string;

  semester: number;

  rawClassCode: string;

  classCode: Kelas | null;

  marker: string | null;
}
