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

    const manageable = guilds.filter((guild) => {
      const permissions = Number(guild.permissions);

      const administrator = (permissions & 0x8) === 0x8;

      const manageGuild = (permissions & 0x20) === 0x20;

      return guild.owner || administrator || manageGuild;
    });

    return NextResponse.json({
      guilds: manageable,
    });
  } catch (error) {
    console.error("[GET /api/guilds]", error);

    return NextResponse.json({ error: "Gagal memuat server Discord" }, { status: 500 });
  }
}
