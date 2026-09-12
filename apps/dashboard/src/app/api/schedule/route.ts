import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prodi, Kelas } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScheduleSource, syncSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const STALE_AFTER_MS = 30 * 60 * 1000; // 30 menit

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        username: true,
        prodi: true,
        kelas: true,
        semester: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    /*
     * Baca parameter dari query URL jika disediakan (misal saat ganti tab semester di UI).
     * Fallback ke profil user di DB, dan fallback semester default ke 2.
     */
    const { searchParams } = new URL(request.url);
    const prodiParam = searchParams.get("prodi") as Prodi | null;
    const kelasParam = searchParams.get("kelas") as Kelas | null;
    const semesterParam = searchParams.get("semester");

    const prodi = prodiParam || user.prodi;
    const kelas = kelasParam || user.kelas;
    const parsedSemester = semesterParam ? parseInt(semesterParam, 10) : NaN;
    const semester = !Number.isNaN(parsedSemester) ? parsedSemester : (user.semester ?? 2);

    if (!prodi || !kelas) {
      return NextResponse.json({
        success: true,
        profile: {
          username: user.username,
          prodi,
          kelas,
          semester,
        },
        total: 0,
        entries: [],
        message: "Prodi atau kelas pengguna belum terdeteksi.",
      });
    }

    /*
     * Pastikan source spreadsheet untuk prodi ini tersedia.
     */
    const source = getScheduleSource(prodi);

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          error: `Belum ada sumber jadwal untuk prodi ${prodi}.`,
        },
        { status: 503 },
      );
    }

    /*
     * Cek kapan source terakhir disinkronkan.
     */
    const scheduleSync = await prisma.scheduleSync.findUnique({
      where: {
        prodi_spreadsheetId_sheetGid: {
          prodi,
          spreadsheetId: source.spreadsheetId,
          sheetGid: source.gid,
        },
      },
      select: {
        lastSyncedAt: true,
      },
    });

    const now = Date.now();

    const isStale = !scheduleSync || now - scheduleSync.lastSyncedAt.getTime() > STALE_AFTER_MS;

    /*
     * Kalau data belum pernah sync atau sudah >30 menit,
     * ambil versi terbaru dari Google Sheets.
     */
    if (isStale) {
      await syncSchedule(prodi);
    }

    /*
     * Ambil jadwal berdasarkan prodi, kelas, dan semester yang dipilih.
     */
    const schedules = await prisma.schedule.findMany({
      where: {
        prodi,
        kelas,
        semester,
      },
      orderBy: [
        {
          day: "asc",
        },
        {
          startTime: "asc",
        },
      ],
      select: {
        id: true,
        prodi: true,
        kelas: true,
        semester: true,
        courseId: true,
        courseName: true,
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        day: true,
        startTime: true,
        endTime: true,
        room: true,
        lecturer: true,
        rawClassCode: true,
        markers: true,
        sourceSlots: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        username: user.username,
        prodi,
        kelas,
        semester,
      },
      sync: {
        lastSyncedAt:
          (
            await prisma.scheduleSync.findUnique({
              where: {
                prodi_spreadsheetId_sheetGid: {
                  prodi,
                  spreadsheetId: source.spreadsheetId,
                  sheetGid: source.gid,
                },
              },
              select: {
                lastSyncedAt: true,
              },
            })
          )?.lastSyncedAt ?? null,
        staleBeforeMs: STALE_AFTER_MS,
      },
      total: schedules.length,
      entries: schedules,
    });
  } catch (error) {
    console.error("[GET /api/schedule]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal mengambil jadwal.",
      },
      { status: 500 },
    );
  }
}
