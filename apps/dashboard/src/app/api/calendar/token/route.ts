import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { isMissingTableError } from "@/lib/task-access";
import { generateCalendarFeedToken } from "@/lib/calendar-feed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authToken = await getToken({ req, secret: getAuthSecret() });
    const userId = (authToken?.userId ?? authToken?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      let record = await prisma.calendarFeedToken.findUnique({
        where: { userId },
        select: { token: true, updatedAt: true },
      });

      if (!record) {
        record = await prisma.calendarFeedToken.create({
          data: {
            userId,
            token: generateCalendarFeedToken(),
          },
          select: { token: true, updatedAt: true },
        });
      }

      return NextResponse.json({
        token: record.token,
        feedPath: `/api/calendar/feed.ics?token=${record.token}`,
        updatedAt: record.updatedAt,
        tableMissing: false,
      });
    } catch (err) {
      if (isMissingTableError(err)) {
        return NextResponse.json({
          token: null,
          feedPath: null,
          tableMissing: true,
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("[GET /api/calendar/token]", error);
    return NextResponse.json({ error: "Gagal mengambil token kalender" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authToken = await getToken({ req, secret: getAuthSecret() });
    const userId = (authToken?.userId ?? authToken?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nextToken = generateCalendarFeedToken();
    try {
      const record = await prisma.calendarFeedToken.upsert({
        where: { userId },
        create: {
          userId,
          token: nextToken,
        },
        update: {
          token: nextToken,
        },
        select: { token: true, updatedAt: true },
      });

      return NextResponse.json({
        token: record.token,
        feedPath: `/api/calendar/feed.ics?token=${record.token}`,
        updatedAt: record.updatedAt,
        tableMissing: false,
      });
    } catch (err) {
      if (isMissingTableError(err)) {
        return NextResponse.json(
          { error: "Fitur feed kalender belum aktif di database. Jalankan pnpm db:push terlebih dahulu." },
          { status: 503 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("[POST /api/calendar/token]", error);
    return NextResponse.json({ error: "Gagal memperbarui token kalender" }, { status: 500 });
  }
}
