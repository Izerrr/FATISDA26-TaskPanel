import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";
import { resolveCourseId } from "@/lib/course-resolver";
import { parseWibDateInput } from "@/lib/datetime";
type TaskStatus = "TODO" | "WAITING" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";
const VALID_TASK_STATUSES: TaskStatus[] = ["TODO", "WAITING", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

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
      secret: process.env.NEXTAUTH_SECRET || "fatisda_auth_secret_session_2026_jwt_fallback_key",
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const existing = await (prisma.task as any).findUnique({
      where: {
        id: params.id,
      },
      include: {
        members: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, status, assignedTo, dueDate, courseId, scope, kelas, memberIds } = body;

    const canManageClass = user.roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r));
    const isOwner = existing.createdById === user.id;
    const isAssignee = existing.assignedTo === user.id;
    const isClassTask = existing.scope === "CLASS";
    const isGroupMember =
      existing.scope === "GROUP" &&
      (isOwner || (Array.isArray(existing.members) && existing.members.some((m: { userId: string }) => m.userId === user.id)));
    const isManager = isOwner || isGroupMember || (isClassTask && canManageClass);

    // Untuk tugas PERSONAL atau GROUP: hanya owner, assignee, atau anggota kelompok yang boleh mengubah
    if (!isClassTask && !isManager && !isAssignee) {
      return NextResponse.json({ error: "Tidak memiliki izin untuk mengubah tugas ini" }, { status: 403 });
    }

    // Jika bukan manager (mahasiswa biasa di tugas kelas atau assignee di tugas personal), hanya boleh mengubah status
    if (!isManager && status === undefined) {
      return NextResponse.json({ error: "Kamu hanya memiliki izin untuk memperbarui status pengerjaan tugas" }, { status: 403 });
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

    const updateData: any = {};

    // Untuk tugas PERSONAL & GROUP, status disimpan langsung di tabel Task (linked).
    // Untuk tugas CLASS, status disimpan per-user di tabel TaskUserProgress agar tidak mengubah status mahasiswa lain!
    if (status !== undefined && !isClassTask) {
      updateData.status = status;
    }

    const nextScope =
      isManager && scope !== undefined
        ? scope === "CLASS" && canManageClass
          ? "CLASS"
          : scope === "GROUP"
            ? "GROUP"
            : "PERSONAL"
        : existing.scope;

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
        updateData.dueDate = parseWibDateInput(dueDate);
      }
      if (validCourseId !== undefined) {
        updateData.courseId = validCourseId;
      }
      if (scope !== undefined) {
        updateData.scope = nextScope;
      }
      if (targetKelas !== undefined) {
        updateData.kelas = targetKelas;
      }

      if (nextScope === "GROUP" && Array.isArray(memberIds)) {
        const cleanMemberIds = Array.from(
          new Set(memberIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0 && id !== existing.createdById)),
        );
        const allTargetIds = [existing.createdById, ...cleanMemberIds];

        await (prisma as any).taskMember.deleteMany({
          where: {
            taskId: params.id,
            userId: { notIn: allTargetIds },
          },
        });

        await (prisma as any).taskMember.upsert({
          where: {
            taskId_userId: { taskId: params.id, userId: existing.createdById },
          },
          create: {
            taskId: params.id,
            userId: existing.createdById,
            role: "LEADER",
          },
          update: {
            role: "LEADER",
          },
        });

        for (const mId of cleanMemberIds) {
          await (prisma as any).taskMember.upsert({
            where: {
              taskId_userId: { taskId: params.id, userId: mId },
            },
            create: {
              taskId: params.id,
              userId: mId,
              role: "MEMBER",
            },
            update: {},
          });
        }
      }
    }

    let previousUserStatus: TaskStatus = existing.status as TaskStatus;
    if (isClassTask) {
      const existingProgress = await (prisma as any).taskUserProgress.findUnique({
        where: {
          taskId_userId: { taskId: params.id, userId: user.id },
        },
        select: { status: true },
      });
      if (existingProgress?.status) {
        previousUserStatus = existingProgress.status as TaskStatus;
      }

      if (status !== undefined) {
        await (prisma as any).taskUserProgress.upsert({
          where: {
            taskId_userId: { taskId: params.id, userId: user.id },
          },
          create: {
            taskId: params.id,
            userId: user.id,
            status: status as TaskStatus,
          },
          update: {
            status: status as TaskStatus,
          },
        });
      }
    }

    const taskInclude = {
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              nim: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "asc" as const },
      },
      course: true,
    };

    const task =
      Object.keys(updateData).length > 0
        ? await (prisma.task as any).update({
            where: {
              id: params.id,
            },
            data: updateData,
            include: taskInclude,
          })
        : await (prisma.task as any).findUniqueOrThrow({
            where: { id: params.id },
            include: taskInclude,
          });

    const effectiveStatus = isClassTask ? ((status as TaskStatus | undefined) ?? previousUserStatus) : (task.status as TaskStatus);

    // Log activity
    try {
      if (status && status !== previousUserStatus) {
        await (prisma as any).taskActivity.create({
          data: {
            taskId: params.id,
            userId: user.id,
            action: 'STATUS_CHANGED',
            oldValue: previousUserStatus,
            newValue: status,
          },
        });
      }
      if (isManager && title && title !== existing.title) {
        await (prisma as any).taskActivity.create({
          data: {
            taskId: params.id,
            userId: user.id,
            action: 'TITLE_CHANGED',
            oldValue: existing.title,
            newValue: title.trim(),
          },
        });
      }
    } catch (logErr) {
      console.warn('[TaskActivity] Failed to log:', logErr);
    }

    return NextResponse.json({
      task: {
        ...task,
        status: effectiveStatus,
      },
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
      secret: process.env.NEXTAUTH_SECRET || "fatisda_auth_secret_session_2026_jwt_fallback_key",
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
      const authorMention = user.discordId ? `<@${user.discordId}>` : user.username;
      await sendDiscordNotification(task.guildId, `**${task.title}** dihapus oleh ${authorMention}`, {
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
