import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchGuildMembers } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

    const members = await fetchGuildMembers(params.id);
    await Promise.all(
      members
        .filter((m) => !!m.user)
        .map((m) =>
          prisma.user.upsert({
            where: { id: m.user.id },
            create: {
              id: m.user.id,
              username: m.nick ?? m.user.username,
              avatar: m.user.avatar
                ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`
                : null,
            },
            update: {
              username: m.nick ?? m.user.username,
              avatar: m.user.avatar
                ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`
                : null,
            },
          })
        )
    );

    return NextResponse.json({
      members: members
        .filter((m) => !!m.user)
        .map((m) => ({
          id: m.user.id,
          username: m.nick ?? m.user.username,
          avatar: m.user.avatar
            ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`
            : null,
          roles: m.roles || [],
        })),
    });
  } catch (err) {
    console.error("[Members]", err);
    return NextResponse.json({ error: "Gagal memuat anggota" }, { status: 500 });
  }
}
