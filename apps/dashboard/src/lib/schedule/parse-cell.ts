import type { Kelas, Prodi } from "@/types";
import { CLASS_MAPPING, IGNORED_CELL_PREFIXES, MARKERS_BY_PRODI } from "./constants";

export interface ParsedCell {
  courseName: string;
  semester: number;
  rawClassCode: string | null;
  classCode: Kelas | null;
  markers: string[];
  lecturer: string | null;
}

function isIgnoredCell(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return IGNORED_CELL_PREFIXES.some((prefix) => normalized.startsWith(prefix.toLowerCase()));
}

export function normalizeClassCode(rawClassCode: string): Kelas | null {
  const normalized = rawClassCode.trim().toUpperCase();

  const mapping: Record<string, Kelas> = {
    ...CLASS_MAPPING,
  };

  return mapping[normalized] ?? null;
}

function isKnownMarker(value: string, prodi: Prodi): boolean {
  return MARKERS_BY_PRODI[prodi].some((marker) => marker.toLowerCase() === value.toLowerCase());
}

function isMkuCode(value: string): boolean {
  return /^[AB][12]$/i.test(value);
}

function extractParenthesizedTokens(value: string): string[] {
  const matches = value.match(/\(([^)]+)\)/g);

  if (!matches) {
    return [];
  }

  return matches.map((match) => match.slice(1, -1).trim());
}

function isSemesterToken(value: string): boolean {
  return /^\d+$/.test(value);
}

function isClassToken(value: string): boolean {
  return normalizeClassCode(value) !== null;
}

export function parseScheduleCell(input: string, prodi: Prodi): ParsedCell | null {
  const value = input
    .replace(/\s*\*\s*/g, " * ")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) {
    return null;
  }

  if (isIgnoredCell(value)) {
    return null;
  }

  /*
   * Examples:
   *
   * Fisika (1) (B)
   * Bahasa Indonesia (1) (A2)
   * Pendidikan Agama Islam(1) (B2)
   * Sistem Digital (1) (A) P
   */
  const match = value.match(/^(.+?)\s*\((\d+)\)(?:\s*\(([A-Za-z0-9]+)\))?(?:\s+(.+))?$/);

  if (!match) {
    return null;
  }

  const parenthesizedTokens = extractParenthesizedTokens(value);

  const tokensAfterSemester = parenthesizedTokens.filter((token) => !isSemesterToken(token));

  const classToken = tokensAfterSemester.find(isClassToken);

  let courseName = match[1].trim().replace(/\s+/g, " ");

  if (/^sisdig$/i.test(courseName)) {
    courseName = "Sistem Digital";
  }

  const semester = Number(match[2]);

  const rawClassCode = classToken?.trim().toUpperCase() || null;

  const trailing = match[4]?.trim() || null;

  const lecturerText =
    trailing
      ?.replace(/\([^)]+\)/g, "")
      .replace(/\s+/g, " ")
      .trim() || null;

  let lecturer: string | null = null;

  const markers: string[] = [];

  if (lecturerText) {
    if (isKnownMarker(lecturerText, prodi)) {
      markers.push(lecturerText);
    } else {
      lecturer = lecturerText;
    }
  }

  return {
    courseName,
    semester,
    rawClassCode,
    classCode: rawClassCode ? normalizeClassCode(rawClassCode) : null,
    markers,
    lecturer,
  };
}
