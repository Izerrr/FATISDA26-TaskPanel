import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@if26/database";

export const dynamic = "force-dynamic";

async function getAuthedUser(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.discordId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: token.discordId as string,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    if (!user.prodi || !user.kelas) {
      return NextResponse.json({
        schedules: [],
        message: "Profil prodi dan kelas belum lengkap.",
      });
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        prodi: user.prodi,
        kelas: user.kelas,
      },

      include: {
        course: true,
      },

      orderBy: [
        {
          day: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    return NextResponse.json({
      schedules,
    });
  } catch (error) {
    console.error("[GET /api/schedule]", error);

    return NextResponse.json(
      {
        error: "Gagal memuat jadwal",
      },
      {
        status: 500,
      },
    );
  }
}
