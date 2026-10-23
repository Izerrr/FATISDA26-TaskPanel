import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command, Kelas, Prodi } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON, APP_URL } from "../../lib/constants.js";
import { prisma } from "../../lib/prisma.js";
import { formatRoomWithLocation } from "../../lib/campusBuildings.js";
import { getActiveSemester, getExamModeConfig } from "../../lib/settings.js";

function getProdiName(prodi: Prodi): string {
  switch (prodi) {
    case "INFORMATIKA":
      return "Informatika";
    case "SAINS_DATA":
      return "Sains Data";
    case "INFORMATIKA_PSDKU_KEBUMEN":
      return "Informatika (PSDKU Kebumen)";
    default:
      return prodi;
  }
}

const command: Command = {
  name: "ujian",
  category: "academic",
  description: "Lihat jadwal ujian (UTS / UAS) dari TaskPanel",
  data: new SlashCommandBuilder()
    .setName("ujian")
    .setDescription("Lihat jadwal ujian (UTS / UAS) dari TaskPanel")
    .addStringOption((option) =>
      option
        .setName("prodi")
        .setDescription("Program studi target (Informatika / Sains Data / PSDKU Kebumen)")
        .setRequired(false)
        .addChoices(
          { name: "Informatika (Solo)", value: "INFORMATIKA" },
          { name: "Sains Data", value: "SAINS_DATA" },
          { name: "Informatika PSDKU Kebumen", value: "INFORMATIKA_PSDKU_KEBUMEN" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("tipe")
        .setDescription("Tipe ujian (UTS / UAS / Semua)")
        .setRequired(false)
        .addChoices(
          { name: "Sesuai Mode Aktif (Otomatis)", value: "AUTO" },
          { name: "UTS (Ujian Tengah Semester)", value: "UTS" },
          { name: "UAS (Ujian Akhir Semester)", value: "UAS" },
          { name: "Semua (UTS & UAS)", value: "ALL" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("hari")
        .setDescription("Filter waktu ujian")
        .setRequired(false)
        .addChoices(
          { name: "Semua Jadwal Ujian", value: "ALL" },
          { name: "Hari Ini", value: "TODAY" },
          { name: "Besok", value: "TOMORROW" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("kelas")
        .setDescription("Filter berdasarkan kelas (A/B/C/D/E)")
        .setRequired(false)
        .addChoices(
          { name: "Kelas A", value: "A" },
          { name: "Kelas B", value: "B" },
          { name: "Kelas C", value: "C" },
          { name: "Kelas D", value: "D" },
          { name: "Kelas E", value: "E" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("semester")
        .setDescription("Filter semester (1-8, default: semester aktif)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(8),
    )
    .addStringOption((option) =>
      option
        .setName("agama")
        .setDescription("Filter agama untuk matkul Pendidikan Agama")
        .setRequired(false)
        .addChoices(
          { name: "Islam (Default)", value: "ISLAM" },
          { name: "Kristen", value: "KRISTEN" },
          { name: "Katolik", value: "KATOLIK" },
          { name: "Hindu", value: "HINDU" },
          { name: "Buddha", value: "BUDDHA" },
          { name: "Konghucu", value: "KONGHUCU" },
          { name: "Tampilkan Semua Agama", value: "ALL" },
        ),
    ),

  async run(_client, context, args) {
    const authorId = isSlash(context) ? context.user.id : context.author.id;

    let prodiOpt = isSlash(context) ? (context.options.getString("prodi") as Prodi | null) : null;
    let tipeOpt = isSlash(context) ? context.options.getString("tipe") : null;
    let hariOpt = isSlash(context) ? context.options.getString("hari") : null;
    let kelasOpt = isSlash(context) ? (context.options.getString("kelas") as Kelas | null) : null;
    let semesterOpt = isSlash(context) ? context.options.getInteger("semester") : null;
    let agamaOpt = isSlash(context) ? context.options.getString("agama") : null;

    if (!isSlash(context) && args.length > 0) {
      for (const arg of args) {
        const upper = arg.toUpperCase();
        if (["UTS", "UAS", "ALL"].includes(upper)) tipeOpt = upper;
        else if (["A", "B", "C", "D", "E"].includes(upper)) kelasOpt = upper as Kelas;
        else if (["INFORMATIKA", "SAINS_DATA", "INFORMATIKA_PSDKU_KEBUMEN"].includes(upper)) prodiOpt = upper as Prodi;
        else if (/^[1-8]$/.test(upper)) semesterOpt = parseInt(upper, 10);
      }
    }

    try {
      const dbUser = await prisma.user.findUnique({ where: { id: authorId } });
      let userProdi: Prodi = prodiOpt || dbUser?.prodi || "INFORMATIKA";
      if (!kelasOpt && dbUser?.kelas) {
        kelasOpt = dbUser.kelas;
      }

      const activeSemester = await getActiveSemester(dbUser?.semester);
      const targetSemester = semesterOpt ?? activeSemester;

      const examMode = await getExamModeConfig();
      let resolvedType: "UTS" | "UAS" | "ALL" = "UTS";
      if (tipeOpt && tipeOpt !== "AUTO") {
        resolvedType = tipeOpt as "UTS" | "UAS" | "ALL";
      } else if (examMode.enabled && examMode.activeType) {
        resolvedType = examMode.activeType;
      }

      const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
      let dateFilter: { gte?: Date; lte?: Date } | undefined;

      if (hariOpt === "TODAY") {
        const startToday = new Date(nowWib);
        startToday.setUTCHours(0, 0, 0, 0);
        const endToday = new Date(nowWib);
        endToday.setUTCHours(23, 59, 59, 999);
        dateFilter = { gte: new Date(startToday.getTime() - 7 * 3600000), lte: new Date(endToday.getTime() - 7 * 3600000) };
      } else if (hariOpt === "TOMORROW") {
        const startTmrw = new Date(nowWib);
        startTmrw.setUTCDate(startTmrw.getUTCDate() + 1);
        startTmrw.setUTCHours(0, 0, 0, 0);
        const endTmrw = new Date(startTmrw);
        endTmrw.setUTCHours(23, 59, 59, 999);
        dateFilter = { gte: new Date(startTmrw.getTime() - 7 * 3600000), lte: new Date(endTmrw.getTime() - 7 * 3600000) };
      }

      const whereClause: any = {
        prodi: userProdi,
        semester: targetSemester,
      };

      if (resolvedType !== "ALL") {
        whereClause.type = resolvedType;
      }

      if (kelasOpt && ["A", "B", "C", "D", "E"].includes(kelasOpt)) {
        whereClause.kelas = kelasOpt as Kelas;
      }

      if (dateFilter) {
        whereClause.date = dateFilter;
      }

      const rawExams = await prisma.examSchedule.findMany({
        where: whereClause,
        orderBy: [{ date: "asc" }, { startTime: "asc" }, { courseName: "asc" }],
        take: 20,
      });

      // Filter agama jika bukan ALL
      const selectedAgama = (agamaOpt || "ISLAM").toUpperCase();
      const exams = rawExams.filter((e) => {
        const norm = e.courseName.toLowerCase();
        if (!norm.includes("agama")) return true;
        if (selectedAgama === "ALL") return true;
        if (selectedAgama === "ISLAM") return norm.includes("islam");
        if (selectedAgama === "KRISTEN") return norm.includes("kristen");
        if (selectedAgama === "KATOLIK") return norm.includes("katolik");
        if (selectedAgama === "HINDU") return norm.includes("hindu");
        if (selectedAgama === "BUDDHA") return norm.includes("budha") || norm.includes("buddha");
        if (selectedAgama === "KONGHUCU") return norm.includes("konghucu");
        return true;
      });

      const examButton = new ButtonBuilder()
        .setLabel("Jadwal Ujian Web")
        .setStyle(ButtonStyle.Link)
        .setURL(`${APP_URL}/dashboard/schedule/exam`);

      const regularButton = new ButtonBuilder()
        .setLabel("Jadwal Kuliah")
        .setStyle(ButtonStyle.Link)
        .setURL(`${APP_URL}/dashboard/schedule`);

      const dashboardButton = new ButtonBuilder()
        .setLabel("Buka TaskPanel")
        .setStyle(ButtonStyle.Link)
        .setURL(`${APP_URL}/dashboard`);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(examButton, regularButton, dashboardButton);

      const typeLabel = resolvedType === "ALL" ? "UTS & UAS" : resolvedType;

      if (exams.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle(`📝 Jadwal Ujian (${typeLabel}) — ${getProdiName(userProdi)}`)
          .setColor(BRAND_COLOR)
          .setDescription(
            `Tidak ditemukan jadwal ujian **${typeLabel}** untuk **${getProdiName(userProdi)}** (Semester ${targetSemester}${kelasOpt ? `, Kelas ${kelasOpt}` : ""}).\n\n` +
              `💡 *Tips: Periksa filter prodi/kelas/semester atau klik tombol **Jadwal Ujian Web** di bawah untuk melihat sinkronisasi spreadsheet resmi.*`,
          )
          .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
          .setTimestamp();

        await reply(context, {
          embeds: [emptyEmbed],
          components: [row],
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📝 Jadwal Ujian (${typeLabel}) — ${getProdiName(userProdi)}`)
        .setColor(BRAND_COLOR)
        .setDescription(
          `Ditemukan **${exams.length}** sesi ujian untuk **${getProdiName(userProdi)}** (Semester ${targetSemester}${kelasOpt ? `, Kelas ${kelasOpt}` : ""})\n` +
            (examMode.enabled ? `⚡ *Mode Ujian Sedang Aktif di TaskPanel*\n` : "") +
            `*💡 Klik tautan ruangan untuk membuka lokasi Google Maps.*`,
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      for (const e of exams) {
        const roomLocationStr = formatRoomWithLocation(e.room);
        const dateStr =
          e.dateStr ||
          new Date(e.date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
          });

        embed.addFields({
          name: `🗓️ ${e.dayName || ""}, ${dateStr} | ⏰ ${e.startTime} - ${e.endTime} WIB (Kelas ${e.kelas})`,
          value: `📖 **[${e.type}] ${e.courseName}**\n${roomLocationStr}`,
          inline: false,
        });
      }

      await reply(context, {
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("[Command /ujian]", error);
      await reply(context, {
        content: "❌ Terjadi kesalahan saat mengambil jadwal ujian dari database.",
        ephemeral: true,
      });
    }
  },
};

export default command;

