import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { hasPrivilegedTaskRole } from "@/lib/task-access";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!hasPrivilegedTaskRole((user.roles || []).map(String))) {
      return NextResponse.json({ error: "Forbidden: Hanya pengurus/admin yang dapat memperbarui laporan." }, { status: 403 });
    }

    const body = await req.json();
    const status = typeof body.status === "string" ? body.status.trim().toUpperCase() : "";
    if (status !== "OPEN" && status !== "RESOLVED") {
      return NextResponse.json({ error: "Status harus OPEN atau RESOLVED" }, { status: 400 });
    }

    const existing = await prisma.feedback.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    const feedback = await prisma.feedback.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("[PATCH /api/feedback/:id]", error);
    return NextResponse.json({ error: "Gagal memperbarui status laporan." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = await getToken({ req, secret: getAuthSecret() });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, roles: true } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!hasPrivilegedTaskRole((user.roles || []).map(String))) {
      return NextResponse.json({ error: "Forbidden: Hanya pengurus/admin yang dapat menghapus laporan." }, { status: 403 });
    }

    const existing = await prisma.feedback.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    await prisma.feedback.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/feedback/:id]", error);
    return NextResponse.json({ error: "Gagal menghapus laporan." }, { status: 500 });
  }
}
