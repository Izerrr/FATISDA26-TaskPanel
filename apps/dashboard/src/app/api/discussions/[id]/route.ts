import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { hasPrivilegedTaskRole } from "@/lib/task-access";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, discussion] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } }),
      prisma.courseDiscussion.findUnique({ where: { id: params.id } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (!discussion) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged = hasPrivilegedTaskRole((user.roles || []).map(String));
    const isAuthor = discussion.authorId === user.id;

    const body = await req.json();
    const updateData: {
      isSolved?: boolean;
      acceptedReplyId?: string | null;
      isPinned?: boolean;
    } = {};

    if (typeof body.isPinned === "boolean") {
      if (!isPrivileged) {
        return NextResponse.json({ error: "Hanya pengurus/PJ yang dapat menyematkan diskusi" }, { status: 403 });
      }
      updateData.isPinned = body.isPinned;
    }

    if ("acceptedReplyId" in body || typeof body.isSolved === "boolean") {
      if (!isAuthor && !isPrivileged) {
        return NextResponse.json({ error: "Hanya pembuat topik atau PJ yang dapat menandai status terjawab" }, { status: 403 });
      }

      if (body.acceptedReplyId === null) {
        updateData.acceptedReplyId = null;
        if (typeof body.isSolved === "boolean") {
          updateData.isSolved = body.isSolved;
        }
      } else if (typeof body.acceptedReplyId === "string" && body.acceptedReplyId.trim()) {
        const reply = await prisma.discussionReply.findFirst({
          where: { id: body.acceptedReplyId.trim(), discussionId: params.id },
          select: { id: true },
        });
        if (!reply) {
          return NextResponse.json({ error: "Balasan tidak ditemukan pada topik ini" }, { status: 400 });
        }
        updateData.acceptedReplyId = reply.id;
        updateData.isSolved = true;
      } else if (typeof body.isSolved === "boolean") {
        updateData.isSolved = body.isSolved;
        if (!body.isSolved) {
          updateData.acceptedReplyId = null;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan yang valid" }, { status: 400 });
    }

    const updated = await prisma.courseDiscussion.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ discussion: updated });
  } catch (error) {
    console.error("[PATCH /api/discussions/:id]", error);
    return NextResponse.json({ error: "Gagal memperbarui diskusi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, discussion] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } }),
      prisma.courseDiscussion.findUnique({ where: { id: params.id }, select: { id: true, authorId: true } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (!discussion) {
      return NextResponse.json({ error: "Diskusi tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged = hasPrivilegedTaskRole((user.roles || []).map(String));
    if (discussion.authorId !== user.id && !isPrivileged) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    await prisma.courseDiscussion.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/discussions/:id]", error);
    return NextResponse.json({ error: "Gagal menghapus diskusi" }, { status: 500 });
  }
}
