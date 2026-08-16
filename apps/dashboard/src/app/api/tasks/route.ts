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

    await sendDiscordNotification(guildId, ["**Tugas baru dibuat**", "", `**${task.title}**`, `Status: ${task.status}`, `Scope: ${task.scope}`, `Dibuat oleh: <@${user.id}>`].join("\n"));

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);

    return NextResponse.json({ error: "Gagal membuat tugas" }, { status: 500 });
  }
}
