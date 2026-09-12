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

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    await syncCurrentUser(token.discordId as string);

    const user = await prisma.user.findUnique({
      where: {
        id: token.discordId as string,
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
