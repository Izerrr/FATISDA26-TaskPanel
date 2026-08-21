import { NextRequest, NextResponse } from "next/server";

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
