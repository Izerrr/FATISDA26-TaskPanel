import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { canAccessTask, canManageTaskSubtasks, isMissingTableError } from "@/lib/task-access";

export const dynamic = "force-dynamic";

const MAX_SUBTASKS_PER_TASK = 50;

const SUBTASK_SELECT = {
  id: true,
  taskId: true,
  title: true,
  isDone: true,
  assigneeId: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: { id: true, name: true, username: true, avatar: true },
  },
} as const;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        scope: true,
        createdById: true,
        assignedTo: true,
        members: { select: { userId: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    if (!canAccessTask(task, userId)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    try {
      const subtasks = await prisma.taskSubtask.findMany({
        where: { taskId: params.id },
        select: SUBTASK_SELECT,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      return NextResponse.json({ subtasks });
    } catch (err) {
      if (isMissingTableError(err)) {
        return NextResponse.json({ subtasks: [] });
      }
      throw err;
    }
  } catch (error) {
    console.error("[GET /api/tasks/:id/subtasks]", error);
    return NextResponse.json({ error: "Gagal memuat sub-tugas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, task] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } }),
      prisma.task.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          scope: true,
          createdById: true,
          assignedTo: true,
          members: { select: { userId: true } },
          _count: { select: { subtasks: true } },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    if (!canManageTaskSubtasks(task, user.id, user.roles)) {
      return NextResponse.json({ error: "Tidak memiliki izin menambah sub-tugas" }, { status: 403 });
    }

    const body = await req.json();
    const rawItems: Array<{ title?: unknown; assigneeId?: unknown }> = Array.isArray(body.items)
      ? body.items
      : [{ title: body.title, assigneeId: body.assigneeId }];

    const validMemberIds = new Set<string>([
      task.createdById,
      ...(task.assignedTo ? [task.assignedTo] : []),
      ...task.members.map((m) => m.userId),
    ]);

    const cleanItems = rawItems
      .filter((item): item is { title: string; assigneeId?: unknown } => typeof item?.title === "string" && item.title.trim().length > 0)
      .map((item) => {
        const rawAssignee = typeof item.assigneeId === "string" && item.assigneeId.trim() ? item.assigneeId.trim() : null;
        const safeAssignee = rawAssignee && (task.scope === "CLASS" || validMemberIds.has(rawAssignee)) ? rawAssignee : null;
        return {
          title: item.title.trim().slice(0, 160),
          assigneeId: safeAssignee,
        };
      });

    if (cleanItems.length === 0) {
      return NextResponse.json({ error: "Judul sub-tugas wajib diisi" }, { status: 400 });
    }

    const existingCount = task._count.subtasks;
    if (existingCount + cleanItems.length > MAX_SUBTASKS_PER_TASK) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_SUBTASKS_PER_TASK} sub-tugas per tugas.` },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(
      cleanItems.map((item, idx) =>
        prisma.taskSubtask.create({
          data: {
            taskId: params.id,
            title: item.title,
            assigneeId: item.assigneeId,
            order: existingCount + idx,
          },
          select: SUBTASK_SELECT,
        }),
      ),
    );

    return NextResponse.json(
      created.length === 1 ? { subtask: created[0], subtasks: created } : { subtasks: created },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/tasks/:id/subtasks]", error);
    return NextResponse.json({ error: "Gagal menambah sub-tugas" }, { status: 500 });
  }
}
