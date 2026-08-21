import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
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
        {
          status: 404,
        },
      );
    }

    /*
     * Jadwal membutuhkan tiga identitas akademik:
     * - prodi
     * - kelas
     * - semester
     *
     * Kalau salah satunya belum tersedia,
     * jangan mengambil jadwal yang terlalu luas.
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
      {
        status: 500,
      },
    );
  }
}
