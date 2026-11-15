import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!token || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const prodi = searchParams.get("prodi");
    const kelas = searchParams.get("kelas");

    const andConditions: any[] = [
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    ];

    if (prodi) {
      andConditions.push({ OR: [{ prodi: null }, { prodi }] });
    }
    if (kelas) {
      andConditions.push({ OR: [{ kelas: null }, { kelas }] });
    }

    const announcements = await (prisma as any).announcement.findMany({
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
    
    const userId = token.userId ?? token.discordId;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
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

    const newAnnouncement = await (prisma as any).announcement.create({
      data: {
        title,
        content,
        authorId: userId,
        prodi: prodi || null,
        kelas: kelas || null,
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
