import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDiscordNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

function maskString(str: string | null | undefined): string | null {
  if (!str) return null;
  if (str.length <= 8) return "****";
  return `${str.slice(0, 4)}••••${str.slice(-4)}`;
}

function maskUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname.slice(0, 20)}••••`;
  } catch {
    return maskString(url);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        roles: true,
        prodi: true,
        kelas: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const isAdmin = user.roles.includes("ADMIN") || user.roles.includes("OWNER") || user.roles.includes("KETUA_ANGKATAN") || user.roles.includes("PJ_KELAS") || user.roles.includes("PJ_MATKUL");

    if (!isAdmin) {
      return NextResponse.json({ error: "Hanya Admin dan PJ yang dapat menjalankan simulasi notifikasi" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const targetProdi = body.prodi || user.prodi || "INFORMATIKA";
    const targetKelas = body.kelas || user.kelas || "A";
    const customTitle = body.title?.trim() || "Simulasi Pengujian Notifikasi Tugas";
    const customDescription = body.description?.trim() || "Ini adalah pesan pengujian dari Admin Testing Environment untuk memastikan routing notifikasi Discord dan mention role berjalan dengan sempurna.";
    const includePing = body.includePing !== false;

    // Resolusi Role ID
    let roleIdToMention: string | null = null;
    let roleSource = "none";

    if (includePing) {
      const specificRoleKey = `DISCORD_ROLE_${targetProdi}_${targetKelas}`;
      const fallbackRoleKey = `DISCORD_ROLE_KELAS_${targetKelas}`;

      if (process.env[specificRoleKey]?.trim()) {
        roleIdToMention = process.env[specificRoleKey]?.trim() ?? null;
        roleSource = specificRoleKey;
      } else if (process.env[fallbackRoleKey]?.trim()) {
        roleIdToMention = process.env[fallbackRoleKey]?.trim() ?? null;
        roleSource = fallbackRoleKey;
      }
    }

    // Resolusi Channel ID (Bot)
    const taskChannelId =
      (targetProdi && targetKelas ? process.env[`DISCORD_CHANNEL_ID_${targetProdi}_${targetKelas}`] : null) ||
      (targetProdi ? process.env[`DISCORD_CHANNEL_ID_${targetProdi}`] : null) ||
      (targetProdi === "INFORMATIKA_PSDKU_KEBUMEN" ? process.env.DISCORD_CHANNEL_ID_PSDKU || process.env.DISCORD_CHANNEL_ID_PSDKU_KEBUMEN : null) ||
      process.env.DISCORD_CHANNEL_ID_TUGAS ||
      process.env.TASK_CHANNEL_ID ||
      null;

    // Resolusi Webhook URL
    const webhookUrl =
      (targetProdi && targetKelas ? process.env[`DISCORD_WEBHOOK_URL_${targetProdi}_${targetKelas}`] : null) ||
      (targetProdi ? process.env[`DISCORD_WEBHOOK_URL_${targetProdi}`] : null) ||
      (targetProdi === "INFORMATIKA_PSDKU_KEBUMEN" ? process.env.DISCORD_WEBHOOK_URL_PSDKU || process.env.DISCORD_WEBHOOK_URL_PSDKU_KEBUMEN : null) ||
      process.env.DISCORD_WEBHOOK_URL ||
      null;

    const hasBotToken = Boolean(process.env.DISCORD_BOT_TOKEN);
    let deliveryMethod = "NONE";

    if (taskChannelId && hasBotToken) {
      deliveryMethod = "BOT_REST_API";
    } else if (webhookUrl) {
      deliveryMethod = "WEBHOOK";
    }

    const prodiLabel = targetProdi.replace(/_/g, " ");

    const embedLines = [
      `### 🧪 ${customTitle}`,
      `> ${customDescription}\n`,
      `📚 **Mata Kuliah:** \`TEST101\` Mata Kuliah Pengujian`,
      `⏰ **Deadline:** ${new Date(Date.now() + 2 * 86400000).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      `🏷️ **Tipe:** Tugas Kelas (${prodiLabel} ${targetKelas})`,
      `👤 **Penguji:** <@${user.id}> (${user.username})`,
      `⚙️ **Metode Pengiriman:** \`${deliveryMethod}\``,
    ];

    const guildId = process.env.DISCORD_GUILD_ID || "default-guild";

    const result = await sendDiscordNotification(guildId, embedLines.join("\n"), {
      roleIdToMention,
      mentionText: `📢 [TEST SIMULASI] Notifikasi untuk ${prodiLabel} Kelas ${targetKelas}!`,
      prodi: targetProdi,
      kelas: targetKelas,
    });

    return NextResponse.json(
      {
        success: result.success,
        error: result.error,
        diagnostics: {
          targetProdi,
          targetKelas,
          deliveryMethod: result.method,
          httpStatus: result.status,
          channel: {
            configured: Boolean(taskChannelId),
            maskedId: maskString(taskChannelId),
            viaBot: Boolean(taskChannelId && hasBotToken),
          },
          webhook: {
            configured: Boolean(webhookUrl),
            maskedUrl: maskUrl(webhookUrl),
          },
          roleMention: {
            included: includePing,
            configured: Boolean(roleIdToMention),
            maskedRoleId: maskString(roleIdToMention),
            envSource: roleSource,
          },
          testedBy: user.username,
          timestamp: new Date().toISOString(),
        },
      },
      { status: result.success ? 200 : 400 },
    );
  } catch (error) {
    console.error("[POST /api/tasks/test-notify]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menjalankan test pengiriman notifikasi",
      },
      { status: 500 },
    );
  }
}
