import type { TaskInitialPreset } from "@/components/kanban/NewTaskModal";
import { getWibParts, toWibInputValue, wibDate } from "./datetime";
import { normalizeSafeHttpUrl } from "./url-safety";

export interface VaultMatchSummary {
  courseId?: string | null;
  courseName: string;
  driveUrl?: string | null;
  modulUrl?: string | null;
  silabusUrl?: string | null;
}

export interface SafeExamMaterialLinks {
  courseId: string | null;
  driveUrl: string | null;
  modulUrl: string | null;
  silabusUrl: string | null;
}

export type ExamReadinessChecklistKey = "kisi" | "catatan" | "latihan";

export const EXAM_READINESS_STEPS: Array<{
  key: ExamReadinessChecklistKey;
  label: string;
}> = [
  { key: "kisi", label: "Kisi-kisi" },
  { key: "catatan", label: "Catatan" },
  { key: "latihan", label: "Latihan" },
];

export type ExamReadinessItemState = Record<ExamReadinessChecklistKey, boolean>;

export function normalizeExamCourseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findMatchingVaultForExam<T extends VaultMatchSummary>(
  vaults: T[],
  courseName: string
): T | null {
  const target = normalizeExamCourseName(courseName);
  if (!target || vaults.length === 0) return null;

  const exact = vaults.find((v) => normalizeExamCourseName(v.courseName) === target);
  if (exact) return exact;

  return (
    vaults.find((v) => {
      const candidate = normalizeExamCourseName(v.courseName);
      return Boolean(candidate) && (target.includes(candidate) || candidate.includes(target));
    }) ?? null
  );
}

export function getSafeExamMaterialLinks(
  vaults: VaultMatchSummary[],
  courseName: string
): SafeExamMaterialLinks {
  const match = findMatchingVaultForExam(vaults, courseName);
  if (!match) {
    return {
      courseId: null,
      driveUrl: null,
      modulUrl: null,
      silabusUrl: null,
    };
  }
  return {
    courseId: match.courseId ?? null,
    driveUrl: normalizeSafeHttpUrl(match.driveUrl),
    modulUrl: normalizeSafeHttpUrl(match.modulUrl),
    silabusUrl: normalizeSafeHttpUrl(match.silabusUrl),
  };
}

export function buildStudyTaskPresetForExam(exam: {
  type: string;
  courseName: string;
  date: Date | string;
  dayName: string;
  dateStr: string;
  startTime: string;
  endTime: string;
  room: string;
}): TaskInitialPreset {
  const rawDate = exam.date instanceof Date ? exam.date : new Date(exam.date);
  let dueDate = "";

  if (!Number.isNaN(rawDate.getTime())) {
    const parts = getWibParts(rawDate);
    // H-1 pukul 20:00 WIB sebagai target belajar selesai
    const targetDayBefore = wibDate(parts.year, parts.month, parts.day - 1, 20, 0);
    const [startH, startM] = exam.startTime.split(/[:.]/).map((s) => Number.parseInt(s, 10));
    const examStart = wibDate(
      parts.year,
      parts.month,
      parts.day,
      Number.isFinite(startH) ? startH : 8,
      Number.isFinite(startM) ? startM : 0
    );

    const now = Date.now();
    const chosen = targetDayBefore.getTime() > now ? targetDayBefore : examStart;
    dueDate = toWibInputValue(chosen);
  }

  return {
    scope: "PERSONAL",
    title: `Persiapan ${exam.type}: ${exam.courseName}`,
    description: `Target belajar ${exam.type} (${exam.dayName}, ${exam.dateStr}, ${exam.startTime}-${exam.endTime} WIB, Ruang ${exam.room}). Fokus kisi-kisi, ringkasan catatan, dan latihan soal.`,
    courseName: exam.courseName,
    dueDate,
  };
}
