import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const activities = await (prisma as any).taskActivity.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          select: { username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("[TaskActivity GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
