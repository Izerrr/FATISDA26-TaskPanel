import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.userId ?? token?.discordId) as string | undefined;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    const body = await req.json();
    const { category, message, pageUrl } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Pesan masukan atau laporan wajib diisi." }, { status: 400 });
    }

    const validCategories = ["BUG", "JADWAL", "TUGAS", "FEATURE", "GENERAL"];
    const chosenCategory = validCategories.includes(category) ? category : "GENERAL";

    const userAgent = req.headers.get("user-agent") || null;

    const feedback = await (prisma as any).feedback.create({
      data: {
        category: chosenCategory,
        message: message.trim(),
        authorId: user?.id ?? null,
        authorName: user?.username ?? (user?.email ? user.email.split("@")[0] : "Mahasiswa Anonim"),
        userAgent,
        pageUrl: pageUrl ?? null,
        status: "OPEN",
      },
    });

    // Kirim notifikasi webhook Discord (jika terkonfigurasi)
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const categoryLabels: Record<string, string> = {
          BUG: "🐛 Laporan Bug / Error",
          JADWAL: "📅 Koreksi Jadwal",
          TUGAS: "📋 Kendala Tugas",
          FEATURE: "💡 Usulan Fitur",
          GENERAL: "💬 Masukan Umum",
        };

        const embedPayload = {
          title: `[Feedback Closed Beta] ${categoryLabels[chosenCategory] || chosenCategory}`,
          description: message.trim(),
          color: chosenCategory === "BUG" ? 0xef4444 : chosenCategory === "FEATURE" ? 0x8b5cf6 : 0x0ea5e9,
          fields: [
            {
              name: "Pengirim",
              value: user ? `${user.username} (${user.prodi || "Prodi -"} ${user.kelas ? `Kelas ${user.kelas}` : ""})` : "Anonim",
              inline: true,
            },
            {
              name: "Halaman",
              value: pageUrl ? `\`${pageUrl}\`` : "Dashboard",
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        };

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "FATISDA Feedback Bot",
            embeds: [embedPayload],
          }),
        }).catch((err) => console.warn("[Feedback Webhook] warning:", err));
      } catch (webhookErr) {
        console.warn("[Feedback] Gagal forward ke webhook:", webhookErr);
      }
    }

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/feedback]", error);
    return NextResponse.json({ error: "Gagal menyimpan masukan." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (token.userId ?? token.discordId) as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isAdmin = user.roles?.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r));
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Hanya pengurus/admin yang dapat melihat laporan." }, { status: 403 });
    }

    const feedbacks = await (prisma as any).feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true, avatar: true, prodi: true, kelas: true },
        },
      },
      take: 50,
    });

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("[GET /api/feedback]", error);
    return NextResponse.json({ error: "Gagal memuat masukan." }, { status: 500 });
  }
}
