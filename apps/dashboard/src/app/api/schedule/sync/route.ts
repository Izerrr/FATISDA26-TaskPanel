import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@if26/database";

export const dynamic = "force-dynamic";

const VALID_DAYS = new Set([1, 2, 3, 4, 5, 6, 7]);

const VALID_PRODI = ["INFORMATIKA", "SAINS_DATA", "INFORMATIKA_PSDKU_KEBUMEN"] as const;

const VALID_KELAS = ["A", "B", "C", "D", "E"] as const;

type ProdiValue = (typeof VALID_PRODI)[number];
type KelasValue = (typeof VALID_KELAS)[number];

function isValidProdi(value: unknown): value is ProdiValue {
  return typeof value === "string" && VALID_PRODI.includes(value as ProdiValue);
}

function isValidKelas(value: unknown): value is KelasValue {
  return typeof value === "string" && VALID_KELAS.includes(value as KelasValue);
}

async function getAuthedUser(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.discordId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: token.discordId as string,
    },
  });
}

function isValidTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const canSync = user.roles.includes("ADMIN");

    if (!canSync) {
      return NextResponse.json(
        {
          error: "Tidak memiliki izin sinkronisasi jadwal",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    if (!Array.isArray(body.schedules)) {
      return NextResponse.json(
        {
          error: "schedules harus berupa array",
        },
        { status: 400 },
      );
    }

    if (!isValidProdi(body.prodi)) {
      return NextResponse.json(
        {
          error: "Program studi tidak valid",
        },
        { status: 400 },
      );
    }

    if (!isValidKelas(body.kelas)) {
      return NextResponse.json(
        {
          error: "Kelas tidak valid",
        },
        { status: 400 },
      );
    }

    const prodi = body.prodi;
    const kelas = body.kelas;

    const schedules = body.schedules.map((item: unknown, index: number) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Data jadwal ke-${index + 1} tidak valid`);
      }

      const schedule = item as Record<string, unknown>;

      if (typeof schedule.day !== "number" || !VALID_DAYS.has(schedule.day)) {
        throw new Error(`Hari pada jadwal ke-${index + 1} tidak valid`);
      }

      if (!isValidTime(schedule.startTime)) {
        throw new Error(`startTime pada jadwal ke-${index + 1} tidak valid`);
      }

      if (!isValidTime(schedule.endTime)) {
        throw new Error(`endTime pada jadwal ke-${index + 1} tidak valid`);
      }

      if (schedule.courseId !== null && typeof schedule.courseId !== "string") {
        throw new Error(`courseId pada jadwal ke-${index + 1} tidak valid`);
      }

      if (typeof schedule.courseId === "string" && schedule.courseId.trim() === "") {
        throw new Error(`courseId pada jadwal ke-${index + 1} tidak valid`);
      }

      const startMinutes = Number(schedule.startTime.slice(0, 2)) * 60 + Number(schedule.startTime.slice(3, 5));

      const endMinutes = Number(schedule.endTime.slice(0, 2)) * 60 + Number(schedule.endTime.slice(3, 5));

      if (endMinutes <= startMinutes) {
        throw new Error(`Jam selesai harus setelah jam mulai pada jadwal ke-${index + 1}`);
      }

      return {
        prodi,
        kelas,
        courseId: typeof schedule.courseId === "string" ? schedule.courseId : null,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: typeof schedule.room === "string" && schedule.room.trim() ? schedule.room.trim() : null,
        lecturer: typeof schedule.lecturer === "string" && schedule.lecturer.trim() ? schedule.lecturer.trim() : null,
      };
    });

    const deleteOperation = prisma.schedule.deleteMany({
      where: {
        prodi,
        kelas,
      },
    });

    if (schedules.length === 0) {
      await prisma.$transaction([deleteOperation]);
    } else {
      await prisma.$transaction([
        deleteOperation,
        prisma.schedule.createMany({
          data: schedules,
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      count: schedules.length,
      prodi,
      kelas,
    });
  } catch (error) {
    console.error("[POST /api/schedule/sync]", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal melakukan sinkronisasi jadwal",
      },
      { status: 400 },
    );
  }
}
