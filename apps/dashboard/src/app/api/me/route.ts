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
    const updateData: any = {};

    if (body.semester !== undefined) {
      const semester = Number(body.semester);
      if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
        return NextResponse.json({ error: "Semester harus berupa angka antara 1 sampai 8." }, { status: 400 });
      }
      updateData.semester = semester;
    }

    if (body.kelas !== undefined) {
      const validKelas = ["A", "B", "C", "D", "E"];
      if (body.kelas === null || validKelas.includes(body.kelas)) {
        updateData.kelas = body.kelas;
      } else {
        return NextResponse.json({ error: "Pilihan kelas tidak valid." }, { status: 400 });
      }
    }

    if (body.prodi !== undefined) {
      const validProdi = ["INFORMATIKA", "SAINS_DATA", "INFORMATIKA_PSDKU_KEBUMEN"];
      if (body.prodi === null || validProdi.includes(body.prodi)) {
        updateData.prodi = body.prodi;
      } else {
        return NextResponse.json({ error: "Pilihan prodi tidak valid." }, { status: 400 });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diperbarui." }, { status: 400 });
    }

    // Update Database via Prisma
    const updatedUser = await prisma.user.update({
      where: {
        id: token.discordId as string,
      },
      data: updateData,
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
