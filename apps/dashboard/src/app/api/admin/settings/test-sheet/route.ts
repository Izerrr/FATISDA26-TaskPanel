import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchGoogleSheetCsv } from "@/lib/schedule/exam/sync-exam";
import { parseExamCsv } from "@/lib/schedule/exam/parse-exam";
import { normalizeScheduleEntries, parseScheduleCsv } from "@/lib/schedule";
import type { Prodi } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Sesi login diperlukan." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    const isManager = Boolean(user?.roles.some((r) => ["ADMIN", "OWNER"].includes(r)));
    if (!isManager) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const spreadsheetId = String(body.spreadsheetId || "").trim();
    const gid = String(body.gid || "0").trim();
    const mode = body.mode === "exam" ? "exam" : "schedule";
    const prodi = (body.prodi || "INFORMATIKA") as Prodi;
    const examType = body.examType === "UAS" ? "UAS" : "UTS";

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: "Spreadsheet ID tidak boleh kosong." },
        { status: 400 },
      );
    }

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
    const csvContent = await fetchGoogleSheetCsv(exportUrl);

    if (!csvContent.trim()) {
      return NextResponse.json(
        { success: false, error: "Spreadsheet merespons dengan file CSV kosong." },
        { status: 400 },
      );
    }

    if (/<!doctype html>|<html/i.test(csvContent.slice(0, 300))) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Spreadsheet tidak dapat diakses publik (merespons halaman login HTML). Pastikan akses diset ke 'Anyone with the link can view'.",
        },
        { status: 400 },
      );
    }

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let parsedCount = 0;

    if (mode === "exam") {
      const records = parseExamCsv(csvContent, prodi, examType);
      parsedCount = records.length;
    } else {
      const raw = parseScheduleCsv(csvContent, prodi);
      const normalized = normalizeScheduleEntries(raw);
      parsedCount = normalized.length;
    }

    return NextResponse.json({
      success: true,
      lineCount: lines.length,
      parsedCount,
      message:
        parsedCount > 0
          ? `Koneksi valid! Berhasil membaca ${lines.length} baris CSV (${parsedCount} sesi terdeteksi).`
          : `Koneksi CSV berhasil (${lines.length} baris), namun format kolom menghasilkan 0 sesi jadwal. Pastikan GID tab sudah tepat.`,
    });
  } catch (error) {
    console.error("[POST /api/admin/settings/test-sheet]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal menguji koneksi ke Google Sheets.",
      },
      { status: 500 },
    );
  }
}

