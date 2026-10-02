import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AUTHORIZED_ROLES = ["ADMIN", "OWNER", "KETUA_ANGKATAN"];

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    const authedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: true, username: true },
    });

    if (!authedUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const userRoles = (authedUser.roles || []) as string[];
    const isAuthorized = userRoles.some((r) => AUTHORIZED_ROLES.includes(r));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin, Owner, dan Pengurus Angkatan yang dapat melihat analytics." },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Jalankan semua query agregasi secara paralel
    const [
      totalUsers,
      googleOnlyUsers,
      discordOnlyUsers,
      linkedUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      usersByProdiRaw,
      usersByKelasRaw,
      recentUsersRaw,
      totalTasks,
      tasksByStatusRaw,
      tasksByScopeRaw,
      totalComments,
      totalActivities,
      totalDiscussions,
      totalReplies,
      totalVaults,
      feedbackByCategoryRaw,
      feedbackByStatusRaw,
      recentFeedbacksRaw,
      adminCount,
      pjKelasCount,
      pjMatkulCount,
      ketuaAngkatanCount,
      ownerCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          googleId: { not: null },
          discordId: null,
        },
      }),
      prisma.user.count({
        where: {
          discordId: { not: null },
          googleId: null,
        },
      }),
      prisma.user.count({
        where: {
          googleId: { not: null },
          discordId: { not: null },
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      (prisma.user as any).groupBy({
        by: ["prodi"],
        _count: { id: true },
      }),
      (prisma.user as any).groupBy({
        by: ["kelas"],
        _count: { id: true },
      }),
      prisma.user.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          nim: true,
          avatar: true,
          provider: true,
          googleId: true,
          discordId: true,
          prodi: true,
          kelas: true,
          roles: true,
          createdAt: true,
        },
      }),
      prisma.task.count(),
      (prisma.task as any).groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      (prisma.task as any).groupBy({
        by: ["scope"],
        _count: { id: true },
      }),
      (prisma as any).taskComment.count().catch(() => 0),
      (prisma as any).taskActivity.count().catch(() => 0),
      (prisma as any).courseDiscussion.count().catch(() => 0),
      (prisma as any).discussionReply.count().catch(() => 0),
      (prisma as any).courseVault.count().catch(() => 0),
      (prisma as any).feedback
        .groupBy({
          by: ["category"],
          _count: { id: true },
        })
        .catch(() => []),
      (prisma as any).feedback
        .groupBy({
          by: ["status"],
          _count: { id: true },
        })
        .catch(() => []),
      (prisma as any).feedback
        .findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            category: true,
            message: true,
            authorName: true,
            status: true,
            createdAt: true,
            pageUrl: true,
          },
        })
        .catch(() => []),
      prisma.user.count({ where: { roles: { has: "ADMIN" } } }),
      prisma.user.count({ where: { roles: { has: "PJ_KELAS" } } }),
      prisma.user.count({ where: { roles: { has: "PJ_MATKUL" } } }),
      prisma.user.count({ where: { roles: { has: "KETUA_ANGKATAN" } } }),
      prisma.user.count({ where: { roles: { has: "OWNER" } } }),
    ]);

    // Format sebaran Prodi
    const prodiCounts: Record<string, number> = {
      INFORMATIKA: 0,
      SAINS_DATA: 0,
      INFORMATIKA_PSDKU_KEBUMEN: 0,
      UNASSIGNED: 0,
    };
    for (const item of usersByProdiRaw) {
      if (item.prodi && item.prodi in prodiCounts) {
        prodiCounts[item.prodi] = item._count.id;
      } else {
        prodiCounts.UNASSIGNED += item._count.id;
      }
    }

    // Format sebaran Kelas
    const kelasCounts: Record<string, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      UNASSIGNED: 0,
    };
    for (const item of usersByKelasRaw) {
      if (item.kelas && item.kelas in kelasCounts) {
        kelasCounts[item.kelas] = item._count.id;
      } else {
        kelasCounts.UNASSIGNED += item._count.id;
      }
    }

    // Format status Tugas
    const taskStatusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      NEED_REVIEW: 0,
      DONE: 0,
    };
    for (const item of tasksByStatusRaw) {
      if (item.status && item.status in taskStatusCounts) {
        taskStatusCounts[item.status as keyof typeof taskStatusCounts] = item._count.id;
      }
    }

    // Format cakupan Tugas (Scope)
    const taskScopeCounts = {
      CLASS: 0,
      PERSONAL: 0,
    };
    for (const item of tasksByScopeRaw) {
      if (item.scope && item.scope in taskScopeCounts) {
        taskScopeCounts[item.scope as keyof typeof taskScopeCounts] = item._count.id;
      }
    }

    // Completion rate (%)
    const completionRate = totalTasks > 0 ? Math.round((taskStatusCounts.DONE / totalTasks) * 100) : 0;

    // Format masukan (Feedback)
    const feedbackByCategory: Record<string, number> = {};
    for (const item of feedbackByCategoryRaw) {
      feedbackByCategory[item.category || "GENERAL"] = item._count.id;
    }

    let feedbackOpen = 0;
    let feedbackResolved = 0;
    for (const item of feedbackByStatusRaw) {
      if (item.status === "RESOLVED") feedbackResolved += item._count.id;
      else feedbackOpen += item._count.id;
    }

    const studentOnlyCount = Math.max(
      0,
      totalUsers - (adminCount + ownerCount + ketuaAngkatanCount + pjKelasCount + pjMatkulCount)
    );

    return NextResponse.json({
      analytics: {
        users: {
          total: totalUsers,
          googleOnly: googleOnlyUsers,
          discordOnly: discordOnlyUsers,
          linkedBoth: linkedUsers,
          newToday,
          newThisWeek,
          newThisMonth,
          byProdi: prodiCounts,
          byKelas: kelasCounts,
          byRole: {
            ADMIN: adminCount,
            OWNER: ownerCount,
            KETUA_ANGKATAN: ketuaAngkatanCount,
            PJ_KELAS: pjKelasCount,
            PJ_MATKUL: pjMatkulCount,
            STUDENT: studentOnlyCount,
          },
          recentUsers: recentUsersRaw.map((u: any) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            nim: u.nim,
            avatar: u.avatar,
            provider: u.provider,
            googleId: u.googleId,
            discordId: u.discordId,
            prodi: u.prodi,
            kelas: u.kelas,
            roles: u.roles,
            createdAt: u.createdAt.toISOString(),
          })),
        },
        tasks: {
          total: totalTasks,
          byStatus: taskStatusCounts,
          byScope: taskScopeCounts,
          completionRate,
          totalComments,
          totalActivities,
        },
        community: {
          totalDiscussions,
          totalReplies,
          totalVaults,
          feedback: {
            total: feedbackOpen + feedbackResolved,
            open: feedbackOpen,
            resolved: feedbackResolved,
            byCategory: feedbackByCategory,
            recent: recentFeedbacksRaw.map((f: any) => ({
              id: f.id,
              category: f.category,
              message: f.message,
              authorName: f.authorName,
              status: f.status,
              createdAt: f.createdAt.toISOString(),
              pageUrl: f.pageUrl,
            })),
          },
        },
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return NextResponse.json({ error: "Gagal memproses data analytics" }, { status: 500 });
  }
}
