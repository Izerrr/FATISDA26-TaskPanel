import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get("guildId");
    if (!guildId) return NextResponse.json({ error: "Server wajib dipilih" }, { status: 400 });

    const tasks = await prisma.task.findMany({
      where: { guildId },
      include: { assignee: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[Tasks GET]", err);
    return NextResponse.json({ error: "Gagal memuat tugas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

    const body = await req.json();
    const { guildId, title, description, assignedTo, dueDate, status } = body;
    if (!guildId || !title?.trim()) {
      return NextResponse.json({ error: "Judul dan server wajib diisi" }, { status: 400 });
    }

    await prisma.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, name: "Server Discord" },
      update: {},
    });

    const task = await prisma.task.create({
      data: {
        guildId,
        title: title.trim(),
        description: description?.trim() || null,
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "TODO",
      },
      include: { assignee: true },
    });

    await sendDiscordNotification(
      guildId,
      `**Tugas baru dibuat**\n\n**${task.title}**\nStatus: ${task.status}\nDibuat oleh: <@${token.discordId}>`
    );

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("[Tasks POST]", err);
    return NextResponse.json({ error: "Gagal membuat tugas" }, { status: 500 });
  }
}
