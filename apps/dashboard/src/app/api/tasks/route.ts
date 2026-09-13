import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";
type TaskScope = "PERSONAL" | "CLASS";
type TaskStatus = "TODO" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";
const VALID_TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const guildId = searchParams.get("guildId");

    if (!guildId) {
      return NextResponse.json({ error: "Server wajib dipilih" }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        guildId,
        OR: [{ scope: "CLASS" }, { scope: "PERSONAL", createdById: token.discordId as string }],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        course: true,
      },
      orderBy: {
        createdAt: "desc",
      },
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
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const body = await req.json();

    const { guildId, title, description, assignedTo, dueDate, status, scope, prodi, kelas, courseId } = body;

    if (typeof guildId !== "string" || !guildId) {
      return NextResponse.json({ error: "Server wajib dipilih" }, { status: 400 });
    }

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: token.discordId as string,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const taskScope: TaskScope = scope === "CLASS" ? "CLASS" : "PERSONAL";

    const taskStatus: TaskStatus = typeof status === "string" && VALID_TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : "TODO";

    const canCreateClassTask = user.roles.includes("ADMIN") || user.roles.includes("PJ_KELAS") || user.roles.includes("PJ_MATKUL");

    if (taskScope === "CLASS" && !canCreateClassTask) {
      return NextResponse.json(
        {
          error: "Kamu tidak memiliki izin membuat tugas kelas",
        },
        { status: 403 },
      );
    }

    await prisma.guild.upsert({
      where: {
        id: guildId,
      },
      create: {
        id: guildId,
        name: "Discord Server",
      },
      update: {},
    });

    const task = await prisma.task.create({
      data: {
        guildId,
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        assignedTo: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: taskStatus,
        scope: taskScope,
        prodi: prodi ?? user.prodi ?? null,
        kelas: kelas ?? user.kelas ?? null,
        courseId: courseId || null,
        createdById: user.id,
      },
      include: {
        createdBy: true,
        assignee: true,
        course: true,
      },
    });

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
        ? new Date(task.dueDate).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Tidak ada deadline";

      const prodiNameFormatted = targetProdi ? targetProdi.replace(/_/g, " ") : "";

      const embedLines = [
        `### 📌 ${task.title}`,
        task.description ? `> ${task.description}\n` : "",
        `📚 **Mata Kuliah:** ${task.course ? `${task.course.code} (${task.course.name})` : "Umum"}`,
        `⏰ **Deadline:** ${dueDateFormatted}`,
        `🏷️ **Tipe:** Tugas Kelas (${prodiNameFormatted} ${targetKelas ?? "-"})`,
        `👤 **Dibuat oleh:** <@${user.id}>`,
      ].filter(Boolean);

      await sendDiscordNotification(guildId, embedLines.join("\n"), {
        roleIdToMention,
        mentionText: `📢 Pengumuman tugas baru untuk ${prodiNameFormatted} Kelas ${targetKelas ?? ""}!`,
        prodi: targetProdi,
        kelas: targetKelas,
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);

    return NextResponse.json({ error: "Gagal membuat tugas" }, { status: 500 });
  }
}
