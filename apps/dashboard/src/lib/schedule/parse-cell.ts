import type { Kelas } from "@/types";
import { CLASS_MAPPING, IGNORED_CELL_PREFIXES } from "./constants";

export interface ParsedCell {
  courseName: string;
  semester: number;
  rawClassCode: string;
  classCode: Kelas | null;
  marker: string | null;
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

export function parseScheduleCell(input: string): ParsedCell | null {
  const value = input.replace(/\s+/g, " ").trim();

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
  const match = value.match(/^(.+?)\s*\((\d+)\)\s*\(([A-Za-z0-9]+)\)(?:\s+(.+))?$/);

  if (!match) {
    return null;
  }

  const courseName = match[1].trim().replace(/\s+/g, " ");

  const semester = Number(match[2]);

  const rawClassCode = match[3].trim().toUpperCase();

  const trailing = match[4]?.trim() || null;

  return {
    courseName,
    semester,
    rawClassCode,
    classCode: normalizeClassCode(rawClassCode),
    marker: trailing,
  };
}
