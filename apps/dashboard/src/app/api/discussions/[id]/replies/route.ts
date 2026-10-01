import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (token.userId ?? token.discordId) as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Komentar tidak boleh kosong" }, { status: 400 });
    }

    const discussion = await (prisma as any).courseDiscussion.findUnique({
      where: { id: params.id },
    });

    if (!discussion) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan" }, { status: 404 });
    }

    // Proteksi anti-spam / rate limit 5 detik
    const recentReply = await (prisma as any).discussionReply.findFirst({
      where: {
        authorId: user.id,
        createdAt: { gte: new Date(Date.now() - 5 * 1000) },
      },
    });

    if (recentReply) {
      return NextResponse.json(
        { error: "Mohon tunggu 5 detik sebelum mengirim balasan lagi." },
        { status: 429 },
      );
    }

    const reply = await (prisma as any).discussionReply.create({
      data: {
        discussionId: params.id,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/discussions/:id/replies]", error);
    return NextResponse.json({ error: "Gagal mengirim balasan" }, { status: 500 });
  }
}
