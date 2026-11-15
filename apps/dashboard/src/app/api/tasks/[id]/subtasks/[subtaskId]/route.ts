import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { canManageTaskSubtasks } from "@/lib/task-access";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; subtaskId: string } },
) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, task, existingSubtask] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } }),
      prisma.task.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          scope: true,
          createdById: true,
          assignedTo: true,
          members: { select: { userId: true } },
        },
      }),
      prisma.taskSubtask.findUnique({ where: { id: params.subtaskId } }),
    ]);

    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    if (!existingSubtask || existingSubtask.taskId !== params.id) {
      return NextResponse.json({ error: "Sub-tugas tidak ditemukan" }, { status: 404 });
    }

    if (!canManageTaskSubtasks(task, user.id, user.roles)) {
      return NextResponse.json({ error: "Tidak memiliki izin mengubah sub-tugas" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: { title?: string; isDone?: boolean; assigneeId?: string | null } = {};

    if (typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim().slice(0, 160);
    }
    if (typeof body.isDone === "boolean") {
      updateData.isDone = body.isDone;
    }
    if (body.assigneeId !== undefined) {
      const validMemberIds = new Set<string>([
        task.createdById,
        ...(task.assignedTo ? [task.assignedTo] : []),
        ...task.members.map((m) => m.userId),
      ]);
      const rawAssignee = typeof body.assigneeId === "string" && body.assigneeId.trim() ? body.assigneeId.trim() : null;
      updateData.assigneeId = rawAssignee && (task.scope === "CLASS" || validMemberIds.has(rawAssignee)) ? rawAssignee : null;
    }

    const subtask = await prisma.taskSubtask.update({
      where: { id: params.subtaskId },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ subtask });
  } catch (error) {
    console.error("[PATCH /api/tasks/:id/subtasks/:subtaskId]", error);
    return NextResponse.json({ error: "Gagal memperbarui sub-tugas" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; subtaskId: string } },
) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, task, existingSubtask] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } }),
      prisma.task.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          scope: true,
          createdById: true,
          assignedTo: true,
          members: { select: { userId: true } },
        },
      }),
      prisma.taskSubtask.findUnique({ where: { id: params.subtaskId } }),
    ]);

    if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    if (!existingSubtask || existingSubtask.taskId !== params.id) {
      return NextResponse.json({ error: "Sub-tugas tidak ditemukan" }, { status: 404 });
    }

    if (!canManageTaskSubtasks(task, user.id, user.roles)) {
      return NextResponse.json({ error: "Tidak memiliki izin menghapus sub-tugas" }, { status: 403 });
    }

    await prisma.taskSubtask.delete({ where: { id: params.subtaskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/:id/subtasks/:subtaskId]", error);
    return NextResponse.json({ error: "Gagal menghapus sub-tugas" }, { status: 500 });
  }
}
