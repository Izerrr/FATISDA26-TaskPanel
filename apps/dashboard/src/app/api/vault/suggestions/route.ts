import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { normalizeSafeHttpUrl } from "@/lib/url-safety";
import { resolveCourseId } from "@/lib/course-resolver";
import { hasPrivilegedTaskRole, isMissingTableError } from "@/lib/task-access";
import { applySuggestionToVaultLinks, normalizeVaultSuggestionType } from "@/lib/vault-suggestions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, prodi: true, kelas: true, roles: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged = hasPrivilegedTaskRole((user.roles || []).map(String));
    const searchParams = req.nextUrl.searchParams;
    const courseName = searchParams.get("courseName")?.trim();
    const statusParam = searchParams.get("status")?.trim().toUpperCase();

    const where: Record<string, unknown> = {};
    if (user.prodi) where.prodi = user.prodi;
    if (courseName) {
      where.courseName = { equals: courseName, mode: "insensitive" };
    }

    if (statusParam && ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)) {
      where.status = statusParam;
    } else if (!isPrivileged) {
      // Non-privileged students see pending queue or their own historical suggestions
      where.OR = [{ status: "PENDING" }, { authorId: user.id }];
    }

    try {
      const suggestions = await prisma.vaultSuggestion.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, username: true, avatar: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 100,
      });

      return NextResponse.json({ suggestions });
    } catch (err) {
      if (isMissingTableError(err)) {
        return NextResponse.json({ suggestions: [] });
      }
      throw err;
    }
  } catch (error) {
    console.error("[GET /api/vault/suggestions]", error);
    return NextResponse.json({ error: "Gagal memuat usulan materi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, prodi: true, kelas: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const courseName = typeof body.courseName === "string" ? body.courseName.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 300) : null;
    const suggestionType = normalizeVaultSuggestionType(typeof body.type === "string" ? body.type : "OTHER");

    if (!courseName) {
      return NextResponse.json({ error: "Nama mata kuliah wajib diisi" }, { status: 400 });
    }
    if (!title || title.length < 3) {
      return NextResponse.json({ error: "Judul materi minimal 3 karakter" }, { status: 400 });
    }

    const safeUrl = normalizeSafeHttpUrl(rawUrl);
    if (!safeUrl) {
      return NextResponse.json({ error: "Link URL tidak valid (gunakan http/https)" }, { status: 400 });
    }

    const recent = await prisma.vaultSuggestion.findFirst({
      where: {
        authorId: user.id,
        createdAt: { gte: new Date(Date.now() - 10 * 1000) },
      },
      select: { id: true },
    });
    if (recent) {
      return NextResponse.json({ error: "Mohon tunggu 10 detik sebelum mengirim usulan berikutnya" }, { status: 429 });
    }

    const targetProdi = user.prodi ?? "INFORMATIKA";
    const resolvedCourseId = body.courseId
      ? await resolveCourseId(String(body.courseId), targetProdi, user.kelas ?? null)
      : null;

    const suggestion = await prisma.vaultSuggestion.create({
      data: {
        courseId: resolvedCourseId,
        courseName,
        prodi: targetProdi,
        kelas: user.kelas ?? null,
        title: title.slice(0, 120),
        url: safeUrl,
        type: suggestionType,
        description: description || null,
        authorId: user.id,
        status: "PENDING",
      },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/vault/suggestions]", error);
    return NextResponse.json({ error: "Gagal mengirim usulan materi" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, roles: true },
    });
    if (!reviewer) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    if (!hasPrivilegedTaskRole((reviewer.roles || []).map(String))) {
      return NextResponse.json({ error: "Hanya PJ atau pengurus yang dapat memverifikasi usulan materi" }, { status: 403 });
    }

    const body = await req.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim().toUpperCase() : "";
    const reviewNote = typeof body.reviewNote === "string" ? body.reviewNote.trim().slice(0, 240) : null;

    if (!id || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json({ error: "ID usulan dan aksi APPROVE/REJECT wajib valid" }, { status: 400 });
    }

    const suggestion = await prisma.vaultSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: "Usulan materi tidak ditemukan" }, { status: 404 });
    }
    if (suggestion.status !== "PENDING") {
      return NextResponse.json({ error: "Usulan ini sudah ditinjau sebelumnya" }, { status: 400 });
    }

    if (action === "REJECT") {
      const updated = await prisma.vaultSuggestion.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewNote: reviewNote || null,
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
        },
        include: {
          author: { select: { id: true, name: true, username: true, avatar: true } },
        },
      });
      return NextResponse.json({ suggestion: updated });
    }

    // APPROVE: merge into CourseVault atomically inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const existingVault = await tx.courseVault.findFirst({
        where: {
          courseName: { equals: suggestion.courseName, mode: "insensitive" },
          prodi: suggestion.prodi,
          kelas: suggestion.kelas ?? null,
        },
      });

      const merged = applySuggestionToVaultLinks(existingVault, suggestion);

      if (existingVault) {
        await tx.courseVault.update({
          where: { id: existingVault.id },
          data: {
            driveUrl: merged.driveUrl,
            modulUrl: merged.modulUrl,
            silabusUrl: merged.silabusUrl,
            extraLinks: merged.extraLinks as unknown as Prisma.InputJsonValue,
            updatedById: reviewer.id,
          },
        });
      } else {
        await tx.courseVault.create({
          data: {
            courseId: suggestion.courseId,
            courseName: suggestion.courseName,
            prodi: suggestion.prodi,
            kelas: suggestion.kelas ?? null,
            driveUrl: merged.driveUrl,
            modulUrl: merged.modulUrl,
            silabusUrl: merged.silabusUrl,
            extraLinks: merged.extraLinks as unknown as Prisma.InputJsonValue,
            updatedById: reviewer.id,
          },
        });
      }

      return tx.vaultSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: "APPROVED",
          reviewNote: reviewNote || null,
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
        },
        include: {
          author: { select: { id: true, name: true, username: true, avatar: true } },
        },
      });
    });

    return NextResponse.json({ suggestion: result });
  } catch (error) {
    console.error("[PATCH /api/vault/suggestions]", error);
    return NextResponse.json({ error: "Gagal memproses usulan materi" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Parameter id wajib diisi" }, { status: 400 });
    }

    const [user, suggestion] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } }),
      prisma.vaultSuggestion.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } }),
    ]);

    if (!user || !suggestion) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const isPrivileged = hasPrivilegedTaskRole((user.roles || []).map(String));
    const isAuthorPending = suggestion.authorId === user.id && suggestion.status === "PENDING";
    if (!isPrivileged && !isAuthorPending) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    await prisma.vaultSuggestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/vault/suggestions]", error);
    return NextResponse.json({ error: "Gagal menghapus usulan materi" }, { status: 500 });
  }
}
