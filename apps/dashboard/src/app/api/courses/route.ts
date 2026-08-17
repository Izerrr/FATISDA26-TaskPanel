import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: token.discordId as string,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const courses = await prisma.course.findMany({
      where: {
        ...(user.prodi ? { prodi: user.prodi } : {}),
        ...(user.kelas
          ? {
              OR: [{ kelas: user.kelas }, { kelas: null }],
            }
          : {}),
      },
      orderBy: [
        {
          code: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      courses,
    });
  } catch (error) {
    console.error("[GET /api/courses]", error);

    return NextResponse.json({ error: "Gagal memuat mata kuliah" }, { status: 500 });
  }
}
