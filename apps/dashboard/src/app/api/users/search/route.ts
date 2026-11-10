import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || "fatisda_auth_secret_session_2026_jwt_fallback_key",
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().replace(/^@+/, "");
    const prodiParam = req.nextUrl.searchParams.get("prodi");
    const kelasParam = req.nextUrl.searchParams.get("kelas");

    const where: any = {};

    if (prodiParam) {
      where.prodi = prodiParam;
    }
    if (kelasParam) {
      where.kelas = kelasParam;
    }

    if (q.length > 0) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { discordUsername: { contains: q, mode: "insensitive" } },
        { nim: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await (prisma.user as any).findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        discordUsername: true,
        nim: true,
        avatar: true,
        prodi: true,
        kelas: true,
      },
      orderBy: [{ name: "asc" }, { username: "asc" }],
      take: 20,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/users/search]", error);
    return NextResponse.json({ error: "Gagal mencari pengguna" }, { status: 500 });
  }
}
