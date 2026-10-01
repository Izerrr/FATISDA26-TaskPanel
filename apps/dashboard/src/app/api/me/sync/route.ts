import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { syncCurrentUser } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const userBefore = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userBefore) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (userBefore.discordId) {
      await syncCurrentUser(userBefore.discordId);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan setelah sinkronisasi" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      diagnostics: {
        id: user.id,
        username: user.username,
        roles: user.roles,
        prodi: user.prodi,
        kelas: user.kelas,
        discordRolesCount: user.discordRoles?.length ?? 0,
        discordRoles: user.discordRoles,
      },
    });
  } catch (error) {
    console.error("[POST /api/me/sync]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menyinkronkan profil Discord",
      },
      { status: 500 },
    );
  }
}
