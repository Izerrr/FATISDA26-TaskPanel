import type { Prodi } from "./types";

export interface ScheduleSource {
  prodi: Prodi;
  spreadsheetId: string;
  gid: string;
  label: string;
}

export const SCHEDULE_SOURCES: ScheduleSource[] = [
  {
    prodi: "INFORMATIKA",
    spreadsheetId: "1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc",
    gid: "418762168",
    label: "Jadwal Informatika",
  },

  /**
   * Sains Data akan ditambahkan setelah
   * link spreadsheet resminya tersedia.
   */

  /**
   * Informatika PSDKU Kebumen juga belum
   * ditambahkan karena source spreadsheet
   * belum tersedia.
   */
];

export function getScheduleSource(prodi: Prodi): ScheduleSource | null {
  return SCHEDULE_SOURCES.find((source) => source.prodi === prodi) ?? null;
}
