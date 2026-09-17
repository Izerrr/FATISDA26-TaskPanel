import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncSchedule } from "@/lib/schedule/schedule-sync";
import { PRODI_VALUES, type Prodi } from "@/lib/schedule/types";

export const dynamic = "force-dynamic";

function isValidProdi(value: string | null): value is Prodi {
  if (value === null) {
    return false;
  }

  return PRODI_VALUES.some((prodi) => prodi === value);
}

export async function GET(request: NextRequest) {
  try {
    // 1. Cek Cron Secret jika sinkronisasi dipanggil oleh background cron eksternal
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthorized) {
      // 2. Cek Session User jika dipanggil secara manual dari web
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized. Sesi login diperlukan." }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });

      const isManager = Boolean(user?.roles.some((r) => ["ADMIN", "OWNER"].includes(r)));
      if (!isManager) {
        return NextResponse.json({ success: false, error: "Akses ditolak. Hanya Admin yang dapat memicu sinkronisasi jadwal." }, { status: 403 });
      }
    }
    const prodiParam = request.nextUrl.searchParams.get("prodi");

    if (!isValidProdi(prodiParam)) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter prodi tidak valid.",
          supportedProdi: PRODI_VALUES,
        },
        { status: 400 },
      );
    }

    const result = await syncSchedule(prodiParam);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[GET /api/schedule/sync]", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal melakukan sinkronisasi jadwal.",
      },
      { status: 500 },
    );
  }
}
