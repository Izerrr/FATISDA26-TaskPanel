import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Prodi, Kelas } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function isValidProdi(value: unknown): value is Prodi {
  return Object.values(Prodi).includes(value as Prodi);
}

function isValidKelas(value: unknown): value is Kelas {
  return Object.values(Kelas).includes(value as Kelas);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: {
        ...(user.prodi
          ? {
              prodi: user.prodi,
            }
          : {}),
        ...(user.kelas
          ? {
              OR: [{ kelas: user.kelas }, { kelas: null }],
            }
          : {}),
      },
      orderBy: [
        {
          code: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      courses,
    });
  } catch (error) {
    console.error("[GET /api/courses]", error);

    return NextResponse.json({ error: "Gagal memuat mata kuliah" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const isAdmin = user.roles.includes("ADMIN" as never);

    if (!isAdmin) {
      return NextResponse.json({ error: "Hanya administrator yang dapat menambahkan mata kuliah" }, { status: 403 });
    }

    const body = await req.json();

    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const prodi = body.prodi;
    const kelas = body.kelas === null || body.kelas === undefined || body.kelas === "" ? null : body.kelas;

    if (!code) {
      return NextResponse.json({ error: "Kode mata kuliah wajib diisi" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Nama mata kuliah wajib diisi" }, { status: 400 });
    }

    if (!isValidProdi(prodi)) {
      return NextResponse.json({ error: "Program studi tidak valid" }, { status: 400 });
    }

    if (kelas !== null && !isValidKelas(kelas)) {
      return NextResponse.json({ error: "Kelas tidak valid" }, { status: 400 });
    }

    const existingCourse = await prisma.course.findUnique({
      where: {
        code_prodi_kelas: {
          code,
          prodi,
          kelas,
        },
      },
    });

    if (existingCourse) {
      return NextResponse.json({ error: "Mata kuliah dengan kode tersebut sudah ada" }, { status: 409 });
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        prodi,
        kelas,
      },
    });

    return NextResponse.json(
      {
        course,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/courses]", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menambahkan mata kuliah",
      },
      { status: 500 },
    );
  }
}
