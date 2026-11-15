import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { canAccessTask } from "@/lib/task-access";
import { notifyUsers, resolveUserIdsByMentions } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (token.userId ?? token.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        scope: true,
        createdById: true,
        assignedTo: true,
        members: { select: { userId: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    // Proteksi IDOR: Tugas PERSONAL & GROUP hanya dapat diakses pemilik/anggota terkait
    if (!canAccessTask(task, userId)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar: true },
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
    const token = await getToken({ req, secret: getAuthSecret() });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (token.userId ?? token.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        scope: true,
        createdById: true,
        assignedTo: true,
        members: { select: { userId: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    // Proteksi IDOR: Tugas PERSONAL & GROUP hanya dapat dikomentari pemilik/anggota terkait
    if (!canAccessTask(task, userId)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Komentar wajib diisi" }, { status: 400 });
    }

    // Proteksi anti-spam / rate limit 5 detik
    const recentComment = await prisma.taskComment.findFirst({
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

    const newComment = await prisma.taskComment.create({
      data: {
        taskId: params.id,
        authorId: userId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    const actorName = newComment.author?.name || newComment.author?.username || "Seseorang";
    const commentPreview = content.trim().slice(0, 90);
    const mentionIds = await resolveUserIdsByMentions(content.trim());
    const mentionSet = new Set(mentionIds);

    const participantIds = new Set<string>();
    if (task.createdById) participantIds.add(task.createdById);
    if (task.scope !== "CLASS") {
      if (task.assignedTo) participantIds.add(task.assignedTo);
      for (const m of task.members) {
        participantIds.add(m.userId);
      }
    }
    const commentRecipients = Array.from(participantIds).filter((id) => !mentionSet.has(id));

    await Promise.all([
      commentRecipients.length > 0
        ? notifyUsers({
            recipientIds: commentRecipients,
            actorId: userId,
            type: "TASK_COMMENT",
            title: `Komentar baru di "${task.title}"`,
            body: `${actorName}: ${commentPreview}`,
            href: `/dashboard/tasks?taskId=${task.id}`,
          })
        : Promise.resolve(),
      mentionIds.length > 0
        ? notifyUsers({
            recipientIds: mentionIds,
            actorId: userId,
            type: "MENTION",
            title: `${actorName} menyebutmu di "${task.title}"`,
            body: commentPreview,
            href: `/dashboard/tasks?taskId=${task.id}`,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("[TaskComments POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
