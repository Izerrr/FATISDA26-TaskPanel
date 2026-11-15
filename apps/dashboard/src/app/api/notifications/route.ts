import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { isMissingTableError } from "@/lib/task-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

      return NextResponse.json({ notifications, unreadCount });
    } catch (err) {
      if (isMissingTableError(err)) {
        return NextResponse.json({ notifications: [], unreadCount: 0 });
      }
      throw err;
    }
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Gagal memuat notifikasi" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const markAll = Boolean(body.all);
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0)
      : [];

    try {
      if (markAll) {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      } else if (ids.length > 0) {
        await prisma.notification.updateMany({
          where: { userId, id: { in: ids } },
          data: { isRead: true },
        });
      }
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/notifications]", error);
    return NextResponse.json({ error: "Gagal memperbarui status notifikasi" }, { status: 500 });
  }
}
