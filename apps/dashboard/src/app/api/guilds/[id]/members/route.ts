import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchGuildMembers, fetchUserGuilds } from "@/lib/discord";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

    const configuredGuildId = process.env.DISCORD_GUILD_ID;
    if (params.id !== configuredGuildId && token.accessToken) {
      const guilds = await fetchUserGuilds(token.accessToken as string);
      const isMember = guilds.some((g) => g.id === params.id);
      if (!isMember) {
        return NextResponse.json({ error: "Tidak memiliki akses ke server tersebut" }, { status: 403 });
      }
    }

    const members = await fetchGuildMembers(params.id);

    return NextResponse.json({
      members: members
        .filter((m) => !!m.user)
        .map((m) => ({
          id: m.user.id,
          username: m.nick ?? m.user.username,
          avatar: m.user.avatar ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png` : null,
          roles: m.roles || [],
        })),
    });
  } catch (err) {
    console.error("[Members]", err);
    return NextResponse.json({ error: "Gagal memuat anggota" }, { status: 500 });
  }
}
