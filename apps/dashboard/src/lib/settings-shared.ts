import type { Kelas, Prodi } from "@/types";
import { SCHEDULE_SOURCES, type ScheduleSource } from "./schedule/sources";
import { DEFAULT_EXAM_SOURCES, type ExamScheduleSource } from "./schedule/exam/constants";

export interface ExamModeSetting {
  enabled: boolean;
  activeType: "UTS" | "UAS";
  semesterLabel: string;
}

export interface ClassGroupSource {
  prodi: Prodi;
  kelas: Kelas;
  semester: number;
  spreadsheetId: string;
  gid: string;
  label: string;
}

export interface SourcesHistorySetting {
  scheduleSources: ScheduleSource[];
  examSources: ExamScheduleSource[];
  classGroupSources?: ClassGroupSource[];
  savedAt: string;
}

export const DEFAULT_EXAM_MODE: ExamModeSetting = {
  enabled: true,
  activeType: "UTS",
  semesterLabel: "Semester Genap 2025/2026",
};

export const DEFAULT_CLASS_GROUP_SOURCES: ClassGroupSource[] = [
  {
    prodi: "INFORMATIKA",
    kelas: "B",
    semester: 1,
    spreadsheetId: "1oQt6d9MvtLfzExhRikWJWpf9K4sKeKY5IzUlP1sMZ2Y",
    gid: "1897715766",
    label: "Class B Infor'26 - Teams",
  },
];

export const FULL_DEFAULT_EXAM_SOURCES: ExamScheduleSource[] = [
  ...DEFAULT_EXAM_SOURCES,
  {
    prodi: "INFORMATIKA",
    type: "UAS",
    spreadsheetId: "1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc",
    gid: "524464654",
    label: "UAS Informatika",
  },
  {
    prodi: "SAINS_DATA",
    type: "UTS",
    spreadsheetId: "1EYSnoXx4qwEs-g5_nrS-SFaGSYZY0e0I",
    gid: "0",
    label: "UTS Sains Data",
  },
  {
    prodi: "SAINS_DATA",
    type: "UAS",
    spreadsheetId: "1EYSnoXx4qwEs-g5_nrS-SFaGSYZY0e0I",
    gid: "0",
    label: "UAS Sains Data",
  },
  {
    prodi: "INFORMATIKA_PSDKU_KEBUMEN",
    type: "UTS",
    spreadsheetId: "1k4yHR8wfS2-4YkQlbAEpKNZDaXW4Dj3ZOKOYYNo0a1s",
    gid: "0",
    label: "UTS Informatika PSDKU Kebumen",
  },
  {
    prodi: "INFORMATIKA_PSDKU_KEBUMEN",
    type: "UAS",
    spreadsheetId: "1k4yHR8wfS2-4YkQlbAEpKNZDaXW4Dj3ZOKOYYNo0a1s",
    gid: "0",
    label: "UAS Informatika PSDKU Kebumen",
  },
];

export interface ParsedGoogleSheetUrl {
  spreadsheetId: string;
  gid: string;
  hasExplicitGid: boolean;
}

/**
 * Extracts spreadsheetId and gid from any Google Sheets link (edit, view, or export URL),
 * or returns null if the string is not a Google Sheets URL.
 */
export function parseGoogleSheetsUrl(input: string): ParsedGoogleSheetUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch || !idMatch[1]) {
    return null;
  }

  const spreadsheetId = idMatch[1];
  const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);

  return {
    spreadsheetId,
    gid: gidMatch?.[1] ?? "0",
    hasExplicitGid: Boolean(gidMatch?.[1]),
  };
}

export function buildGoogleSheetsEditUrl(spreadsheetId: string, gid: string): string {
  if (!spreadsheetId) return "";
  const cleanGid = gid || "0";
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${cleanGid}#gid=${cleanGid}`;
}

export { SCHEDULE_SOURCES };
export type { ScheduleSource, ExamScheduleSource };
