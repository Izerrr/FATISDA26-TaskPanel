import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comments = await (prisma as any).taskComment.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("[TaskComments GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = token.userId ?? token.discordId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const newComment = await (prisma as any).taskComment.create({
      data: {
        taskId: params.id,
        authorId: userId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("[TaskComments POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
