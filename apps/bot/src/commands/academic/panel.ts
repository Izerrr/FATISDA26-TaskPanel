import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON } from "../../lib/constants.js";
import { prisma } from "../../lib/prisma.js";

const command: Command = {
  name: "panel",
  category: "academic",
  description: "Tautan cepat dan ringkasan status FATISDA26 TaskPanel",
  data: new SlashCommandBuilder().setName("panel").setDescription("Tautan cepat dan ringkasan status FATISDA26 TaskPanel"),

  async run(_client, context) {
    try {
      const [activeTasksCount, totalCoursesCount] = await Promise.all([
        prisma.task.count({
          where: {
            status: { in: ["TODO", "IN_PROGRESS", "NEED_REVIEW"] },
          },
        }),
        prisma.course.count(),
      ]);

      const embed = new EmbedBuilder()
        .setTitle("🎓 FATISDA26 TaskPanel Web")
        .setColor(BRAND_COLOR)
        .setDescription("TaskPanel adalah platform akademik terintegrasi untuk mahasiswa Informatika & Sains Data FATISDA UNS Angkatan 2024.\n" + "Kelola tugas, sinkronisasi jadwal kuliah otomatis, dan kolaborasi dalam satu tempat.")
        .addFields(
          {
            name: "📌 Tugas Aktif",
            value: `**${activeTasksCount}** tugas perlu diselesaikan`,
            inline: true,
          },
          {
            name: "📚 Total Mata Kuliah",
            value: `**${totalCoursesCount}** mata kuliah terdata`,
            inline: true,
          },
          {
            name: "🌐 Web Dashboard",
            value: "[taskpanel.ftsduaenam.web.id](https://taskpanel.ftsduaenam.web.id)",
            inline: false,
          },
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      const dashboardBtn = new ButtonBuilder().setLabel("Buka Dashboard").setStyle(ButtonStyle.Link).setURL("https://taskpanel.ftsduaenam.web.id");

      const scheduleBtn = new ButtonBuilder().setLabel("Lihat Jadwal Kuliah").setStyle(ButtonStyle.Link).setURL("https://taskpanel.ftsduaenam.web.id/dashboard/schedule");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(dashboardBtn, scheduleBtn);

      await reply(context, {
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("[Command /panel]", error);
      await reply(context, {
        content: "❌ Terjadi kesalahan saat memuat ringkasan TaskPanel.",
        ephemeral: true,
      });
    }
  },
};

export default command;
