import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchUserGuilds } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.accessToken) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const guilds = await fetchUserGuilds(token.accessToken as string);

    const configuredGuildId = process.env.DISCORD_GUILD_ID;

    // Filter server yang dikelola user, DAN selalu sertakan server utama FATISDA jika user adalah anggotanya
    const accessibleGuilds = guilds.filter((guild) => {
      const isPrimary = configuredGuildId && guild.id === configuredGuildId;
      if (isPrimary) return true;

      const permissions = Number(guild.permissions);
      const administrator = (permissions & 0x8) === 0x8;
      const manageGuild = (permissions & 0x20) === 0x20;

      return guild.owner || administrator || manageGuild;
    });

    // Urutkan agar server utama FATISDA berada di posisi paling atas
    accessibleGuilds.sort((a, b) => {
      if (a.id === configuredGuildId) return -1;
      if (b.id === configuredGuildId) return 1;
      return 0;
    });

    return NextResponse.json({
      guilds: accessibleGuilds,
    });
  } catch (error) {
    console.error("[GET /api/guilds]", error);

    return NextResponse.json({ error: "Gagal memuat server Discord" }, { status: 500 });
  }
}
