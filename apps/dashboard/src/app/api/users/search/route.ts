import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Kelas, type Prisma, Prodi } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

export const dynamic = "force-dynamic";

const VALID_PRODI = Object.values(Prodi) as string[];
const VALID_KELAS = Object.values(Kelas) as string[];

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: getAuthSecret(),
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().replace(/^@+/, "");
    const prodiParam = req.nextUrl.searchParams.get("prodi");
    const kelasParam = req.nextUrl.searchParams.get("kelas");

    const where: Prisma.UserWhereInput = {};

    if (prodiParam && VALID_PRODI.includes(prodiParam)) {
      where.prodi = prodiParam as Prodi;
    }
    if (kelasParam && VALID_KELAS.includes(kelasParam)) {
      where.kelas = kelasParam as Kelas;
    }

    if (q.length > 0) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { discordUsername: { contains: q, mode: "insensitive" } },
        { nim: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
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
