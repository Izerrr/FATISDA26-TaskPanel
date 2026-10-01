import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (token.userId ?? token.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, scope: true, createdById: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    // Proteksi IDOR: Tugas PERSONAL hanya dapat diakses oleh pembuatnya
    if (task.scope === "PERSONAL" && task.createdById !== userId) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const comments = await (prisma as any).taskComment.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("[TaskComments GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (token.userId ?? token.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, scope: true, createdById: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    // Proteksi IDOR: Tugas PERSONAL hanya dapat dikomentari oleh pemiliknya
    if (task.scope === "PERSONAL" && task.createdById !== userId) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Komentar wajib diisi" }, { status: 400 });
    }

    // Proteksi anti-spam / rate limit 5 detik
    const recentComment = await (prisma as any).taskComment.findFirst({
      where: {
        authorId: userId,
        createdAt: { gte: new Date(Date.now() - 5 * 1000) },
      },
    });

    if (recentComment) {
      return NextResponse.json(
        { error: "Mohon tunggu 5 detik sebelum mengirim komentar lagi." },
        { status: 429 },
      );
    }

    const newComment = await (prisma as any).taskComment.create({
      data: {
        taskId: params.id,
        authorId: userId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("[TaskComments POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
