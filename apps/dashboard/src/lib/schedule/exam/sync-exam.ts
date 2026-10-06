import https from "https";
import { prisma } from "@/lib/prisma";
import type { Prodi } from "@/types";
import { parseExamCsv } from "./parse-exam";
import { DEFAULT_EXAM_SOURCES } from "./constants";

export interface SyncExamOptions {
  prodi?: Prodi;
  examType?: "UTS" | "UAS";
  spreadsheetId?: string;
  gid?: string;
}

export interface SyncExamResult {
  prodi: Prodi;
  type: "UTS" | "UAS";
  totalCount: number;
  syncedAt: Date;
}

function fetchUrl(url: string, maxRedirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error("Terlalu banyak redirect saat mengambil Google Sheets."));
    }

    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchUrl(res.headers.location, maxRedirects - 1));
        }

        if (res.statusCode && res.statusCode !== 200) {
          return reject(new Error(`Gagal mengunduh spreadsheet. Status code: ${res.statusCode}`));
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", (err) => reject(err));
  });
}

export async function syncExamSchedule(options: SyncExamOptions = {}): Promise<SyncExamResult> {
  const prodi: Prodi = options.prodi ?? "INFORMATIKA";
  const examType: "UTS" | "UAS" = options.examType ?? "UTS";

  // Find source configuration
  const defaultSource = DEFAULT_EXAM_SOURCES.find((s) => s.prodi === prodi && s.type === examType);
  const spreadsheetId = options.spreadsheetId || defaultSource?.spreadsheetId || "1zLsq5rA_s5no2oMH_hhyek1XA_f-0Mpc";
  const gid = options.gid || defaultSource?.gid || "524464654";

  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

  console.log(`[ExamSync] Fetching ${examType} schedule from: ${exportUrl}`);
  const csvContent = await fetchUrl(exportUrl);

  const records = parseExamCsv(csvContent, prodi, examType);
  console.log(`[ExamSync] Parsed ${records.length} exam records for ${prodi} (${examType})`);

  if (records.length === 0) {
    throw new Error(`Tidak ada data jadwal ${examType} yang berhasil diekstrak dari spreadsheet.`);
  }

  const syncedAt = new Date();

  // Database transaction: wipe old records for (prodi, type) and insert new ones
  await prisma.$transaction(async (tx) => {
    await tx.examSchedule.deleteMany({
      where: {
        prodi,
        type: examType,
      },
    });

    await tx.examSchedule.createMany({
      data: records.map((rec) => ({
        type: rec.type,
        prodi: rec.prodi,
        semester: rec.semester,
        kelas: rec.kelas,
        courseName: rec.courseName,
        date: rec.date,
        dateStr: rec.dateStr,
        dayName: rec.dayName,
        dayNum: rec.dayNum,
        startTime: rec.startTime,
        endTime: rec.endTime,
        room: rec.room,
        rawText: rec.rawText,
        sourceSlots: rec.sourceSlots,
        createdAt: syncedAt,
        updatedAt: syncedAt,
      })),
    });
  });

  return {
    prodi,
    type: examType,
    totalCount: records.length,
    syncedAt,
  };
}

