import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";
import { resolveCourseId } from "@/lib/course-resolver";
type TaskStatus = "TODO" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";
const VALID_TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: { id: string };
  },
) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: token.discordId as string,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const existing = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, status, assignedTo, dueDate, courseId, scope, kelas } = body;

    const canManageClass = user.roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r));
    const isOwner = existing.createdById === user.id;
    const isAssignee = existing.assignedTo === user.id;
    const isManager = isOwner || (existing.scope === "CLASS" && canManageClass);

    if (!isManager && !isAssignee) {
      return NextResponse.json({ error: "Tidak memiliki izin untuk mengubah tugas ini" }, { status: 403 });
    }

    if (!isManager && isAssignee && status === undefined) {
      return NextResponse.json({ error: "Assignee hanya memiliki izin untuk memperbarui status tugas" }, { status: 403 });
    }

    if (status !== undefined && (typeof status !== "string" || !VALID_TASK_STATUSES.includes(status as TaskStatus))) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    let validCourseId: string | null | undefined = undefined;
    if (isManager && courseId !== undefined) {
      if (!courseId) {
        validCourseId = null;
      } else if (typeof courseId === "string") {
        validCourseId = await resolveCourseId(courseId, existing.prodi ?? user.prodi ?? "INFORMATIKA", existing.kelas ?? user.kelas ?? null);
      }
    }

    const targetKelas = isManager && kelas !== undefined ? (kelas === "ALL" || kelas === "" ? null : kelas) : undefined;

    // Jika user hanya assignee (bukan manager/owner), batasi mutasi HANYA pada field status
    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
    }

    if (isManager) {
      if (typeof title === "string" && title.trim()) {
        updateData.title = title.trim();
      }
      if (description !== undefined) {
        updateData.description = typeof description === "string" && description.trim() ? description.trim() : null;
      }
      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo || null;
      }
      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }
      if (validCourseId !== undefined) {
        updateData.courseId = validCourseId;
      }
      if (scope !== undefined) {
        updateData.scope = scope === "CLASS" ? "CLASS" : "PERSONAL";
      }
      if (targetKelas !== undefined) {
        updateData.kelas = targetKelas;
      }
    }

    const task = await prisma.task.update({
      where: {
        id: params.id,
      },
      data: updateData,

      include: {
        createdBy: true,
        assignee: true,
        course: true,
      },
    });

    if (task.scope === "CLASS" && status && status !== existing.status) {
      await sendDiscordNotification(task.guildId, [`**${task.title}**`, `Status: ${existing.status} → **${status}**`, `Oleh: <@${user.id}>`].join("\n"), {
        prodi: task.prodi,
        kelas: task.kelas,
      });
    }

    return NextResponse.json({
      task,
    });
  } catch (error) {
    console.error("[PATCH /api/tasks/:id]", error);

    return NextResponse.json({ error: "Gagal memperbarui tugas" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: { id: string };
  },
) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: token.discordId as string,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const canManageClass = user.roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r));
    const isOwner = task.createdById === user.id;

    if (!isOwner && !(task.scope === "CLASS" && canManageClass)) {
      return NextResponse.json({ error: "Tidak memiliki izin untuk menghapus tugas ini" }, { status: 403 });
    }

    await prisma.task.delete({
      where: {
        id: params.id,
      },
    });

    if (task.scope === "CLASS") {
      await sendDiscordNotification(task.guildId, `**${task.title}** dihapus oleh <@${user.id}>`, {
        prodi: task.prodi,
        kelas: task.kelas,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[DELETE /api/tasks/:id]", error);

    return NextResponse.json({ error: "Gagal menghapus tugas" }, { status: 500 });
  }
}
