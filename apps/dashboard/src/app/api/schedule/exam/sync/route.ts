import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncExamSchedule } from "@/lib/schedule/exam/sync-exam";
import type { Prodi } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleSync(request);
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  try {
    // 1. Check Cron Secret if triggered by external cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthorized) {
      // 2. Check session and admin role
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized. Sesi login diperlukan." },
          { status: 401 },
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });

      const isManager = Boolean(user?.roles.some((r) => ["ADMIN", "OWNER"].includes(r)));
      if (!isManager) {
        return NextResponse.json(
          {
            success: false,
            error: "Akses ditolak. Hanya Admin yang dapat memicu sinkronisasi jadwal ujian.",
          },
          { status: 403 },
        );
      }
    }

    // Parse options from query params or body
    let body: any = {};
    if (request.method === "POST") {
      body = await request.json().catch(() => ({}));
    }

    const { searchParams } = request.nextUrl;
    const prodi = (body.prodi || searchParams.get("prodi") || "INFORMATIKA") as Prodi;
    const examType = (body.type || searchParams.get("type") || "UTS").toUpperCase() === "UAS" ? "UAS" : "UTS";
    const spreadsheetId = body.spreadsheetId || searchParams.get("spreadsheetId");
    const gid = body.gid || searchParams.get("gid");

    const result = await syncExamSchedule({
      prodi,
      examType,
      spreadsheetId,
      gid,
    });

    return NextResponse.json({
      success: true,
      message: `${result.totalCount} sesi ujian ${result.type} berhasil disinkronkan untuk ${result.prodi}.`,
      ...result,
    });
  } catch (error) {
    console.error("[POST/GET /api/schedule/exam/sync]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal melakukan sinkronisasi jadwal ujian.",
      },
      { status: 500 },
    );
  }
}

