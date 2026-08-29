import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScheduleSource, syncSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const STALE_AFTER_MS = 30 * 60 * 1000; // 30 menit

export async function GET() {
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
     * Jadwal membutuhkan tiga identitas akademik:
     * - prodi
     * - kelas
     * - semester
     */
    if (!user.prodi || !user.kelas || !user.semester) {
      return NextResponse.json({
        success: true,
        profile: {
          username: user.username,
          prodi: user.prodi,
          kelas: user.kelas,
          semester: user.semester,
        },
        total: 0,
        entries: [],
        message: "Prodi, kelas, atau semester pengguna belum terdeteksi.",
      });
    }

    /*
     * Pastikan source spreadsheet untuk prodi ini tersedia.
     */
    const source = getScheduleSource(user.prodi);

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          error: `Belum ada sumber jadwal untuk prodi ${user.prodi}.`,
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
          prodi: user.prodi,
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
      await syncSchedule(user.prodi);
    }

    /*
     * Ambil hanya jadwal yang benar-benar milik
     * kombinasi akademik pengguna.
     */
    const schedules = await prisma.schedule.findMany({
      where: {
        prodi: user.prodi,
        kelas: user.kelas,
        semester: user.semester,
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
        prodi: user.prodi,
        kelas: user.kelas,
        semester: user.semester,
      },
      sync: {
        lastSyncedAt:
          (
            await prisma.scheduleSync.findUnique({
              where: {
                prodi_spreadsheetId_sheetGid: {
                  prodi: user.prodi,
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
