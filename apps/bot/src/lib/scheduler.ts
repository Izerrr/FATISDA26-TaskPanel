import cron from "node-cron";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "./prisma.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON } from "./constants.js";
import { Kelas, Prodi, TaskStatus } from "../types.js";

const DAY_NAMES: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

// Cache to prevent duplicate deadline notifications: key format = `${taskId}:${tier}`
const sentAlerts = new Set<string>();

export function getTargetChannelId(prodi?: string | null, kelas?: string | null): string | null {
  if (prodi && kelas) {
    const specific = process.env[`DISCORD_CHANNEL_ID_${prodi}_${kelas}`]?.trim();
    if (specific) return specific;
  }
  if (prodi) {
    const byProdi = process.env[`DISCORD_CHANNEL_ID_${prodi}`]?.trim();
    if (byProdi) return byProdi;
  }
  if (kelas) {
    const byKelas = process.env[`DISCORD_CHANNEL_ID_KELAS_${kelas}`]?.trim();
    if (byKelas) return byKelas;
  }
  return process.env.DISCORD_CHANNEL_ID_JADWAL?.trim() || process.env.DISCORD_CHANNEL_ID_TUGAS?.trim() || null;
}

export function getRoleIdToMention(prodi?: string | null, kelas?: string | null): string | null {
  if (prodi && kelas) {
    const specific = process.env[`DISCORD_ROLE_${prodi}_${kelas}`]?.trim();
    if (specific) return specific;
  }
  if (kelas) {
    const fallback = process.env[`DISCORD_ROLE_KELAS_${kelas}`]?.trim();
    if (fallback) return fallback;
  }
  return null;
}

/**
 * Kirim Morning Briefing (Jadwal kuliah & tugas hari ini)
 */
export async function sendDailyMorningBriefing(client: Client) {
  console.log("⏰ [Scheduler] Menjalankan Morning Briefing...");

  // Waktu WIB
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  const dayName = DAY_NAMES[currentDay] || "Hari Ini";

  const dateFormatted = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const classTargets: { prodi: Prodi; kelas: Kelas }[] = [
    { prodi: "INFORMATIKA", kelas: "A" },
    { prodi: "INFORMATIKA", kelas: "B" },
    { prodi: "INFORMATIKA", kelas: "C" },
    { prodi: "INFORMATIKA", kelas: "D" },
  ];

  for (const target of classTargets) {
    try {
      const channelId = getTargetChannelId(target.prodi, target.kelas);
      if (!channelId) continue;

      const channel = (await client.channels.fetch(channelId).catch(() => null)) as TextChannel | null;
      if (!channel || !channel.isTextBased()) continue;

      // Ambil jadwal hari ini (termasuk Olahraga batch-wide)
      const schedules = await prisma.schedule.findMany({
        where: {
          prodi: target.prodi,
          day: currentDay,
          OR: [{ kelas: target.kelas }, { courseName: { contains: "Olahraga", mode: "insensitive" } }],
        },
        include: { course: true },
        orderBy: { startTime: "asc" },
      });

      // Ambil tugas kelas yang jatuh tempo hari ini atau besok
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(now);
      endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const tasksDueSoon = await prisma.task.findMany({
        where: {
          scope: "CLASS",
          status: { in: ["TODO", "IN_PROGRESS", "NEED_REVIEW"] as TaskStatus[] },
          OR: [{ kelas: target.kelas }, { kelas: null }],
          dueDate: {
            gte: startOfDay,
            lte: endOfTomorrow,
          },
        },
        include: { course: true },
        orderBy: { dueDate: "asc" },
      });

      if (schedules.length === 0 && tasksDueSoon.length === 0) {
        continue;
      }

      const roleId = getRoleIdToMention(target.prodi, target.kelas);
      const mentionHeader = roleId ? `<@&${roleId}> ` : "";

      const embed = new EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle(`🌅 Morning Briefing: ${dayName}, ${dateFormatted}`)
        .setDescription(`Selamat pagi rekan-rekan **${target.prodi} Kelas ${target.kelas}**! Berikut rangkuman perkuliahan dan tugas Anda hari ini:`)
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      // Field Jadwal Kuliah
      if (schedules.length > 0) {
        const scheduleLines = schedules.map((s, idx) => {
          const name = s.course?.name || s.courseName || "Mata Kuliah";
          const room = s.room ? `📍 ${s.room}` : "";
          const lecturer = s.lecturer ? `· ${s.lecturer}` : "";
          return `**${idx + 1}. ${name}**\n   ⏰ \`${s.startTime} - ${s.endTime} WIB\` ${room} ${lecturer}`.trim();
        });
        embed.addFields({ name: "📚 Jadwal Kuliah Hari Ini", value: scheduleLines.join("\n\n") });
      } else {
        embed.addFields({ name: "📚 Jadwal Kuliah Hari Ini", value: "🎉 *Tidak ada jadwal kuliah hari ini. Waktunya istirahat atau nugas!*" });
      }

      // Field Tugas Mendekati Deadline
      if (tasksDueSoon.length > 0) {
        const taskLines = tasksDueSoon.map((t) => {
          const dueStr = t.dueDate
            ? new Date(t.dueDate).toLocaleDateString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })
            : "-";
          const course = t.course ? `[${t.course.code}] ` : "";
          return `📌 **${t.title}**\n   ${course}Tenggat: **${dueStr} WIB**`;
        });
        embed.addFields({ name: "⏰ Tugas Mendekati Deadline (Hari Ini / Besok)", value: taskLines.join("\n\n") });
      }

      const button = new ButtonBuilder().setLabel("Buka TaskPanel").setStyle(ButtonStyle.Link).setURL("https://taskpanel.ftsduaenam.web.id/dashboard");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      await channel.send({
        content: `${mentionHeader}📢 **Rangkuman Kuliah Hari Ini!**`,
        embeds: [embed],
        components: [row],
      });

      console.log(`[Scheduler] Sukses mengirim morning briefing ke ${target.prodi} Kelas ${target.kelas}`);
    } catch (err) {
      console.error(`[Scheduler] Gagal kirim briefing untuk ${target.prodi} ${target.kelas}:`, err);
    }
  }
}

