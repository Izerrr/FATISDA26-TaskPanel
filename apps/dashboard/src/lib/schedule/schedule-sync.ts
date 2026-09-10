import { prisma } from "@/lib/prisma";

import { fetchScheduleCsvByProdi, normalizeScheduleEntries, parseScheduleCsv, getScheduleSource } from "@/lib/schedule";

import type { Prodi, ScheduleDay } from "@/lib/schedule/types";

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

    console.log("[SCHEDULE DUPLICATES]", duplicates);

    if (databaseEntries.length > 0) {
      await tx.schedule.createMany({
        data: databaseEntries.map((entry) => ({
          prodi: entry.prodi,
          kelas: entry.classCode,

          semester: entry.semester,

          courseName: entry.courseName,
          courseId: null,

          day: DAY_TO_NUMBER[entry.day],

          startTime: entry.startTime,
          endTime: entry.endTime,

          room: entry.room || null,
          lecturer: entry.lecturer,

          rawClassCode: entry.rawClassCode || null,

          markers: entry.markers,
          sourceSlots: entry.sourceSlots,
        })),
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
