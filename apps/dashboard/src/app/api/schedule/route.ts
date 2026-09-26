import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prodi, Kelas } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScheduleSource, syncSchedule } from "@/lib/schedule";
import { OFFICIAL_PRODI_ROOMS } from "@/lib/schedule/constants";

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
     * Baca parameter dari query URL jika disediakan (misal saat ganti tab semester di UI atau grand spreadsheet).
     * Fallback ke profil user di DB, dan fallback semester default ke 1.
     */
    const { searchParams } = new URL(request.url);
    const rawProdi = searchParams.get("prodi");
    const rawKelas = searchParams.get("kelas");
    const semesterParam = searchParams.get("semester");
    const agamaParam = searchParams.get("agama");
    const isGrandMode = searchParams.get("mode") === "grand" || searchParams.get("all") === "true";

    const validProdis: Prodi[] = ["INFORMATIKA", "SAINS_DATA", "INFORMATIKA_PSDKU_KEBUMEN"];
    const validKelas: Kelas[] = ["A", "B", "C", "D", "E"];

    const prodiParam = rawProdi && validProdis.includes(rawProdi as Prodi) ? (rawProdi as Prodi) : null;
    const kelasParam = rawKelas && validKelas.includes(rawKelas as Kelas) ? (rawKelas as Kelas) : null;

    const prodi = prodiParam || user.prodi || "INFORMATIKA";
    const kelas = kelasParam || user.kelas;
    const parsedSemester = semesterParam ? parseInt(semesterParam, 10) : NaN;
    const semester = !Number.isNaN(parsedSemester) ? parsedSemester : (user.semester ?? 1);

    if (!isGrandMode && (!prodi || !kelas)) {
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
      const fallbackWhere: any = { prodi };
      if (!isGrandMode && kelas) fallbackWhere.kelas = kelas;
      if (!isGrandMode) fallbackWhere.semester = semester;

      const existingInDb = await prisma.schedule.findMany({
        where: fallbackWhere,
        include: { course: true },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      });

      return NextResponse.json({
        success: true,
        profile: { username: user.username, prodi, kelas, semester },
        total: existingInDb.length,
        entries: existingInDb,
        message: existingInDb.length === 0 ? `Sumber spreadsheet jadwal untuk prodi ${prodi.replace(/_/g, " ")} belum dikonfigurasi.` : undefined,
      });
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
     * ambil versi terbaru dari Google Sheets secara aman.
     */
    if (isStale) {
      try {
        await syncSchedule(prodi);
      } catch (syncErr) {
        console.warn(`[GET /api/schedule] Auto-sync background gagal untuk ${prodi}:`, syncErr);
      }
    }

    /*
     * Ambil jadwal berdasarkan prodi, kelas, dan semester yang dipilih.
     */
    const whereClause: any = { prodi };
    if (!isGrandMode) {
      if (semester) whereClause.semester = semester;
      if (kelas) whereClause.kelas = kelas;
    } else {
      if (!Number.isNaN(parsedSemester) && parsedSemester > 0) {
        whereClause.semester = parsedSemester;
      }
      if (rawKelas && rawKelas !== "ALL" && validKelas.includes(rawKelas as Kelas)) {
        whereClause.kelas = rawKelas as Kelas;
      }
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
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

    // Filter agama jika dipilih (default: "islam")
    const matchesAgamaFilter = (courseName: string, filter: string | null | undefined): boolean => {
      const norm = courseName.toLowerCase();
      if (!norm.includes("agama")) return true;

      const selected = (filter || "islam").trim().toLowerCase();
      if (selected === "semua" || selected === "all") return true;
      if (selected === "kristen") return norm.includes("kristen");
      if (selected === "katholik" || selected === "katolik") return norm.includes("katholik") || norm.includes("katolik");
      if (selected === "budha" || selected === "buddha") return norm.includes("budha") || norm.includes("buddha");
      if (selected === "hindu") return norm.includes("hindu");
      return norm.includes("islam");
    };

    const filteredSchedules = schedules.filter((s) => matchesAgamaFilter(s.courseName, agamaParam));

    // Deduplikasi jadwal agar sesi yang sama (batch-wide seperti Olahraga) tidak muncul berulang
    const uniqueMap = new Map<string, (typeof schedules)[number]>();
    for (const s of filteredSchedules) {
      const key = `${s.day}|${s.startTime}|${s.endTime}|${s.room ?? ""}|${s.courseName.toLowerCase().trim()}${isGrandMode ? `|${s.kelas}` : ""}`;
      if (!uniqueMap.has(key) || s.kelas === kelas) {
        uniqueMap.set(key, s);
      }
    }
    const uniqueSchedules = Array.from(uniqueMap.values());

    const officialRooms = OFFICIAL_PRODI_ROOMS[prodi] || [];
    const roomsFromSchedules = Array.from(new Set(uniqueSchedules.map((s) => s.room?.trim()).filter((r): r is string => Boolean(r && r.length > 0))));

    // Pastikan urutan ruangan 100% konsisten dengan kolom Google Sheets aslinya
    const distinctRooms: string[] = isGrandMode
      ? [...officialRooms, ...roomsFromSchedules.filter((r) => !officialRooms.includes(r))]
      : roomsFromSchedules.sort((a, b) => {
          const idxA = officialRooms.indexOf(a);
          const idxB = officialRooms.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        });

    return NextResponse.json({
      success: true,
      profile: {
        username: user.username,
        prodi,
        kelas,
        semester,
      },
      rooms: distinctRooms,
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
      total: uniqueSchedules.length,
      entries: uniqueSchedules,
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
