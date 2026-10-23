import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Kelas, Prodi } from "@/types";
import {
  getDynamicClassGroupSource,
  parseGoogleSheetsUrl,
  upsertClassGroupSource,
} from "@/lib/settings";
import { fetchClassGroupsData, invalidateClassGroupsCache } from "@/lib/groups/fetch-groups";
import { buildStudentTeamSummary } from "@/lib/groups/parse-groups";

export const dynamic = "force-dynamic";

const VALID_PRODI: Prodi[] = ["INFORMATIKA", "SAINS_DATA", "INFORMATIKA_PSDKU_KEBUMEN"];
const VALID_KELAS: Kelas[] = ["A", "B", "C", "D", "E"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sesi login diperlukan untuk mengakses ruang kelas." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        nim: true,
        prodi: true,
        kelas: true,
        semester: true,
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    const isSuperManager = user.roles.some((r) =>
      ["ADMIN", "OWNER", "KETUA_ANGKATAN"].includes(r),
    );

    const { searchParams } = new URL(request.url);
    const reqProdi = searchParams.get("prodi") as Prodi | null;
    const reqKelas = searchParams.get("kelas") as Kelas | null;
    const reqSemesterRaw = searchParams.get("semester");
    const reqSemester = reqSemesterRaw ? parseInt(reqSemesterRaw, 10) : null;
    const forceRefresh = searchParams.get("refresh") === "true";

    // Strict class & semester isolation for non-super-managers
    if (!isSuperManager) {
      if (!user.prodi || !user.kelas) {
        return NextResponse.json({
          success: true,
          needsProfileSetup: true,
          isSuperManager: false,
          canManageSource: false,
          userProfile: {
            username: user.username,
            nim: user.nim,
            prodi: user.prodi,
            kelas: user.kelas,
            semester: user.semester ?? 1,
          },
        });
      }

      const userSemester = user.semester ?? 1;
      if (
        (reqProdi && reqProdi !== user.prodi) ||
        (reqKelas && reqKelas !== user.kelas) ||
        (reqSemester !== null && !Number.isNaN(reqSemester) && reqSemester !== userSemester)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Akses dibatasi: Anda hanya dapat melihat ruang kelas dan kelompok milik kelas serta semester Anda sendiri.",
          },
          { status: 403 },
        );
      }
    }

    const targetProdi: Prodi =
      isSuperManager && reqProdi && VALID_PRODI.includes(reqProdi)
        ? reqProdi
        : (user.prodi ?? "INFORMATIKA");

    const targetKelas: Kelas =
      isSuperManager && reqKelas && VALID_KELAS.includes(reqKelas)
        ? reqKelas
        : (user.kelas ?? "B");

    const targetSemester: number =
      isSuperManager && reqSemester !== null && !Number.isNaN(reqSemester) && reqSemester >= 1 && reqSemester <= 8
        ? reqSemester
        : (user.semester ?? 1);

    const canManageSource =
      isSuperManager ||
      (user.roles.includes("PJ_KELAS") &&
        user.prodi === targetProdi &&
        user.kelas === targetKelas);

    const source = await getDynamicClassGroupSource(targetProdi, targetKelas, targetSemester);

    if (!source || !source.spreadsheetId?.trim()) {
      return NextResponse.json({
        success: true,
        needsProfileSetup: false,
        configured: false,
        prodi: targetProdi,
        kelas: targetKelas,
        semester: targetSemester,
        isSuperManager,
        canManageSource,
        userProfile: {
          username: user.username,
          nim: user.nim,
          prodi: user.prodi,
          kelas: user.kelas,
          semester: user.semester ?? 1,
        },
      });
    }

    const data = await fetchClassGroupsData(source, forceRefresh);
    const myAssignments = buildStudentTeamSummary(data.tabs, user.nim, user.username);

    return NextResponse.json({
      success: true,
      needsProfileSetup: false,
      configured: true,
      prodi: targetProdi,
      kelas: targetKelas,
      semester: targetSemester,
      isSuperManager,
      canManageSource,
      source,
      data,
      myAssignments,
      userProfile: {
        username: user.username,
        nim: user.nim,
        prodi: user.prodi,
        kelas: user.kelas,
        semester: user.semester ?? 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/groups]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat data kelompok kelas dari Google Spreadsheet.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sesi login diperlukan." },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        prodi: true,
        kelas: true,
        semester: true,
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    const isSuperManager = user.roles.some((r) =>
      ["ADMIN", "OWNER", "KETUA_ANGKATAN"].includes(r),
    );

    const body = await request.json();
    const targetProdi: Prodi = isSuperManager && VALID_PRODI.includes(body.prodi) ? body.prodi : (user.prodi as Prodi);
    const targetKelas: Kelas = isSuperManager && VALID_KELAS.includes(body.kelas) ? body.kelas : (user.kelas as Kelas);
    const targetSemester: number =
      isSuperManager && typeof body.semester === "number" && body.semester >= 1 && body.semester <= 8
        ? body.semester
        : (user.semester ?? 1);

    const canManageSource =
      isSuperManager ||
      (user.roles.includes("PJ_KELAS") &&
        user.prodi === targetProdi &&
        user.kelas === targetKelas);

    if (!canManageSource || !targetProdi || !targetKelas) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak. Hanya Admin, Ketua Angkatan, atau PJ Kelas terkait yang dapat mengatur sumber spreadsheet kelas ini.",
        },
        { status: 403 },
      );
    }

    const sheetUrl = typeof body.sheetUrl === "string" ? body.sheetUrl.trim() : "";
    const label = typeof body.label === "string" ? body.label.trim() : "";

    if (!sheetUrl) {
      return NextResponse.json(
        { success: false, error: "Tautan Google Spreadsheet tidak boleh kosong." },
        { status: 400 },
      );
    }

    const parsed = parseGoogleSheetsUrl(sheetUrl);
    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tautan Google Spreadsheet tidak valid. Salin URL langsung dari address bar Google Sheets.",
        },
        { status: 400 },
      );
    }

    invalidateClassGroupsCache(parsed.spreadsheetId);

    const updatedList = await upsertClassGroupSource(
      {
        prodi: targetProdi,
        kelas: targetKelas,
        semester: targetSemester,
        spreadsheetId: parsed.spreadsheetId,
        gid: parsed.gid,
        label: label || `Kelompok ${targetProdi} Kelas ${targetKelas} (Sem ${targetSemester})`,
      },
      user.id,
    );

    return NextResponse.json({
      success: true,
      classGroupSources: updatedList,
    });
  } catch (error) {
    console.error("[PUT /api/groups]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan kelompok kelas.",
      },
      { status: 500 },
    );
  }
}

