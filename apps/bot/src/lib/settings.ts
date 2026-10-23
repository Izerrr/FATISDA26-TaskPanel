import { prisma } from "./prisma.js";

export interface ExamModeConfig {
  enabled: boolean;
  activeType: "UTS" | "UAS";
  semesterLabel: string;
}

export const DEFAULT_EXAM_MODE: ExamModeConfig = {
  enabled: false,
  activeType: "UTS",
  semesterLabel: "Semester Ganjil 2026/2027",
};

/**
 * Membaca pengaturan Mode Ujian dari SystemSetting PostgreSQL.
 */
export async function getExamModeConfig(): Promise<ExamModeConfig> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: "exam_mode" },
    });
    if (!row?.value) return DEFAULT_EXAM_MODE;
    const parsed = JSON.parse(row.value);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_EXAM_MODE.enabled,
      activeType: parsed.activeType === "UAS" ? "UAS" : "UTS",
      semesterLabel:
        typeof parsed.semesterLabel === "string" && parsed.semesterLabel.trim()
          ? parsed.semesterLabel.trim()
          : DEFAULT_EXAM_MODE.semesterLabel,
    };
  } catch (err) {
    console.warn("[settings] Gagal membaca exam_mode dari database:", err);
    return DEFAULT_EXAM_MODE;
  }
}

/**
 * Mendeteksi semester aktif secara dinamis:
 * 1. Cek SystemSetting key "active_semester" jika di-set admin.
 * 2. Cek label pada SystemSetting "exam_mode".
 * 3. Fallback: Angkatan 2024 / semester berjalan (default 1 jika belum ditentukan).
 */
export async function getActiveSemester(userSemester?: number | null): Promise<number> {
  if (userSemester && userSemester >= 1 && userSemester <= 8) {
    return userSemester;
  }

  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: "active_semester" },
    });
    if (row?.value) {
      const parsed = parseInt(row.value.trim(), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
        return parsed;
      }
    }

    // Cek dari exam_mode jika ada angka semester (misal: "Semester 1", "Semester 3")
    const examMode = await getExamModeConfig();
    const semMatch = examMode.semesterLabel.match(/semester\s*(\d)/i);
    if (semMatch?.[1]) {
      const parsed = parseInt(semMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[settings] Gagal mendeteksi active_semester:", err);
  }

  // Fallback standar semester 1 (angkatan baru/aktif)
  return 1;
}

