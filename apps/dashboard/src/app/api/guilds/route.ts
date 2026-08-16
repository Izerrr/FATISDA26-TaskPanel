import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchUserGuilds } from "@/lib/discord";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }
    const guilds = await fetchUserGuilds(token.accessToken as string);
    const manageable = guilds.filter(
      (g: { owner: boolean; permissions: string }) =>
        g.owner || (parseInt(g.permissions) & 0x20) === 0x20 || (parseInt(g.permissions) & 0x8) === 0x8
    );
    return NextResponse.json({ guilds: manageable });
  } catch (err) {
    console.error("[Guilds]", err);
    return NextResponse.json({ error: "Gagal memuat server" }, { status: 500 });
  }
}
