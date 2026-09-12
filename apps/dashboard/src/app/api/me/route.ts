import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { syncCurrentUser } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: {
        id: token.discordId as string,
      },
    });

    // Jika prodi belum terisi atau ada permintaan sync eksplisit, jalankan sync dari Discord
    const forceSync = req.nextUrl.searchParams.get("sync") === "true";
    if (forceSync || (user && !user.prodi)) {
      try {
        await syncCurrentUser(token.discordId as string);
        user = await prisma.user.findUnique({
          where: {
            id: token.discordId as string,
          },
        });
      } catch (syncErr) {
        console.warn("[GET /api/me] Auto-sync profil gagal:", syncErr);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("[GET /api/me]", error);

    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Authentication Verification
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.discordId) {
      return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
    }

    // Parse & Validate Body
    const body = await req.json();
    const semester = Number(body.semester);

    // Guard clause: semester must be 1-8
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return NextResponse.json({ error: "Semester harus berupa angka antara 1 sampai 8." }, { status: 400 });
    }

    // Update Database via Prisma
    const updatedUser = await prisma.user.update({
      where: {
        id: token.discordId as string,
      },
      data: {
        semester,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("[PATCH /api/me]", error);
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
