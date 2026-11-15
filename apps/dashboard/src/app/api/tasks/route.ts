import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";
import { resolveCourseId } from "@/lib/course-resolver";
import { formatWib, parseWibDateInput } from "@/lib/datetime";
import { getAuthSecret } from "@/lib/auth-secret";
import { isMissingTableError } from "@/lib/task-access";
import { notifyUsers } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";
type TaskScope = "PERSONAL" | "CLASS" | "GROUP";
type TaskStatus = "TODO" | "WAITING" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";
const VALID_TASK_STATUSES: TaskStatus[] = ["TODO", "WAITING", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: getAuthSecret(),
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const guildId = searchParams.get("guildId");
    const configuredGuildId = process.env.DISCORD_GUILD_ID || "1547427568599302287";
    const targetGuildId = (guildId && guildId.trim()) || configuredGuildId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        prodi: true,
        kelas: true,
        roles: true,
      },
    });

    const canViewAllClassTasks = Boolean(user?.roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r)));

    // Filter tugas kelas:
    // Jika admin/pengurus (PJ Kelas/PJ Matkul/Ketua/Admin) -> tampilkan semua tugas kelas di server ini
    // Jika mahasiswa biasa:
    // - Prodi: jika user punya prodi, tampilkan tugas prodinya + tugas umum (prodi: null).
    // - Kelas: jika user punya kelas, tampilkan tugas kelasnya + tugas umum (kelas: null).
    // Jika prodi atau kelas belum tersinkron di Discord, jangan kunci / hilangkan tugasnya agar papan tidak kosong.
    const classTaskFilter: any = {
      scope: "CLASS",
    };

    if (!canViewAllClassTasks) {
      const filterConditions: any[] = [];

      if (user?.prodi) {
        filterConditions.push({
          OR: [{ prodi: null }, { prodi: user.prodi }],
        });
      }

      if (user?.kelas) {
        filterConditions.push({
          OR: [{ kelas: null }, { kelas: user.kelas }],
        });
      }

      if (filterConditions.length > 0) {
        classTaskFilter.AND = filterConditions;
      }
    }

    const candidateGuildIds = Array.from(new Set([targetGuildId, configuredGuildId, "1547427568599302287", "1509522755928985622", "882584293409456139"].filter(Boolean) as string[]));
    const guildCondition = { in: candidateGuildIds };

    const buildTaskInclude = (includeSubtasks: boolean) => ({
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
      ...(includeSubtasks
        ? {
            subtasks: {
              include: {
                assignee: {
                  select: { id: true, name: true, username: true, avatar: true },
                },
              },
              orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }],
            },
          }
        : {}),
      course: true,
      userProgress: {
        where: { userId },
        select: { status: true },
      },
    });

    const queryWhere: Prisma.TaskWhereInput = {
      guildId: guildCondition,
      OR: [
        classTaskFilter,
        { scope: "PERSONAL", createdById: userId },
        { scope: "PERSONAL", assignedTo: userId },
        { scope: "GROUP", OR: [{ createdById: userId }, { members: { some: { userId } } }] },
      ],
    };

    let rawTasks;
    try {
      rawTasks = await prisma.task.findMany({
        where: queryWhere,
        include: buildTaskInclude(true),
        orderBy: { createdAt: "desc" },
      });
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
      rawTasks = await prisma.task.findMany({
        where: queryWhere,
        include: buildTaskInclude(false),
        orderBy: { createdAt: "desc" },
      });
    }

    const tasks = rawTasks.map((t) => {
      const personalStatus = t.userProgress?.[0]?.status;
      const effectiveStatus = t.scope === "CLASS" ? (personalStatus ?? t.status) : t.status;
      const { userProgress: _unused, ...rest } = t;
      return {
        ...rest,
        subtasks: "subtasks" in rest && Array.isArray(rest.subtasks) ? rest.subtasks : [],
        status: effectiveStatus,
      };
    });

    return NextResponse.json({
      tasks,
    });
  } catch (error) {
    console.error("[GET /api/tasks]", error);

    return NextResponse.json({ error: "Gagal memuat tugas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: getAuthSecret(),
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const body = await req.json();

    const { guildId, title, description, assignedTo, dueDate, status, scope, prodi, kelas, courseId, memberIds, subtasks } = body;

    const configuredGuildId = process.env.DISCORD_GUILD_ID || "1547427568599302287";
    const targetGuildId = (typeof guildId === "string" && guildId.trim() ? guildId.trim() : null) || configuredGuildId;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const taskScope: TaskScope = scope === "CLASS" ? "CLASS" : scope === "GROUP" ? "GROUP" : "PERSONAL";

    const taskStatus: TaskStatus = typeof status === "string" && VALID_TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : "TODO";

    const isGoogle = (user.provider === "google" || user.id.startsWith("google_")) && !user.discordId;
    const canCreateClassTask = !isGoogle && user.roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r));

    if (taskScope === "CLASS" && !canCreateClassTask) {
      return NextResponse.json(
        {
          error: "Kamu tidak memiliki izin membuat tugas kelas",
        },
        { status: 403 },
      );
    }

    const cleanMemberIds = Array.isArray(memberIds)
      ? Array.from(new Set(memberIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0 && id !== user.id)))
      : [];

    await prisma.guild.upsert({
      where: {
        id: targetGuildId,
      },
      create: {
        id: targetGuildId,
        name: "FATISDA UNS 2026",
      },
      update: {},
    });

    const targetProdi = prodi ?? user.prodi ?? null;
    const targetKelas = kelas === "ALL" || kelas === "" ? null : (kelas ?? user.kelas ?? null);

    // Safely resolve courseId (handles DB courses, schedule synthetic IDs, and prevents constraint conflicts)
    const validCourseId = await resolveCourseId(courseId, targetProdi ?? "INFORMATIKA", targetKelas ?? null);

    const validMemberIdSet = new Set([user.id, ...cleanMemberIds]);
    const cleanSubtasks = Array.isArray(subtasks)
      ? subtasks
          .filter(
            (s): s is { title: string; assigneeId?: unknown } =>
              Boolean(s && typeof s.title === "string" && s.title.trim().length > 0),
          )
          .slice(0, 50)
          .map((s, idx) => {
            const rawAssignee = typeof s.assigneeId === "string" && s.assigneeId.trim() ? s.assigneeId.trim() : null;
            return {
              title: s.title.trim().slice(0, 160),
              assigneeId: rawAssignee && validMemberIdSet.has(rawAssignee) ? rawAssignee : null,
              order: idx,
            };
          })
      : [];

    const task = await prisma.task.create({
      data: {
        guildId: targetGuildId,
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        assignedTo: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
        dueDate: parseWibDateInput(dueDate),
        status: taskScope === "CLASS" ? "TODO" : taskStatus,
        scope: taskScope,
        prodi: targetProdi,
        kelas: targetKelas,
        courseId: validCourseId,
        createdById: user.id,
        members:
          taskScope === "GROUP"
            ? {
                create: [
                  { userId: user.id, role: "LEADER" },
                  ...cleanMemberIds.map((mId) => ({ userId: mId, role: "MEMBER" })),
                ],
              }
            : undefined,
        subtasks: cleanSubtasks.length > 0 ? { create: cleanSubtasks } : undefined,
      },

      include: {
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
          orderBy: { createdAt: "asc" },
        },
        ...(cleanSubtasks.length > 0
          ? {
              subtasks: {
                include: {
                  assignee: {
                    select: { id: true, name: true, username: true, avatar: true },
                  },
                },
                orderBy: [{ order: "asc" }, { createdAt: "asc" }],
              },
            }
          : {}),
        course: true,
      },
    });

    if (taskScope === "CLASS" && taskStatus !== "TODO") {
      try {
        await prisma.taskUserProgress.upsert({
          where: {
            taskId_userId: { taskId: task.id, userId: user.id },
          },
          create: {
            taskId: task.id,
            userId: user.id,
            status: taskStatus,
          },
          update: {
            status: taskStatus,
          },
        });
      } catch (progErr) {
        console.warn("[POST /api/tasks] Gagal menyimpan progres awal pembuat:", progErr);
      }
    }

    /*
     * Hanya kirim notifikasi Discord jika tugas bertipe CLASS.
     * Tugas bertipe PERSONAL bersifat privat dan TIDAK dikirim ke Discord.
     */
    if (task.scope === "CLASS") {
      let roleIdToMention: string | null = null;
      const targetProdi = task.prodi ?? user.prodi;
      const targetKelas = task.kelas ?? user.kelas;

      if (targetKelas) {
        if (targetProdi) {
          const specificRoleKey = `DISCORD_ROLE_${targetProdi}_${targetKelas}`;
          roleIdToMention = process.env[specificRoleKey]?.trim() || null;
        }

        if (!roleIdToMention) {
          const fallbackRoleKey = `DISCORD_ROLE_KELAS_${targetKelas}`;
          roleIdToMention = process.env[fallbackRoleKey]?.trim() || null;
        }
      }

      const dueDateFormatted = task.dueDate
        ? `${formatWib(task.dueDate, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })} WIB`
        : "Tidak ada deadline";

      const prodiNameFormatted = targetProdi ? targetProdi.replace(/_/g, " ") : "";

      const embedLines = [
        `### 📌 ${task.title}`,
        task.description ? `> ${task.description}\n` : "",
        `📚 **Mata Kuliah:** ${task.course ? `${task.course.code} (${task.course.name})` : "Umum"}`,
        `⏰ **Deadline:** ${dueDateFormatted}`,
        `🏷️ **Tipe:** Tugas Kelas (${prodiNameFormatted} ${targetKelas ?? "-"})`,
        `👤 **Dibuat oleh:** ${user.discordId ? `<@${user.discordId}>` : user.username}`,
      ].filter(Boolean);

      await sendDiscordNotification(guildId, embedLines.join("\n"), {
        roleIdToMention,
        mentionText: `📢 Pengumuman tugas baru untuk ${prodiNameFormatted} Kelas ${targetKelas ?? ""}!`,
        prodi: targetProdi,
        kelas: targetKelas,
      });
    }

    // Log activity
    try {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          userId: user.id,
          action: 'CREATED',
          newValue: task.title,
        },
      });
    } catch (logErr) {
      console.warn('[TaskActivity] Failed to log creation:', logErr);
    }

    if (scope === "GROUP" && cleanMemberIds.length > 0) {
      const actorName = user.name || user.username || "Teman sekelas";
      await notifyUsers({
        recipientIds: cleanMemberIds,
        actorId: user.id,
        type: "GROUP_INVITE",
        title: "Tugas Kelompok Baru",
        body: `${actorName} menambahkanmu ke "${task.title}"`,
        href: `/dashboard/tasks?taskId=${task.id}`,
      });
    }

    return NextResponse.json({ task: { ...task, status: taskStatus } }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);

    return NextResponse.json({ error: "Gagal membuat tugas" }, { status: 500 });
  }
}
