import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (token.userId ?? token.discordId) as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const courseName = searchParams.get("courseName");

    const whereClause: any = {
      OR: [
        { prodi: user.prodi, kelas: user.kelas },
        { prodi: user.prodi, kelas: null },
        { prodi: null, kelas: null },
      ],
    };

    if (courseId) {
      whereClause.courseId = courseId;
    } else if (courseName) {
      whereClause.courseName = courseName;
    }

    const discussions = await (prisma as any).courseDiscussion.findMany({
      where: whereClause,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ discussions });
  } catch (error) {
    console.error("[GET /api/discussions]", error);
    return NextResponse.json({ error: "Gagal memuat diskusi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (token.userId ?? token.discordId) as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { courseId, courseName, title, content, isPinned } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Judul dan isi diskusi wajib diisi" }, { status: 400 });
    }

    const isPrivileged = user.roles?.some((r) => ["ADMIN", "OWNER", "PJ_KELAS", "PJ_MATKUL", "KETUA_ANGKATAN"].includes(r));

    const discussion = await (prisma as any).courseDiscussion.create({
      data: {
        courseId: courseId || null,
        courseName: courseName || null,
        prodi: user.prodi,
        kelas: user.kelas,
        title: title.trim(),
        content: content.trim(),
        isPinned: isPrivileged && isPinned ? true : false,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        replies: true,
      },
    });

    return NextResponse.json({ discussion }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/discussions]", error);
    return NextResponse.json({ error: "Gagal membuat diskusi" }, { status: 500 });
  }
}
