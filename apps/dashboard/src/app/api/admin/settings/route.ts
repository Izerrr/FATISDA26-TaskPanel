import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAllAdminSettings,
  rollbackSourcesSetting,
  saveAdminSettings,
} from "@/lib/settings";
import { invalidateClassGroupsCache } from "@/lib/groups/fetch-groups";

export const dynamic = "force-dynamic";

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, error: "Unauthorized. Sesi login diperlukan." },
        { status: 401 },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, roles: true },
  });

  const isManager = Boolean(user?.roles.some((r) => ["ADMIN", "OWNER"].includes(r)));
  if (!isManager || !user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Admin atau Owner yang memiliki izin." },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true as const,
    userId: user.id,
  };
}

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) return auth.response;

    const [settings, scheduleSyncs, examGroups] = await Promise.all([
      getAllAdminSettings(),
      prisma.scheduleSync.findMany({
        orderBy: { lastSyncedAt: "desc" },
      }),
      prisma.examSchedule.groupBy({
        by: ["prodi", "type"],
        _count: { _all: true },
        _max: { updatedAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      ...settings,
      scheduleSyncs,
      examStats: examGroups.map((g) => ({
        prodi: g.prodi,
        type: g.type,
        count: g._count._all,
        lastSyncedAt: g._max.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal memuat pengaturan sistem.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const updated = await saveAdminSettings(
      {
        examMode: body.examMode,
        scheduleSources: body.scheduleSources,
        examSources: body.examSources,
        classGroupSources: body.classGroupSources,
      },
      auth.userId,
    );
    if (body.classGroupSources) {
      invalidateClassGroupsCache();
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan sistem berhasil disimpan.",
      ...updated,
    });
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal menyimpan pengaturan sistem.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.authorized) return auth.response;

    const body = await request.json().catch(() => ({}));
    if (body.action === "rollback") {
      const restored = await rollbackSourcesSetting(auth.userId);
      return NextResponse.json({
        success: true,
        message: "Konfigurasi tautan Google Sheets berhasil dikembalikan ke versi sebelumnya.",
        ...restored,
      });
    }

    return NextResponse.json(
      { success: false, error: "Aksi tidak dikenali." },
      { status: 400 },
    );
  } catch (error) {
    console.error("[POST /api/admin/settings]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Gagal memproses aksi pengaturan.",
      },
      { status: 500 },
    );
  }
}

