import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { fetchUserGuilds, syncGuildMembers } from "@/lib/discord";
import { getAuthSecret } from "@/lib/auth-secret";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({
      req,
      secret: getAuthSecret(),
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: "Belum masuk" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    const isAdminOrOwner = Boolean(user?.roles.some((r) => ["ADMIN", "OWNER"].includes(r)));
    if (!isAdminOrOwner) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya Admin atau Owner yang dapat menyinkronkan seluruh anggota server." },
        { status: 403 }
      );
    }

    let syncedGuild = {
      id: params.id,
      name: "FATISDA UNS 2026",
      icon: null as string | null,
    };

    if (token?.accessToken) {
      const guilds = await fetchUserGuilds(token.accessToken as string);
      const guild = guilds.find((item) => item.id === params.id);

      if (!guild) {
        return NextResponse.json(
          { error: "Tidak memiliki akses ke server tersebut" },
          { status: 403 }
        );
      }

      syncedGuild = {
        id: guild.id,
        name: guild.name,
        icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null,
      };
    } else {
      const existingGuild = await prisma.guild.findUnique({
        where: { id: params.id },
      });
      if (!existingGuild) {
        return NextResponse.json(
          { error: "Guild tidak ditemukan" },
          { status: 404 }
        );
      }
      syncedGuild = {
        id: existingGuild.id,
        name: existingGuild.name,
        icon: existingGuild.icon,
      };
    }

    await prisma.guild.upsert({
      where: { id: syncedGuild.id },
      create: syncedGuild,
      update: {
        name: syncedGuild.name,
        icon: syncedGuild.icon,
      },
    });

    const members = await syncGuildMembers(syncedGuild.id);

    return NextResponse.json({
      ok: true,
      guild: syncedGuild,
      syncedMembers: members.length,
    });
  } catch (error) {
    console.error("[POST /api/guilds/:id/sync]", error);
    return NextResponse.json(
      { error: "Gagal melakukan sinkronisasi guild" },
      { status: 500 }
    );
  }
}
