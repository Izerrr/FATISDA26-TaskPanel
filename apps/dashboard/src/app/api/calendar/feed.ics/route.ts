import { NextRequest, NextResponse } from "next/server";
import type { Kelas, Prodi } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildCalendarFeedIcs } from "@/lib/calendar-feed";
import { matchesAgamaFilter } from "@/lib/schedule/constants";
import { isMissingTableError } from "@/lib/task-access";

export const dynamic = "force-dynamic";

function matchesExamAgamaFilter(
  courseName: string,
  kelas: string,
  filter: string | null | undefined,
  targetKelas: Kelas | null
): boolean {
  const norm = courseName.toLowerCase();
  if (!norm.includes("agama")) return true;

  const selected = (filter || "islam").trim().toLowerCase();
  if (selected === "semua" || selected === "all") return true;
  if (selected === "kristen") return norm.includes("kristen");
  if (selected === "katholik" || selected === "katolik") return norm.includes("katholik") || norm.includes("katolik");
  if (selected === "budha" || selected === "buddha") return norm.includes("budha") || norm.includes("buddha");
  if (selected === "hindu") return norm.includes("hindu");
  if (selected === "konghucu" || selected === "khonghucu") return norm.includes("konghucu") || norm.includes("khonghucu");

  if (norm.includes("islam")) {
    return !targetKelas || kelas === targetKelas;
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenValue = searchParams.get("token")?.trim();
    const agamaParam = searchParams.get("agama");

    if (!tokenValue || tokenValue.length < 16) {
      return new NextResponse("Invalid calendar feed token", { status: 401 });
    }

    let feedRecord: {
      user: {
        id: string;
        prodi: Prodi | null;
        kelas: Kelas | null;
        semester: number | null;
        roles: string[];
      };
    } | null = null;

    try {
      feedRecord = await prisma.calendarFeedToken.findUnique({
        where: { token: tokenValue },
        select: {
          user: {
            select: {
              id: true,
              prodi: true,
              kelas: true,
              semester: true,
              roles: true,
            },
          },
        },
      });
    } catch (err) {
      if (isMissingTableError(err)) {
        return new NextResponse("Calendar feed table is not initialized", { status: 503 });
      }
      throw err;
    }

    if (!feedRecord?.user) {
      return new NextResponse("Calendar feed token not found", { status: 404 });
    }

    const user = feedRecord.user;
    const prodi: Prodi = user.prodi ?? "INFORMATIKA";
    const kelas: Kelas | null = user.kelas ?? null;
    const semester: number = user.semester ?? 1;

    // 1. Fetch class schedules matching user's prodi/kelas/semester
    const scheduleWhere: { prodi: Prodi; semester: number; kelas?: Kelas } = {
      prodi,
      semester,
    };
    if (kelas) scheduleWhere.kelas = kelas;

    const rawSchedules = await prisma.schedule.findMany({
      where: scheduleWhere,
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        courseName: true,
        day: true,
        startTime: true,
        endTime: true,
        room: true,
        lecturer: true,
        rawClassCode: true,
        kelas: true,
      },
    });

    const filteredSchedules = rawSchedules.filter((s) => matchesAgamaFilter(s.courseName, agamaParam));
    const uniqueSchedulesMap = new Map<string, (typeof filteredSchedules)[number]>();
    for (const s of filteredSchedules) {
      const key = `${s.day}|${s.startTime}|${s.endTime}|${s.room ?? ""}|${s.courseName.toLowerCase().trim()}`;
      if (!uniqueSchedulesMap.has(key) || s.kelas === kelas) {
        uniqueSchedulesMap.set(key, s);
      }
    }
    const schedules = Array.from(uniqueSchedulesMap.values());

    // 2. Fetch accessible tasks with dueDate
    const classConditions: Array<{ OR: Array<{ prodi?: Prodi | null; kelas?: Kelas | null }> }> = [];
    if (user.prodi) {
      classConditions.push({ OR: [{ prodi: null }, { prodi: user.prodi }] });
    }
    if (user.kelas) {
      classConditions.push({ OR: [{ kelas: null }, { kelas: user.kelas }] });
    }

    const rawTasks = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
        OR: [
          {
            scope: "CLASS",
            ...(classConditions.length > 0 ? { AND: classConditions } : {}),
          },
          { scope: "PERSONAL", createdById: user.id },
          { scope: "PERSONAL", assignedTo: user.id },
          {
            scope: "GROUP",
            OR: [{ createdById: user.id }, { members: { some: { userId: user.id } } }],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        scope: true,
        dueDate: true,
        course: {
          select: { name: true },
        },
        userProgress: {
          where: { userId: user.id },
          select: { status: true },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 150,
    });

    const openTasks = rawTasks.map((t) => ({
      id: t.id,
      title: t.title,
      courseName: t.course?.name ?? null,
      description: t.description,
      status: t.scope === "CLASS" ? (t.userProgress[0]?.status ?? "TODO") : t.status,
      scope: t.scope,
      dueDate: t.dueDate,
    }));

    // 3. Fetch exam schedules matching user's prodi/semester/kelas
    const rawExams = await prisma.examSchedule.findMany({
      where: {
        prodi,
        semester,
        ...(kelas
          ? {
              OR: [{ kelas }, { courseName: { contains: "Agama", mode: "insensitive" } }],
            }
          : {}),
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        type: true,
        courseName: true,
        date: true,
        startTime: true,
        endTime: true,
        room: true,
        kelas: true,
      },
    });

    const exams = rawExams.filter((e) => matchesExamAgamaFilter(e.courseName, e.kelas, agamaParam, kelas));

    const icsContent = buildCalendarFeedIcs({
      schedules,
      tasks: openTasks,
      exams,
      prodi,
      kelas,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="fatisda-live.ics"',
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/calendar/feed.ics]", error);
    return new NextResponse("Failed to generate calendar feed", { status: 500 });
  }
}
