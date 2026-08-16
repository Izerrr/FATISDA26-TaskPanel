import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { fetchUserGuilds, syncGuildMembers } from "@/lib/discord";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.accessToken) {
      return NextResponse.json(
        { error: "Belum masuk" },
        { status: 401 }
      );
    }

    const guilds = await fetchUserGuilds(
      token.accessToken as string
    );

    const guild = guilds.find(
      (item) => item.id === params.id
    );

    if (!guild) {
      return NextResponse.json(
        { error: "Tidak memiliki akses ke server tersebut" },
        { status: 403 }
      );
    }

    await prisma.guild.upsert({
      where: { id: guild.id },
      create: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null,
      },
      update: {
        name: guild.name,
        icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null,
      },
    });

    const members = await syncGuildMembers(
      guild.id
    );

    return NextResponse.json({
      ok: true,
      guild,
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
