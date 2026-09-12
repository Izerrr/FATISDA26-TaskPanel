import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command, Kelas, TaskScope, TaskStatus } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON } from "../../lib/constants.js";
import { prisma } from "../../lib/prisma.js";

const VALID_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

const command: Command = {
  name: "tugas",
  category: "academic",
  description: "Lihat daftar tugas kuliah aktif dari TaskPanel",
  data: new SlashCommandBuilder()
    .setName("tugas")
    .setDescription("Lihat daftar tugas kuliah aktif dari TaskPanel")
    .addStringOption((option) =>
      option
        .setName("kelas")
        .setDescription("Filter berdasarkan kelas (A/B/C/D/E)")
        .setRequired(false)
        .addChoices({ name: "Kelas A", value: "A" }, { name: "Kelas B", value: "B" }, { name: "Kelas C", value: "C" }, { name: "Kelas D", value: "D" }, { name: "Kelas E", value: "E" }),
    )
    .addStringOption((option) =>
      option
        .setName("status")
        .setDescription("Filter status tugas")
        .setRequired(false)
        .addChoices(
          { name: "Aktif (Belum Selesai)", value: "ACTIVE" },
          { name: "TODO", value: "TODO" },
          { name: "In Progress", value: "IN_PROGRESS" },
          { name: "Need Review", value: "NEED_REVIEW" },
          { name: "Selesai (Done)", value: "DONE" },
          { name: "Semua Status", value: "ALL" },
        ),
    )
    .addStringOption((option) =>
      option.setName("scope").setDescription("Filter tipe tugas").setRequired(false).addChoices({ name: "Semua Tugas", value: "ALL" }, { name: "Tugas Kelas", value: "CLASS" }, { name: "Tugas Personal", value: "PERSONAL" }),
    ),

  async run(_client, context, args) {
    const authorId = isSlash(context) ? context.user.id : context.author.id;
    let selectedKelas = isSlash(context) ? context.options.getString("kelas") : args[0]?.toUpperCase();
    const selectedStatus = isSlash(context) ? (context.options.getString("status") ?? "ACTIVE") : "ACTIVE";
    const selectedScope = isSlash(context) ? (context.options.getString("scope") ?? "ALL") : "ALL";

    try {
      if (!selectedKelas) {
        const dbUser = await prisma.user.findUnique({ where: { id: authorId } });
        if (dbUser?.kelas) {
          selectedKelas = dbUser.kelas;
        }
      }

      const whereClause: any = {};

      if (selectedKelas && ["A", "B", "C", "D", "E"].includes(selectedKelas)) {
        whereClause.kelas = selectedKelas as Kelas;
      }

      if (selectedStatus === "ACTIVE") {
        whereClause.status = {
          in: ["TODO", "IN_PROGRESS", "NEED_REVIEW"],
        };
      } else if (selectedStatus !== "ALL" && VALID_STATUSES.includes(selectedStatus as TaskStatus)) {
        whereClause.status = selectedStatus as TaskStatus;
      }

      if (selectedScope === "CLASS") {
        whereClause.scope = "CLASS" as TaskScope;
      } else if (selectedScope === "PERSONAL") {
        whereClause.scope = "PERSONAL" as TaskScope;
      }

      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          course: true,
          createdBy: true,
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 12,
      });

      const totalCount = await prisma.task.count({ where: whereClause });

      const linkButton = new ButtonBuilder().setLabel("Buka TaskPanel Web").setStyle(ButtonStyle.Link).setURL("https://taskpanel.ftsduaenam.web.id");

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(linkButton);

      if (tasks.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setTitle("📋 TaskPanel — Daftar Tugas")
          .setColor(BRAND_COLOR)
          .setDescription("🎉 Tidak ada tugas kuliah yang ditemukan untuk kriteria ini!")
          .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
          .setTimestamp();

        await reply(context, {
          embeds: [emptyEmbed],
          components: [row],
        });
        return;
      }

      const statusIcons: Record<string, string> = {
        TODO: "📌",
        IN_PROGRESS: "⏳",
        NEED_REVIEW: "👀",
        DONE: "✅",
      };

      const embed = new EmbedBuilder()
        .setTitle("📋 TaskPanel — Daftar Tugas Kuliah")
        .setColor(BRAND_COLOR)
        .setDescription(`Menampilkan **${tasks.length}** dari **${totalCount}** tugas ${selectedKelas ? `(Kelas ${selectedKelas})` : ""}\n`)
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      for (const t of tasks) {
        const icon = statusIcons[t.status] || "📌";
        const courseStr = t.course ? `\`${t.course.code}\` ${t.course.name}` : "Umum";
        const deadlineStr = t.dueDate ? `<t:${Math.floor(t.dueDate.getTime() / 1000)}:R> (<t:${Math.floor(t.dueDate.getTime() / 1000)}:d>)` : "Tidak ada deadline";
        const scopeStr = t.scope === "CLASS" ? `Kelas ${t.kelas ?? "Semua"}` : "Personal";

        embed.addFields({
          name: `${icon} ${t.title}`,
          value: `📚 **Matkul:** ${courseStr}\n⏰ **Deadline:** ${deadlineStr}\n🏷️ **Tipe:** ${scopeStr} | **Status:** \`${t.status}\``,
          inline: false,
        });
      }

      await reply(context, {
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("[Command /tugas]", error);
      await reply(context, {
        content: "❌ Terjadi kesalahan saat mengambil daftar tugas dari database.",
        ephemeral: true,
      });
    }
  },
};

export default command;
