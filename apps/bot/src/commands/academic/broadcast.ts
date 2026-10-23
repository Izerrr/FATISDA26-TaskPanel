import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command, Kelas, Prodi, TaskStatus } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON, APP_URL } from "../../lib/constants.js";
import { prisma } from "../../lib/prisma.js";
import { resolveCampusBuilding } from "../../lib/campusBuildings.js";
import { getActiveSemester, getExamModeConfig } from "../../lib/settings.js";

const DAY_NAMES: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

function getProdiLabel(prodi: Prodi): string {
  switch (prodi) {
    case "INFORMATIKA":
      return "Informatika";
    case "SAINS_DATA":
      return "Sains Data";
    case "INFORMATIKA_PSDKU_KEBUMEN":
      return "Informatika PSDKU Kebumen";
    default:
      return prodi;
  }
}

const command: Command = {
  name: "broadcast",
  aliases: ["wa", "reminder-wa"],
  category: "academic",
  description: "Buat template reminder perkuliahan WhatsApp dan kirim langsung via WhatsApp Web",
  data: new SlashCommandBuilder()
    .setName("broadcast")
    .setDescription("Buat template reminder perkuliahan WhatsApp dan kirim langsung via WhatsApp Web")
    .addStringOption((opt) =>
      opt
        .setName("hari")
        .setDescription("Pilih target hari reminder (default: Besok)")
        .setRequired(false)
        .addChoices(
          { name: "Besok (Default)", value: "TOMORROW" },
          { name: "Hari Ini", value: "TODAY" },
          { name: "Senin", value: "1" },
          { name: "Selasa", value: "2" },
          { name: "Rabu", value: "3" },
          { name: "Kamis", value: "4" },
          { name: "Jumat", value: "5" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("kelas")
        .setDescription("Filter kelas (A/B/C/D/E, default: profil Anda)")
        .setRequired(false)
        .addChoices(
          { name: "Kelas A", value: "A" },
          { name: "Kelas B", value: "B" },
          { name: "Kelas C", value: "C" },
          { name: "Kelas D", value: "D" },
          { name: "Kelas E", value: "E" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("prodi")
        .setDescription("Program studi target (default: profil Anda)")
        .setRequired(false)
        .addChoices(
          { name: "Informatika (Solo)", value: "INFORMATIKA" },
          { name: "Sains Data", value: "SAINS_DATA" },
          { name: "Informatika PSDKU Kebumen", value: "INFORMATIKA_PSDKU_KEBUMEN" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("catatan")
        .setDescription("Catatan tambahan dari PJ / Pengurus kelas untuk dicantumkan di pesan")
        .setRequired(false),
    ),

  async run(_client, context, args) {
    const authorId = isSlash(context) ? context.user.id : context.author.id;

    let hariOpt = isSlash(context) ? (context.options.getString("hari") ?? "TOMORROW") : args[0]?.toUpperCase() || "TOMORROW";
    let kelasOpt = isSlash(context) ? (context.options.getString("kelas") as Kelas | null) : (args[1]?.toUpperCase() as Kelas | null);
    let prodiOpt = isSlash(context) ? (context.options.getString("prodi") as Prodi | null) : null;
    let noteOpt = isSlash(context) ? context.options.getString("catatan") : args.slice(2).join(" ");

    try {
      const dbUser = await prisma.user.findUnique({ where: { id: authorId } });
      const targetProdi: Prodi = prodiOpt || dbUser?.prodi || "INFORMATIKA";
      const targetKelas: Kelas = (kelasOpt || dbUser?.kelas || "B") as Kelas;
      const targetSemester = await getActiveSemester(dbUser?.semester);
      const examMode = await getExamModeConfig();

      // Hitung hari target di WIB
      const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const currentJsDay = nowWib.getUTCDay(); // 0 = Minggu, 1 = Senin, ...

      let targetDayNumber = 1;
      let targetDate = new Date(nowWib);
      let isTomorrow = true;

      if (hariOpt === "TODAY") {
        isTomorrow = false;
        targetDayNumber = currentJsDay === 0 ? 7 : currentJsDay;
      } else if (hariOpt === "TOMORROW") {
        isTomorrow = true;
        const tomorrowJsDay = (currentJsDay + 1) % 7;
        targetDayNumber = tomorrowJsDay === 0 ? 7 : tomorrowJsDay;
        targetDate.setUTCDate(targetDate.getUTCDate() + 1);
      } else {
        const parsed = parseInt(hariOpt, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
          targetDayNumber = parsed;
          isTomorrow = targetDayNumber === ((currentJsDay + 1) % 7 || 7);
          // Set date offset relative to currentDay
          const diffDays = (targetDayNumber - (currentJsDay === 0 ? 7 : currentJsDay) + 7) % 7;
          targetDate.setUTCDate(targetDate.getUTCDate() + (diffDays === 0 ? 7 : diffDays));
        }
      }

      const dayName = DAY_NAMES[targetDayNumber] || "Hari Ini";
      const dateFormatted = targetDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Target date range untuk check ujian & deadline tugas
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const dbStartDate = new Date(startOfDay.getTime() - 7 * 3600000);
      const dbEndDate = new Date(endOfDay.getTime() - 7 * 3600000);

      // 1. Ambil Jadwal Kuliah Reguler
      const rawSchedules = await prisma.schedule.findMany({
        where: {
          prodi: targetProdi,
          day: targetDayNumber,
          semester: targetSemester,
          kelas: targetKelas,
        },
        include: { course: true },
        orderBy: { startTime: "asc" },
      });

      const schedules = rawSchedules.filter((s) => {
        const norm = s.courseName.toLowerCase();
        if (!norm.includes("agama")) return true;
        return norm.includes("islam");
      });

      // 2. Ambil Jadwal Ujian (jika ada pada hari itu)
      const exams = await prisma.examSchedule.findMany({
        where: {
          prodi: targetProdi,
          kelas: targetKelas,
          semester: targetSemester,
          date: {
            gte: dbStartDate,
            lte: dbEndDate,
          },
        },
        orderBy: { startTime: "asc" },
      });

      // 3. Ambil Tugas Kelas yang tenggatnya pada hari target atau mendekati
      const tasksDueSoon = await prisma.task.findMany({
        where: {
          scope: "CLASS",
          status: { in: ["TODO", "IN_PROGRESS", "NEED_REVIEW"] as TaskStatus[] },
          prodi: targetProdi,
          OR: [{ kelas: targetKelas }, { kelas: null }],
          dueDate: {
            gte: dbStartDate,
            lte: new Date(dbEndDate.getTime() + 24 * 3600000), // Termasuk H+1
          },
        },
        include: { course: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      });

      // Build Template Pesan WhatsApp
      const lines: string[] = [];
      lines.push(`*Hello, Members of Class ${targetKelas}!* 👋🏻`);
      lines.push(`How are u today? Hope you're doing well and ready for ${isTomorrow ? "tomorrow" : "today"}! ✨`);
      lines.push("");
      lines.push(`Berikut ini reminder kegiatan perkuliahan untuk *${dayName}, ${dateFormatted}*:`);
      lines.push("");

      // Ujian jika ada
      if (exams.length > 0) {
        lines.push(`🎯 *JADWAL UJIAN (${exams[0]?.type || "UTS/UAS"}):*`);
        exams.forEach((e, idx) => {
          const bInfo = resolveCampusBuilding(e.room);
          const bHint = bInfo?.name ? ` (${bInfo.name})` : "";
          lines.push(`${idx + 1}. *${e.courseName}*`);
          lines.push(`   ⏰ Jam: ${e.startTime} - ${e.endTime} WIB`);
          lines.push(`   📍 Ruang: ${e.room}${bHint}`);
        });
        lines.push("");
      }

      // Perkuliahan reguler
      if (schedules.length > 0) {
        lines.push(`📚 *Mata Kuliah:*`);
        schedules.forEach((s, idx) => {
          const courseName = s.course?.name || s.courseName;
          const bInfo = resolveCampusBuilding(s.room);
          const bHint = bInfo?.name ? ` (${bInfo.name})` : "";
          lines.push(`${idx + 1}. *${courseName}*`);
          lines.push(`   ⏰ Jam: ${s.startTime} - ${s.endTime} WIB`);
          lines.push(`   📍 Ruang: ${s.room || "-"}${bHint}`);
          if (s.lecturer) lines.push(`   👨‍🏫 Dosen: ${s.lecturer}`);
        });
        lines.push("");
      } else if (exams.length === 0) {
        lines.push(`🎉 *Tidak ada perkuliahan pada hari ini (Hari Libur).*`);
        lines.push("");
      }

      // Tugas
      if (tasksDueSoon.length > 0) {
        lines.push(`📌 *Tugas / Catatan Deadline:*`);
        tasksDueSoon.forEach((t) => {
          const courseCode = t.course?.code ? `[${t.course.code}] ` : "";
          const dueStr = t.dueDate
            ? new Date(t.dueDate).toLocaleDateString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })
            : "-";
          lines.push(`• *${courseCode}${t.title}*`);
          lines.push(`  Tenggat: ${dueStr} WIB`);
        });
        lines.push("");
      }

      // Catatan tambahan jika ada
      if (noteOpt && noteOpt.trim()) {
        lines.push(`📢 *Pengumuman / Catatan PJ:*`);
        lines.push(`${noteOpt.trim()}`);
        lines.push("");
      }

      lines.push(`Tetap semangat and have a great day everyone! 🚀`);
      lines.push(`_Sent via FATISDA26 TaskPanel_`);

      const whatsappText = lines.join("\n");
      const encodedWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;

      const waButton = new ButtonBuilder()
        .setLabel("Kirim ke WhatsApp")
        .setStyle(ButtonStyle.Link)
        .setURL(encodedWaUrl);

      const webScheduleButton = new ButtonBuilder()
        .setLabel("Buka Jadwal TaskPanel")
        .setStyle(ButtonStyle.Link)
        .setURL(`${APP_URL}/dashboard/schedule`);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(waButton, webScheduleButton);

      const embed = new EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle(`💬 Template Reminder WhatsApp — ${getProdiLabel(targetProdi)} Kelas ${targetKelas}`)
        .setDescription(
          `Template pengingat perkuliahan untuk **${dayName}, ${dateFormatted}** siap disebarkan!\n\n` +
            `👉 **Klik tombol [Kirim ke WhatsApp]** di bawah untuk membuka WhatsApp Web / Mobile secara instan dengan teks otomatis terisi, atau salin teks berikut:`,
        )
        .addFields({
          name: "📋 Salin Teks WhatsApp:",
          value: `\`\`\`text\n${whatsappText.length > 1000 ? whatsappText.slice(0, 990) + "\n...[dipotong]..." : whatsappText}\`\`\``,
        })
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      await reply(context, {
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("[Command /broadcast]", error);
      await reply(context, {
        content: "❌ Terjadi kesalahan saat membuat template reminder WhatsApp.",
        ephemeral: true,
      });
    }
  },
};

export default command;

