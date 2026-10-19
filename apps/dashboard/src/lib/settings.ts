import { prisma } from "@/lib/prisma";
import type { Prodi } from "@/types";
import {
  DEFAULT_EXAM_MODE,
  FULL_DEFAULT_EXAM_SOURCES,
  SCHEDULE_SOURCES,
  buildGoogleSheetsEditUrl,
  parseGoogleSheetsUrl,
  type ExamModeSetting,
  type ExamScheduleSource,
  type ParsedGoogleSheetUrl,
  type ScheduleSource,
  type SourcesHistorySetting,
} from "./settings-shared";

export {
  DEFAULT_EXAM_MODE,
  FULL_DEFAULT_EXAM_SOURCES,
  SCHEDULE_SOURCES,
  buildGoogleSheetsEditUrl,
  parseGoogleSheetsUrl,
};
export type {
  ExamModeSetting,
  ExamScheduleSource,
  ParsedGoogleSheetUrl,
  ScheduleSource,
  SourcesHistorySetting,
};

export async function getExamModeSetting(): Promise<ExamModeSetting> {
  try {
    const row = await (prisma as any).systemSetting.findUnique({
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
    console.warn("[settings] Failed to read exam_mode, using default:", err);
    return DEFAULT_EXAM_MODE;
  }
}

export async function getScheduleSourcesSetting(): Promise<ScheduleSource[]> {
  try {
    const row = await (prisma as any).systemSetting.findUnique({
      where: { key: "schedule_sources" },
    });
    if (!row?.value) return SCHEDULE_SOURCES;
    const parsed = JSON.parse(row.value) as ScheduleSource[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SCHEDULE_SOURCES;

    return SCHEDULE_SOURCES.map((def) => {
      const override = parsed.find((item) => item.prodi === def.prodi);
      if (!override || !override.spreadsheetId?.trim()) return def;
      return {
        prodi: def.prodi,
        spreadsheetId: override.spreadsheetId.trim(),
        gid: (override.gid || def.gid || "0").trim(),
        label: override.label?.trim() || def.label,
      };
    });
  } catch (err) {
    console.warn("[settings] Failed to read schedule_sources, using default:", err);
    return SCHEDULE_SOURCES;
  }
}

export async function getDynamicScheduleSource(prodi: Prodi): Promise<ScheduleSource | null> {
  const sources = await getScheduleSourcesSetting();
  return sources.find((s) => s.prodi === prodi) ?? null;
}

export async function getExamSourcesSetting(): Promise<ExamScheduleSource[]> {
  try {
    const row = await (prisma as any).systemSetting.findUnique({
      where: { key: "exam_sources" },
    });
    if (!row?.value) return FULL_DEFAULT_EXAM_SOURCES;
    const parsed = JSON.parse(row.value) as ExamScheduleSource[];
    if (!Array.isArray(parsed) || parsed.length === 0) return FULL_DEFAULT_EXAM_SOURCES;

    return FULL_DEFAULT_EXAM_SOURCES.map((def) => {
      const override = parsed.find((item) => item.prodi === def.prodi && item.type === def.type);
      if (!override || !override.spreadsheetId?.trim()) return def;
      return {
        prodi: def.prodi,
        type: def.type,
        spreadsheetId: override.spreadsheetId.trim(),
        gid: (override.gid || def.gid || "0").trim(),
        label: override.label?.trim() || def.label,
      };
    });
  } catch (err) {
    console.warn("[settings] Failed to read exam_sources, using default:", err);
    return FULL_DEFAULT_EXAM_SOURCES;
  }
}

export async function getDynamicExamSource(
  prodi: Prodi,
  examType: "UTS" | "UAS",
): Promise<ExamScheduleSource | null> {
  const sources = await getExamSourcesSetting();
  return sources.find((s) => s.prodi === prodi && s.type === examType) ?? null;
}

export async function getSourcesHistorySetting(): Promise<SourcesHistorySetting | null> {
  try {
    const row = await (prisma as any).systemSetting.findUnique({
      where: { key: "sources_history" },
    });
    if (!row?.value) return null;
    return JSON.parse(row.value) as SourcesHistorySetting;
  } catch {
    return null;
  }
}

export async function getAllAdminSettings() {
  const [examMode, scheduleSources, examSources, history] = await Promise.all([
    getExamModeSetting(),
    getScheduleSourcesSetting(),
    getExamSourcesSetting(),
    getSourcesHistorySetting(),
  ]);

  return {
    examMode,
    scheduleSources,
    examSources,
    history,
  };
}

export async function saveAdminSettings(
  payload: {
    examMode?: ExamModeSetting;
    scheduleSources?: ScheduleSource[];
    examSources?: ExamScheduleSource[];
  },
  userId?: string,
) {
  if (payload.scheduleSources || payload.examSources) {
    const [currentSchedule, currentExam] = await Promise.all([
      getScheduleSourcesSetting(),
      getExamSourcesSetting(),
    ]);

    const historySnapshot: SourcesHistorySetting = {
      scheduleSources: currentSchedule,
      examSources: currentExam,
      savedAt: new Date().toISOString(),
    };

    await (prisma as any).systemSetting.upsert({
      where: { key: "sources_history" },
      create: {
        key: "sources_history",
        value: JSON.stringify(historySnapshot),
        description: "Backup 1-step rollback konfigurasi Google Sheets",
        updatedById: userId ?? null,
      },
      update: {
        value: JSON.stringify(historySnapshot),
        updatedById: userId ?? null,
      },
    });
  }

  if (payload.examMode) {
    await (prisma as any).systemSetting.upsert({
      where: { key: "exam_mode" },
      create: {
        key: "exam_mode",
        value: JSON.stringify(payload.examMode),
        description: "Konfigurasi visibilitas dan tipe Mode Ujian di Overview",
        updatedById: userId ?? null,
      },
      update: {
        value: JSON.stringify(payload.examMode),
        updatedById: userId ?? null,
      },
    });
  }

  if (payload.scheduleSources) {
    await (prisma as any).systemSetting.upsert({
      where: { key: "schedule_sources" },
      create: {
        key: "schedule_sources",
        value: JSON.stringify(payload.scheduleSources),
        description: "Konfigurasi Google Sheets Jadwal Kuliah Reguler per Prodi",
        updatedById: userId ?? null,
      },
      update: {
        value: JSON.stringify(payload.scheduleSources),
        updatedById: userId ?? null,
      },
    });
  }

  if (payload.examSources) {
    await (prisma as any).systemSetting.upsert({
      where: { key: "exam_sources" },
      create: {
        key: "exam_sources",
        value: JSON.stringify(payload.examSources),
        description: "Konfigurasi Google Sheets Jadwal Ujian (UTS/UAS) per Prodi",
        updatedById: userId ?? null,
      },
      update: {
        value: JSON.stringify(payload.examSources),
        updatedById: userId ?? null,
      },
    });
  }

  return getAllAdminSettings();
}

export async function rollbackSourcesSetting(userId?: string) {
  const history = await getSourcesHistorySetting();
  if (!history) {
    throw new Error("Belum ada riwayat konfigurasi sebelumnya untuk dikembalikan.");
  }

  await Promise.all([
    (prisma as any).systemSetting.upsert({
      where: { key: "schedule_sources" },
      create: {
        key: "schedule_sources",
        value: JSON.stringify(history.scheduleSources),
        description: "Konfigurasi Google Sheets Jadwal Kuliah Reguler per Prodi (Restored)",
        updatedById: userId ?? null,
      },
      update: {
        value: JSON.stringify(history.scheduleSources),
        updatedById: userId ?? null,
      },
    }),
    (prisma as any).systemSetting.upsert({
      where: { key: "exam_sources" },
      create: {
        key: "exam_sources",
        value: JSON.stringify(history.examSources),
        description: "Konfigurasi Google Sheets Jadwal Ujian per Prodi (Restored)",
        updatedById: userId ?? null,
      },
      update: {
        value: JSON.stringify(history.examSources),
        updatedById: userId ?? null,
      },
    }),
  ]);

  return getAllAdminSettings();
}

