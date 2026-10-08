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
    const agamaParam = searchParams.get("agama");

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
      // Include user's class OR any Agama courses so batch-wide religion classes (Kristen, Katholik, Budha) can be matched
      whereClause.OR = [
        { kelas: kelasParam },
        { courseName: { contains: "Agama", mode: "insensitive" } },
      ];
    }

    const exams = await prisma.examSchedule.findMany({
      where: whereClause,
      orderBy: [{ dayNum: "asc" }, { startTime: "asc" }, { kelas: "asc" }],
    });

    const matchesAgamaFilter = (
      exam: { courseName: string; kelas: string },
      filter: string | null | undefined,
      targetKelas: string | null,
    ): boolean => {
      const norm = exam.courseName.toLowerCase();
      if (!norm.includes("agama")) return true;

      // In grand view without explicit filter, show all
      if (!filter && (!targetKelas || targetKelas === "all")) {
        return true;
      }

      const selected = (filter || "islam").trim().toLowerCase();
      if (selected === "semua" || selected === "all") return true;

      if (selected === "kristen") return norm.includes("kristen");
      if (selected === "katholik" || selected === "katolik") return norm.includes("katholik") || norm.includes("katolik");
      if (selected === "budha" || selected === "buddha") return norm.includes("budha") || norm.includes("buddha");
      if (selected === "hindu") return norm.includes("hindu");

      // Default: Islam -> must match "islam" AND if a target class is given, must match that target class
      if (norm.includes("islam")) {
        return !targetKelas || targetKelas === "all" || exam.kelas === targetKelas;
      }

      return false;
    };

    const filteredExams = exams.filter((e) => matchesAgamaFilter(e, agamaParam, kelasParam));

    return NextResponse.json({
      success: true,
      type: typeParam,
      prodi: prodiParam,
      count: filteredExams.length,
      exams: filteredExams,
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

