import { prisma } from "@/lib/prisma";

import { fetchScheduleCsvByProdi, normalizeScheduleEntries, parseScheduleCsv, getScheduleSource } from "@/lib/schedule";

import type { Kelas, Prodi, ScheduleDay } from "@/lib/schedule/types";

const DAY_TO_NUMBER: Record<ScheduleDay, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export interface ScheduleSyncResult {
  prodi: Prodi;
  rawEntries: number;
  normalizedEntries: number;
  insertedEntries: number;
  syncedAt: Date;
}

export async function syncSchedule(prodi: Prodi): Promise<ScheduleSyncResult> {
  const source = getScheduleSource(prodi);

  if (!source) {
    throw new Error(`Belum ada sumber jadwal untuk prodi ${prodi}.`);
  }

  const csv = await fetchScheduleCsvByProdi(prodi);

  const rawEntries = parseScheduleCsv(csv, prodi);

  const normalizedEntries = normalizeScheduleEntries(rawEntries);
  const seen = new Map<string, number>();

  for (const entry of normalizedEntries) {
    const key = [entry.prodi, entry.classCode, entry.semester, entry.day, entry.startTime, entry.endTime, entry.room, entry.courseName].join("|");

    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  const duplicates = Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({
      key,
      count,
    }));

  console.log("========== SCHEDULE DEBUG ==========");
  console.log("rawEntries:", rawEntries.length);
  console.log("normalizedEntries:", normalizedEntries.length);
  console.log("duplicate groups:", duplicates.length);
  console.log("duplicates:", duplicates);
  console.log("====================================");

  const databaseEntries = normalizedEntries.filter(
    (
      entry,
    ): entry is typeof entry & {
      startTime: string;
      endTime: string;
      semester: number;
      classCode: NonNullable<typeof entry.classCode>;
    } => entry.startTime !== null && entry.endTime !== null && entry.semester !== null && entry.classCode !== null,
  );

  console.log(
    "NO TIME:",
    normalizedEntries.filter((entry) => entry.startTime === null || entry.endTime === null || entry.semester === null || entry.classCode === null),
  );

  const syncedAt = new Date();

  await prisma.$transaction(async (tx) => {
    /*
     * Google Sheets adalah source of truth.
     * Jadwal lama untuk prodi ini dibersihkan
     * sebelum data terbaru dimasukkan.
     */
    await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtext(${prodi}))
    `;
    await tx.schedule.deleteMany({
      where: {
        prodi,
      },
    });

    console.log("[SCHEDULE SYNC]", prodi, "raw:", rawEntries.length, "normalized:", normalizedEntries.length);

    const seen = new Map<string, number>();

    for (const entry of normalizedEntries) {
      const key = [entry.prodi, entry.classCode, entry.semester, entry.day, entry.startTime, entry.endTime, entry.room, entry.courseName].join("|");

      seen.set(key, (seen.get(key) ?? 0) + 1);
    }

    const duplicates = Array.from(seen.entries())
      .filter(([, count]) => count > 1)
      .map(([key, count]) => ({ key, count }));

    /*
     * Cari entitas Course yang sudah terdaftar untuk prodi ini
     * agar jadwal otomatis terhubung ke detail matkul.
     */
    const existingCourses = await tx.course.findMany({
      where: {
        prodi,
      },
      select: {
        id: true,
        name: true,
        code: true,
        kelas: true,
      },
    });

    function findMatchingCourseId(courseName: string, classCode: string): string | null {
      const normalizedTarget = courseName.trim().toLowerCase();

      // Coba cari yang cocok nama dan kelasnya (jika course punya spesifikasi kelas)
      const exactMatch = existingCourses.find((c) => c.name.trim().toLowerCase() === normalizedTarget && (c.kelas === null || c.kelas === classCode));

      if (exactMatch) {
        return exactMatch.id;
      }

      // Fallback: cari yang cocok namanya saja
      const nameMatch = existingCourses.find((c) => c.name.trim().toLowerCase() === normalizedTarget);

      return nameMatch ? nameMatch.id : null;
    }

    if (databaseEntries.length > 0) {
      // Pengecualian untuk mata kuliah 1 angkatan (semua kelas), contoh: Olahraga dan Agama non-Islam (Kristen, Katholik, Budha)
      // Catatan: MKU seperti PAI, Bahasa Indonesia, dan Pancasila memiliki kode rombel A1, A2, B1, B2
      // yang dipetakan secara ketat ke kelas masing-masing (A1->A, A2->B, B1->C, B2->D).
      const ALL_KELAS: Kelas[] = ["A", "B", "C", "D"];
      const recordsToInsert = [];

      for (const entry of databaseEntries) {
        const isMkuClass = entry.rawClassCode ? /^[AB][12]$/i.test(entry.rawClassCode) : false;
        const isNonIslamReligion = entry.courseName.toLowerCase().includes("agama") && !entry.courseName.toLowerCase().includes("islam");
        const isBatchWide = !isMkuClass && (/olahraga/i.test(entry.courseName) || isNonIslamReligion);

        if (isBatchWide) {
          for (const k of ALL_KELAS) {
            recordsToInsert.push({
              prodi: entry.prodi,
              kelas: k,
              semester: entry.semester,
              courseName: entry.courseName,
              courseId: findMatchingCourseId(entry.courseName, k),
              day: DAY_TO_NUMBER[entry.day],
              startTime: entry.startTime,
              endTime: entry.endTime,
              room: entry.room || null,
              lecturer: entry.lecturer,
              rawClassCode: entry.rawClassCode || null,
              markers: entry.markers,
              sourceSlots: entry.sourceSlots,
            });
          }
        } else {
          recordsToInsert.push({
            prodi: entry.prodi,
            kelas: entry.classCode,
            semester: entry.semester,
            courseName: entry.courseName,
            courseId: findMatchingCourseId(entry.courseName, entry.classCode),
            day: DAY_TO_NUMBER[entry.day],
            startTime: entry.startTime,
            endTime: entry.endTime,
            room: entry.room || null,
            lecturer: entry.lecturer,
            rawClassCode: entry.rawClassCode || null,
            markers: entry.markers,
            sourceSlots: entry.sourceSlots,
          });
        }
      }

      // Deduplikasi sebelum insert agar tidak ada duplikasi record
      const deduplicatedRecords = [];
      const insertSeen = new Set<string>();

      for (const record of recordsToInsert) {
        const key = [record.prodi, record.kelas, record.semester, record.day, record.startTime, record.endTime, record.room ?? "", record.courseName.toLowerCase().trim()].join("|");

        if (!insertSeen.has(key)) {
          insertSeen.add(key);
          deduplicatedRecords.push(record);
        }
      }

      await tx.schedule.createMany({
        data: deduplicatedRecords,
      });
    }

    await tx.scheduleSync.upsert({
      where: {
        prodi_spreadsheetId_sheetGid: {
          prodi,
          spreadsheetId: source.spreadsheetId,
          sheetGid: source.gid,
        },
      },

      create: {
        prodi,
        spreadsheetId: source.spreadsheetId,
        sheetGid: source.gid,
        sheetName: source.label,

        rawEntries: rawEntries.length,
        normalizedEntries: normalizedEntries.length,

        lastSyncedAt: syncedAt,
      },

      update: {
        sheetName: source.label,

        rawEntries: rawEntries.length,
        normalizedEntries: normalizedEntries.length,

        lastSyncedAt: syncedAt,
      },
    });
  });

  return {
    prodi,
    rawEntries: rawEntries.length,
    normalizedEntries: normalizedEntries.length,
    insertedEntries: databaseEntries.length,
    syncedAt,
  };
}
