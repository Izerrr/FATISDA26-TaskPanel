import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Kelas, Prodi } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { prodi: true, kelas: true, semester: true },
        })
      : null;

    const { searchParams } = request.nextUrl;
    const typeParam = searchParams.get("type")?.toUpperCase() === "UAS" ? "UAS" : "UTS";
    const prodiParam = (searchParams.get("prodi") as Prodi) || user?.prodi || "INFORMATIKA";
    const semesterParam = searchParams.get("semester");
    const kelasParam = searchParams.get("kelas") as Kelas | null;

    const whereClause: any = {
      type: typeParam,
      prodi: prodiParam,
    };

    if (semesterParam && semesterParam !== "all") {
      const parsedSem = parseInt(semesterParam, 10);
      if (!isNaN(parsedSem)) {
        whereClause.semester = parsedSem;
      }
    }

    if (kelasParam && kelasParam !== ("all" as any)) {
      whereClause.kelas = kelasParam;
    }

    const exams = await prisma.examSchedule.findMany({
      where: whereClause,
      orderBy: [{ dayNum: "asc" }, { startTime: "asc" }, { kelas: "asc" }],
    });

    return NextResponse.json({
      success: true,
      type: typeParam,
      prodi: prodiParam,
      count: exams.length,
      exams,
    });
  } catch (error) {
    console.error("[GET /api/schedule/exam]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal memuat jadwal ujian.",
      },
      { status: 500 },
    );
  }
}

