import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { canAccessTask } from "@/lib/task-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (token.userId ?? token.discordId) as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // Proteksi IDOR: Riwayat tugas PERSONAL & GROUP hanya dapat dilihat pemilik/anggota terkait
    if (!canAccessTask(task, userId)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const activities = await (prisma as any).taskActivity.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          select: { name: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("[TaskActivity GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
