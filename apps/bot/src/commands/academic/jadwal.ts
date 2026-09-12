import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command, Kelas, Prodi } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON } from "../../lib/constants.js";
import { prisma } from "../../lib/prisma.js";

const DAY_NAMES: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

const command: Command = {
  name: "jadwal",
  category: "academic",
  description: "Lihat jadwal kuliah dari TaskPanel",
  data: new SlashCommandBuilder()
    .setName("jadwal")
    .setDescription("Lihat jadwal kuliah dari TaskPanel")
    .addStringOption((option) =>
      option
        .setName("hari")
        .setDescription("Pilih hari jadwal yang ingin dilihat")
        .setRequired(false)
        .addChoices(
          { name: "Hari Ini", value: "TODAY" },
          { name: "Besok", value: "TOMORROW" },
          { name: "Senin", value: "1" },
          { name: "Selasa", value: "2" },
          { name: "Rabu", value: "3" },
          { name: "Kamis", value: "4" },
          { name: "Jumat", value: "5" },
          { name: "Sabtu", value: "6" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("kelas")
        .setDescription("Filter berdasarkan kelas (A/B/C/D)")
        .setRequired(false)
        .addChoices({ name: "Kelas A", value: "A" }, { name: "Kelas B", value: "B" }, { name: "Kelas C", value: "C" }, { name: "Kelas D", value: "D" }),
    )
    .addIntegerOption((option) => option.setName("semester").setDescription("Semester perkuliahan (1-8, default: 2)").setRequired(false).setMinValue(1).setMaxValue(8)),

  async run(_client, context, args) {
    const authorId = isSlash(context) ? context.user.id : context.author.id;
    const hariOpt = isSlash(context) ? context.options.getString("hari") : args[0]?.toUpperCase();
    let kelasOpt = isSlash(context) ? context.options.getString("kelas") : args[1]?.toUpperCase();
    let semesterOpt = isSlash(context) ? context.options.getInteger("semester") : null;

    try {
      if (!kelasOpt || semesterOpt === null) {
        const dbUser = await prisma.user.findUnique({ where: { id: authorId } });
        if (!kelasOpt && dbUser?.kelas) {
          kelasOpt = dbUser.kelas;
        }
        if (semesterOpt === null && dbUser?.semester) {
          semesterOpt = dbUser.semester;
        }
      }
      semesterOpt = semesterOpt ?? 2;

      // Hitung hari saat ini dalam zona waktu WIB (UTC+7)
      const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const currentJsDay = nowWib.getUTCDay(); // 0: Minggu, 1: Senin, ..., 6: Sabtu

      let targetDayNumber = 1;
      let dayLabel = "Hari Ini";

      if (!hariOpt || hariOpt === "TODAY") {
        if (currentJsDay === 0) {
          targetDayNumber = 1;
          dayLabel = "Senin (Hari ini Minggu Libur)";
        } else if (currentJsDay === 7) {
          targetDayNumber = 1;
          dayLabel = "Senin";
        } else {
          targetDayNumber = currentJsDay;
          dayLabel = `Hari Ini (${DAY_NAMES[targetDayNumber] || "Hari Ini"})`;
        }
      } else if (hariOpt === "TOMORROW") {
        const tomorrowJsDay = (currentJsDay + 1) % 7;
        targetDayNumber = tomorrowJsDay === 0 ? 1 : tomorrowJsDay;
        dayLabel = `Besok (${DAY_NAMES[targetDayNumber] || "Besok"})`;
      } else {
        const parsed = parseInt(hariOpt, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 7) {
          targetDayNumber = parsed;
          dayLabel = DAY_NAMES[targetDayNumber] || `Hari ke-${targetDayNumber}`;
        }
      }

      const whereClause: any = {
        day: targetDayNumber,
        semester: semesterOpt,
        prodi: "INFORMATIKA" as Prodi,
      };

      if (kelasOpt && ["A", "B", "C", "D"].includes(kelasOpt)) {
        whereClause.kelas = kelasOpt as Kelas;
      }

      const schedules = await prisma.schedule.findMany({
        where: whereClause,
        include: {
          course: true,
        },
        orderBy: [{ startTime: "asc" }, { kelas: "asc" }],
      });

      const scheduleButton = new ButtonBuilder().setLabel("Buka Jadwal Lengkap Web").setStyle(ButtonStyle.Link).setURL("https://taskpanel.ftsduaenam.web.id/dashboard/schedule");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(scheduleButton);

      if (schedules.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle(`📅 Jadwal Kuliah — ${dayLabel}`)
          .setColor(BRAND_COLOR)
          .setDescription(`🎉 Tidak ada jadwal kuliah untuk **${dayLabel}** (Semester ${semesterOpt}${kelasOpt ? `, Kelas ${kelasOpt}` : ""}). Selamat beristirahat!`)
          .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
          .setTimestamp();

        await reply(context, {
          embeds: [emptyEmbed],
          components: [row],
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📅 Jadwal Perkuliahan — ${DAY_NAMES[targetDayNumber]} (Semester ${semesterOpt})`)
        .setColor(BRAND_COLOR)
        .setDescription(`Ditemukan **${schedules.length}** sesi kuliah ${kelasOpt ? `untuk Kelas ${kelasOpt}` : ""}\n`)
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      for (const s of schedules) {
        const courseName = s.course?.name || s.courseName;
        const courseCode = s.course?.code ? `\`${s.course.code}\` ` : "";
        const room = s.room ? `🏛️ **Ruang:** ${s.room}` : "🏛️ **Ruang:** -";
        const lecturer = s.lecturer ? `👨‍🏫 **Dosen:** ${s.lecturer}` : "";

        embed.addFields({
          name: `⏰ ${s.startTime} - ${s.endTime} WIB | Kelas ${s.kelas}`,
          value: `📖 **${courseCode}${courseName}**\n${room}${lecturer ? `\n${lecturer}` : ""}`,
          inline: false,
        });
      }

      await reply(context, {
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("[Command /jadwal]", error);
      await reply(context, {
        content: "❌ Terjadi kesalahan saat mengambil jadwal kuliah dari database.",
        ephemeral: true,
      });
    }
  },
};

export default command;
