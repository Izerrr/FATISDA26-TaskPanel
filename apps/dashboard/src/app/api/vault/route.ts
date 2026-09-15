import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { resolveCourseId } from "@/lib/course-resolver";
import type { Kelas, Prodi } from "@prisma/client";

export const dynamic = "force-dynamic";

const AUTHORIZED_ROLES = ["ADMIN", "OWNER", "PJ_KELAS", "PJ_MATKUL", "KETUA_ANGKATAN"];

function normalizeUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
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

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const prodi = (searchParams.get("prodi") as Prodi) || user.prodi || "INFORMATIKA";
    const kelas = (searchParams.get("kelas") as Kelas) || user.kelas;
    const courseName = searchParams.get("courseName");
    const courseId = searchParams.get("courseId");

    const whereClause: any = {
      prodi,
    };

    if (courseName) {
      whereClause.courseName = { equals: courseName.trim(), mode: "insensitive" };
    }

    if (courseId) {
      whereClause.OR = [{ courseId }, { courseName: { equals: courseId.replace(/^sched-/, ""), mode: "insensitive" } }];
    }

    if (kelas) {
      whereClause.OR = [{ kelas }, { kelas: null }];
    }

    const vaults = await prisma.courseVault.findMany({
      where: whereClause,
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ courseName: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ vaults });
  } catch (error) {
    console.error("[GET /api/vault]", error);
    return NextResponse.json({ error: "Gagal memuat data vault" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const userRoles = (user.roles || []) as string[];
    const isAuthorized = userRoles.some((r) => AUTHORIZED_ROLES.includes(r));

    if (!isAuthorized) {
      return NextResponse.json({ error: "Akses ditolak. Hanya PJ Mata Kuliah, PJ Kelas, dan Admin yang dapat mengelola Course Vault." }, { status: 403 });
    }

    const body = await req.json();
    const rawCourseName = typeof body.courseName === "string" ? body.courseName.trim() : "";

    if (!rawCourseName) {
      return NextResponse.json({ error: "Nama mata kuliah wajib diisi" }, { status: 400 });
    }

    const targetProdi = (body.prodi as Prodi) || user.prodi || "INFORMATIKA";
    const targetKelas = body.kelas === "" || body.kelas === undefined ? (user.kelas ?? null) : (body.kelas as Kelas | null);
    const targetSemester = typeof body.semester === "number" ? body.semester : body.semester ? parseInt(body.semester, 10) : null;

    // Resolve courseId into database if possible
    let resolvedCourseId = body.courseId;
    if (!resolvedCourseId || resolvedCourseId.startsWith("sched-")) {
      try {
        resolvedCourseId = await resolveCourseId(rawCourseName, targetProdi, targetKelas);
      } catch (e) {
        console.warn("[POST /api/vault] Gagal resolve courseId:", e);
      }
    }

    const driveUrl = normalizeUrl(body.driveUrl);
    const modulUrl = normalizeUrl(body.modulUrl);
    const silabusUrl = normalizeUrl(body.silabusUrl);
    const communityUrl = normalizeUrl(body.communityUrl);
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    const extraLinks = Array.isArray(body.extraLinks) ? body.extraLinks : [];

    const vault = await prisma.courseVault.upsert({
      where: {
        courseName_prodi_kelas: {
          courseName: rawCourseName,
          prodi: targetProdi,
          kelas: targetKelas as Kelas,
        },
      },
      create: {
        courseId: resolvedCourseId || null,
        courseName: rawCourseName,
        prodi: targetProdi,
        kelas: targetKelas as Kelas,
        semester: isNaN(targetSemester as number) ? null : targetSemester,
        driveUrl,
        modulUrl,
        silabusUrl,
        communityUrl,
        notes,
        extraLinks,
        updatedById: user.id,
      },
      update: {
        courseId: resolvedCourseId || undefined,
        semester: isNaN(targetSemester as number) ? undefined : targetSemester,
        driveUrl,
        modulUrl,
        silabusUrl,
        communityUrl,
        notes,
        extraLinks,
        updatedById: user.id,
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      vault,
      message: "Data Course Vault berhasil disimpan!",
    });
  } catch (error) {
    console.error("[POST /api/vault]", error);
    return NextResponse.json({ error: "Gagal menyimpan data vault" }, { status: 500 });
  }
}
