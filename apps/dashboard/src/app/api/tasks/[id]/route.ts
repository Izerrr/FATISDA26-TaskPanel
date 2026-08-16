import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

    const body = await req.json();
    const { status, assignedTo, dueDate, title, description } = body;

    const existing = await prisma.task.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(assignedTo !== undefined && { assignedTo: assignedTo || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
      include: { assignee: true },
    });

    if (status && status !== existing.status) {
      await sendDiscordNotification(
        task.guildId,
        `**${task.title}**\nStatus diubah: ${existing.status} → **${status}**\nOleh: <@${token.discordId}>`
      );
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error("[Task PATCH]", err);
    return NextResponse.json({ error: "Gagal memperbarui tugas" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });

    await prisma.task.delete({ where: { id: params.id } });
    await sendDiscordNotification(
      task.guildId,
      `**${task.title}** telah dihapus oleh <@${token.discordId}>`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Task DELETE]", err);
    return NextResponse.json({ error: "Gagal menghapus tugas" }, { status: 500 });
  }
}
