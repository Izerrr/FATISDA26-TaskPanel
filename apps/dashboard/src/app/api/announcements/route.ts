import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Kelas, type Prisma, Prodi } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

const VALID_PRODI = Object.values(Prodi) as string[];
const VALID_KELAS = Object.values(Kelas) as string[];

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const prodiParam = searchParams.get("prodi");
    const kelasParam = searchParams.get("kelas");

    const andConditions: Prisma.AnnouncementWhereInput[] = [
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    ];

    if (prodiParam && VALID_PRODI.includes(prodiParam)) {
      andConditions.push({ OR: [{ prodi: null }, { prodi: prodiParam as Prodi }] });
    }
    if (kelasParam && VALID_KELAS.includes(kelasParam)) {
      andConditions.push({ OR: [{ kelas: null }, { kelas: kelasParam as Kelas }] });
    }

    const announcements = await prisma.announcement.findMany({
      where: { AND: andConditions },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        author: {
          select: { username: true, avatar: true }
        }
      }
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("[Announcements GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = (token.userId ?? token.discordId) as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isPrivileged = user.roles.some((r: string) => 
      ['PJ_KELAS', 'PJ_MATKUL', 'ADMIN', 'OWNER', 'KETUA_ANGKATAN'].includes(r)
    );

    if (!isPrivileged) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, content, prodi, kelas, isPinned, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resolvedProdi = typeof prodi === "string" && VALID_PRODI.includes(prodi) ? (prodi as Prodi) : null;
    const resolvedKelas = typeof kelas === "string" && VALID_KELAS.includes(kelas) ? (kelas as Kelas) : null;

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: userId,
        prodi: resolvedProdi,
        kelas: resolvedKelas,
        isPinned: !!isPinned,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        author: {
          select: { username: true, avatar: true }
        }
      }
    });

    return NextResponse.json(newAnnouncement);
  } catch (error) {
    console.error("[Announcements POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
