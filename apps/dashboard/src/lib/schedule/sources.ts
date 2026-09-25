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
  {
    prodi: "SAINS_DATA",
    spreadsheetId: "1EYSnoXx4qwEs-g5_nrS-SFaGSYZY0e0I",
    gid: "1045117836",
    label: "Jadwal Sains Data",
  },
  {
    prodi: "INFORMATIKA_PSDKU_KEBUMEN",
    spreadsheetId: "1k4yHR8wfS2-4YkQlbAEpKNZDaXW4Dj3ZOKOYYNo0a1s",
    gid: "583330215",
    label: "Jadwal Informatika PSDKU Kebumen",
  },
];

export function getScheduleSource(prodi: Prodi): ScheduleSource | null {
  // Support environment variable override
  const envId =
    process.env[`SCHEDULE_SPREADSHEET_ID_${prodi}`] || (prodi === "SAINS_DATA" ? process.env.SCHEDULE_SPREADSHEET_ID_SAINS_DATA : null) || (prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? process.env.SCHEDULE_SPREADSHEET_ID_PSDKU : null);

  const envGid =
    process.env[`SCHEDULE_SPREADSHEET_GID_${prodi}`] || (prodi === "SAINS_DATA" ? process.env.SCHEDULE_SPREADSHEET_GID_SAINS_DATA : null) || (prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? process.env.SCHEDULE_SPREADSHEET_GID_PSDKU : null);

  const defaultSource = SCHEDULE_SOURCES.find((source) => source.prodi === prodi);

  if (envId) {
    return {
      prodi,
      spreadsheetId: envId.trim(),
      gid: (envGid || defaultSource?.gid || "0").trim(),
      label: defaultSource?.label ?? `Jadwal ${prodi}`,
    };
  }

  return defaultSource ?? null;
}
