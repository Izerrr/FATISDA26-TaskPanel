import { prisma } from "@/lib/prisma";
import type { Kelas, Prodi } from "@/types";
import {
  DEFAULT_CLASS_GROUP_SOURCES,
  DEFAULT_EXAM_MODE,
  FULL_DEFAULT_EXAM_SOURCES,
  SCHEDULE_SOURCES,
  buildGoogleSheetsEditUrl,
  parseGoogleSheetsUrl,
  type ClassGroupSource,
  type ExamModeSetting,
  type ExamScheduleSource,
  type ParsedGoogleSheetUrl,
  type ScheduleSource,
  type SourcesHistorySetting,
} from "./settings-shared";

export {
  DEFAULT_CLASS_GROUP_SOURCES,
  DEFAULT_EXAM_MODE,
  FULL_DEFAULT_EXAM_SOURCES,
  SCHEDULE_SOURCES,
  buildGoogleSheetsEditUrl,
  parseGoogleSheetsUrl,
};
export type {
  ClassGroupSource,
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

export async function getClassGroupSourcesSetting(): Promise<ClassGroupSource[]> {
  try {
    const row = await (prisma as any).systemSetting.findUnique({
      where: { key: "class_group_sources" },
    });
    if (!row?.value) return DEFAULT_CLASS_GROUP_SOURCES;
    const parsed = JSON.parse(row.value) as ClassGroupSource[];
    if (!Array.isArray(parsed)) return DEFAULT_CLASS_GROUP_SOURCES;

    // Merge defaults (like Class B Infor'26) if not explicitly overridden
    const merged: ClassGroupSource[] = [...parsed.filter((s) => s.spreadsheetId?.trim())];
    for (const def of DEFAULT_CLASS_GROUP_SOURCES) {
      const exists = merged.some(
        (m) => m.prodi === def.prodi && m.kelas === def.kelas && m.semester === def.semester,
      );
      if (!exists) {
        merged.push(def);
      }
    }
    return merged;
  } catch (err) {
    console.warn("[settings] Failed to read class_group_sources, using default:", err);
    return DEFAULT_CLASS_GROUP_SOURCES;
  }
}

export async function getDynamicClassGroupSource(
  prodi: Prodi,
  kelas: Kelas,
  semester: number,
): Promise<ClassGroupSource | null> {
  const sources = await getClassGroupSourcesSetting();
  return (
    sources.find((s) => s.prodi === prodi && s.kelas === kelas && s.semester === semester) ?? null
  );
}

export async function upsertClassGroupSource(
  entry: ClassGroupSource,
  userId?: string,
): Promise<ClassGroupSource[]> {
  const current = await getClassGroupSourcesSetting();
  const next = current.filter(
    (s) => !(s.prodi === entry.prodi && s.kelas === entry.kelas && s.semester === entry.semester),
  );
  if (entry.spreadsheetId.trim()) {
    next.push({
      prodi: entry.prodi,
      kelas: entry.kelas,
      semester: entry.semester,
      spreadsheetId: entry.spreadsheetId.trim(),
      gid: (entry.gid || "0").trim(),
      label: entry.label?.trim() || `${entry.prodi} Kelas ${entry.kelas} (Semester ${entry.semester})`,
    });
  }

  await (prisma as any).systemSetting.upsert({
    where: { key: "class_group_sources" },
    create: {
      key: "class_group_sources",
      value: JSON.stringify(next),
      description: "Konfigurasi Google Sheets Kelompok Kelas per Prodi, Kelas & Semester",
      updatedById: userId ?? null,
    },
    update: {
      value: JSON.stringify(next),
      updatedById: userId ?? null,
    },
  });

  return next;
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
  const [examMode, scheduleSources, examSources, classGroupSources, history] = await Promise.all([
    getExamModeSetting(),
    getScheduleSourcesSetting(),
    getExamSourcesSetting(),
    getClassGroupSourcesSetting(),
    getSourcesHistorySetting(),
  ]);

  return {
    examMode,
    scheduleSources,
    examSources,
    classGroupSources,
    history,
  };
}

export async function saveAdminSettings(
  payload: {
    examMode?: ExamModeSetting;
    scheduleSources?: ScheduleSource[];
    examSources?: ExamScheduleSource[];
    classGroupSources?: ClassGroupSource[];
  },
  userId?: string,
) {
  if (payload.scheduleSources || payload.examSources || payload.classGroupSources) {
    const [currentSchedule, currentExam, currentGroups] = await Promise.all([
      getScheduleSourcesSetting(),
      getExamSourcesSetting(),
      getClassGroupSourcesSetting(),
    ]);

    const historySnapshot: SourcesHistorySetting = {
      scheduleSources: currentSchedule,
      examSources: currentExam,
      classGroupSources: currentGroups,
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

  if (payload.classGroupSources) {
    await (prisma as any).systemSetting.upsert({
      where: { key: "class_group_sources" },
      create: {
        key: "class_group_sources",
        value: JSON.stringify(payload.classGroupSources),
        description: "Konfigurasi Google Sheets Kelompok Kelas per Prodi, Kelas & Semester",
        updatedById: userId ?? null,
      },
      update: {
        value: JSON.stringify(payload.classGroupSources),
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

