import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchGuildDetails, fetchUserGuilds, type DiscordGuild } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.accessToken && !token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const configuredGuildId = process.env.DISCORD_GUILD_ID || "1547427568599302287";

    // 1. Coba ambil daftar server dari Discord OAuth token user
    let userGuilds: DiscordGuild[] = [];
    if (token?.accessToken) {
      userGuilds = await fetchUserGuilds(token.accessToken as string).catch(() => []);
    }

    // Filter server yang dikelola user, DAN sertakan server utama FATISDA jika user adalah anggotanya
    const accessibleGuilds = userGuilds.filter((guild) => {
      const isPrimary = configuredGuildId && guild.id === configuredGuildId;
      if (isPrimary) return true;

      const permissions = Number(guild.permissions);
      const administrator = (permissions & 0x8) === 0x8;
      const manageGuild = (permissions & 0x20) === 0x20;

      return guild.owner || administrator || manageGuild;
    });

    // 2. Fallback Resiliensi: Jika Discord OAuth token expired / rate limited / kosong,
    // tapi user sudah terdaftar di database TaskPanel (atau memiliki sesi aktif)
    if (accessibleGuilds.length === 0) {
      // Ambil daftar guild dari database yang disinkronkan oleh bot
      const dbGuilds = await prisma.guild.findMany().catch(() => []);
      for (const dg of dbGuilds) {
        if (!accessibleGuilds.some((g) => g.id === dg.id)) {
          accessibleGuilds.push({
            id: dg.id,
            name: dg.name,
            icon: dg.icon,
            owner: false,
            permissions: "0",
          });
        }
      }

      // Pastikan server utama FATISDA selalu ada di daftar workspace
      if (configuredGuildId && !accessibleGuilds.some((g) => g.id === configuredGuildId)) {
        const botGuild = await fetchGuildDetails(configuredGuildId).catch(() => null);
        accessibleGuilds.push({
          id: configuredGuildId,
          name: botGuild?.name || "FATISDA UNS 2026",
          icon: botGuild?.icon || null,
          owner: false,
          permissions: "0",
        });
      }
    }

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

    // Fallback darurat jika ada error koneksi eksternal agar user tidak terblokir
    const fallbackGuildId = process.env.DISCORD_GUILD_ID || "1547427568599302287";
    return NextResponse.json({
      guilds: [
        {
          id: fallbackGuildId,
          name: "FATISDA UNS 2026",
          icon: null,
          owner: false,
          permissions: "0",
        },
      ],
    });
  }
}