/**
 * Watcher pengingat deadline tugas kelas (H-1 & 6 jam)
 */
export async function checkApproachingDeadlines(client: Client) {
  const now = new Date();

  try {
    const activeTasks = await prisma.task.findMany({
      where: {
        scope: "CLASS",
        status: { in: ["TODO", "IN_PROGRESS", "NEED_REVIEW"] as TaskStatus[] },
        dueDate: {
          gte: now,
        },
      },
      include: {
        course: true,
      },
    });

    for (const task of activeTasks) {
      if (!task.dueDate) continue;

      const diffMs = task.dueDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      let alertTier: "H-24" | "H-6" | null = null;
      let alertTitle = "";

      if (diffHours <= 6 && diffHours > 0) {
        alertTier = "H-6";
        alertTitle = "🚨 PENGINGAT DEADLINE: Kurang dari 6 Jam!";
      } else if (diffHours <= 24 && diffHours > 20) {
        alertTier = "H-24";
        alertTitle = "⚠️ PENGINGAT DEADLINE: Kurang dari 24 Jam (H-1)!";
      }

      if (!alertTier) continue;

      const alertKey = `${task.id}:${alertTier}`;
      if (sentAlerts.has(alertKey)) continue;

      const targetChannelId = getTargetChannelId(task.prodi, task.kelas);
      if (!targetChannelId) continue;

      const channel = (await client.channels.fetch(targetChannelId).catch(() => null)) as TextChannel | null;
      if (!channel || !channel.isTextBased()) continue;

      const roleId = getRoleIdToMention(task.prodi, task.kelas);
      const mentionHeader = roleId ? `<@&${roleId}> ` : "";

      const dueFormatted = new Date(task.dueDate).toLocaleString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

      const embed = new EmbedBuilder()
        .setColor(alertTier === "H-6" ? 0xef4444 : 0xf59e0b)
        .setTitle(alertTitle)
        .setDescription(`Tugas kelas berikut akan segera berakhir masa pengumpulannya:`)
        .addFields(
          { name: "📌 Judul Tugas", value: `**${task.title}**` },
          { name: "📚 Mata Kuliah", value: task.course ? `${task.course.code} (${task.course.name})` : "Umum" },
          { name: "⏰ Batas Pengumpulan", value: `**${dueFormatted} WIB**` },
          ...(task.description ? [{ name: "📝 Catatan", value: task.description }] : []),
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      const button = new ButtonBuilder().setLabel("Lihat di TaskPanel").setStyle(ButtonStyle.Link).setURL("https://taskpanel.ftsduaenam.web.id/dashboard/tasks");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      await channel.send({
        content: `${mentionHeader}⚠️ Jangan lupa submit tugas ini!`,
        embeds: [embed],
        components: [row],
      });

      sentAlerts.add(alertKey);
      console.log(`[Scheduler] Alert ${alertTier} terkirim untuk tugas: ${task.title}`);
    }
  } catch (err) {
    console.error("[Scheduler] Gagal check deadline:", err);
  }
}

/**
 * Inisialisasi seluruh cron jobs
 */
export function startScheduler(client: Client) {
  console.log("⏰ [Scheduler] Memulai Background Scheduler (Timezone: Asia/Jakarta)...");

  // 1. Morning Briefing setiap hari jam 06:30 WIB
  cron.schedule(
    "30 6 * * *",
    async () => {
      await sendDailyMorningBriefing(client);
    },
    {
      timezone: "Asia/Jakarta",
    },
  );

  // 2. Deadline Watcher setiap 30 menit
  cron.schedule(
    "*/30 * * * *",
    async () => {
      await checkApproachingDeadlines(client);
    },
    {
      timezone: "Asia/Jakarta",
    },
  );

  // Run initial check on startup
  setTimeout(() => {
    checkApproachingDeadlines(client);
  }, 10000);
}
