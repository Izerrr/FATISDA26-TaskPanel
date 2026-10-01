import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = token.userId ?? token.discordId;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const announcement = await (prisma as any).announcement.findUnique({
      where: { id: params.id }
    });

    if (!announcement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { roles: true }
    });

    const isPrivileged = user?.roles.some((r: string) => ['ADMIN', 'OWNER'].includes(r));

    if (announcement.authorId !== userId && !isPrivileged) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await (prisma as any).announcement.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Announcements DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
