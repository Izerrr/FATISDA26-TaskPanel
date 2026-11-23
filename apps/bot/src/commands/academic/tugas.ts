import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command, Kelas, TaskScope, TaskStatus } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON, APP_URL } from "../../lib/constants.js";
import { isMissingTableError, prisma } from "../../lib/prisma.js";

const VALID_STATUSES: TaskStatus[] = ["TODO", "WAITING", "IN_PROGRESS", "NEED_REVIEW", "DONE"];

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
          { name: "Waiting List", value: "WAITING" },
          { name: "In Progress", value: "IN_PROGRESS" },
          { name: "Need Review", value: "NEED_REVIEW" },
          { name: "Selesai (Done)", value: "DONE" },
          { name: "Semua Status", value: "ALL" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("scope")
        .setDescription("Filter tipe tugas")
        .setRequired(false)
        .addChoices(
          { name: "Semua Tugas", value: "ALL" },
          { name: "Tugas Kelas", value: "CLASS" },
          { name: "Tugas Kelompok", value: "GROUP" },
          { name: "Tugas Personal", value: "PERSONAL" },
        ),
    ),

  async run(_client, context, args) {
    const authorId = isSlash(context) ? context.user.id : context.author.id;
    let selectedKelas = isSlash(context) ? context.options.getString("kelas") : args[0]?.toUpperCase();
    const selectedStatus = isSlash(context) ? (context.options.getString("status") ?? "ACTIVE") : "ACTIVE";
    const selectedScope = isSlash(context) ? (context.options.getString("scope") ?? "ALL") : "ALL";

    if (isSlash(context) && !context.deferred && !context.replied) {
      await context.deferReply().catch(() => {});
    }

    try {
      if (!selectedKelas) {
        const dbUser = await prisma.user.findUnique({ where: { id: authorId } });
        if (dbUser?.kelas) {
          selectedKelas = dbUser.kelas;
        }
      }

      const statusCondition =
        selectedStatus === "ACTIVE" ? { in: ["TODO", "WAITING", "IN_PROGRESS", "NEED_REVIEW"] as TaskStatus[] } : selectedStatus !== "ALL" && VALID_STATUSES.includes(selectedStatus as TaskStatus) ? (selectedStatus as TaskStatus) : undefined;

      const classFilter: any = {
        scope: "CLASS",
      };
      if (selectedKelas && ["A", "B", "C", "D", "E"].includes(selectedKelas)) {
        classFilter.OR = [{ kelas: selectedKelas as Kelas }, { kelas: null }];
      }

      const personalFilter: any = {
        scope: "PERSONAL",
        OR: [{ createdById: authorId }, { assignedTo: authorId }],
      };

      const groupFilter: any = {
        scope: "GROUP",
        OR: [{ createdById: authorId }, { members: { some: { userId: authorId } } }],
      };

      const whereClause: any = {};
      if (statusCondition) {
        whereClause.status = statusCondition;
      }

      if (selectedScope === "CLASS") {
        Object.assign(whereClause, classFilter);
      } else if (selectedScope === "GROUP") {
        Object.assign(whereClause, groupFilter);
      } else if (selectedScope === "PERSONAL") {
        Object.assign(whereClause, personalFilter);
      } else {
        whereClause.OR = [classFilter, groupFilter, personalFilter];
      }

      type BotTaskRow = {
        id: string;
        title: string;
        status: string;
        scope: string;
        kelas: string | null;
        dueDate: Date | null;
        course: { code: string; name: string } | null;
        members?: Array<{ id: string }>;
        subtasks?: Array<{ isDone: boolean }>;
      };

      const fetchTasks = async (includeSubtasks: boolean): Promise<BotTaskRow[]> => {
        try {
          return await prisma.task.findMany({
            where: whereClause,
            include: {
              course: true,
              createdBy: true,
              members: { select: { id: true } },
              ...(includeSubtasks ? { subtasks: { select: { isDone: true } } } : {}),
            },
            orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
            take: 12,
          });
        } catch (err) {
          if (includeSubtasks && isMissingTableError(err)) {
            return fetchTasks(false);
          }
          throw err;
        }
      };

      const [tasks, totalCount] = await Promise.all([
        fetchTasks(true),
        prisma.task.count({ where: whereClause }),
      ]);

      const linkButton = new ButtonBuilder().setLabel("Buka TaskPanel Web").setStyle(ButtonStyle.Link).setURL(APP_URL);

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
        WAITING: "⏸️",
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
        const scopeStr =
          t.scope === "CLASS"
            ? `Kelas ${t.kelas ?? "Semua"}`
            : t.scope === "GROUP"
              ? `Kelompok (${t.members?.length ?? 0} anggota)`
              : "Personal";
        const subtasks = t.subtasks ?? [];
        const totalSubtasks = subtasks.length;
        const doneSubtasks = totalSubtasks > 0 ? subtasks.filter((s) => s.isDone).length : 0;
        const subtaskLine = totalSubtasks > 0 ? `\n☑️ **Subtugas:** ${doneSubtasks}/${totalSubtasks} selesai` : "";

        embed.addFields({
          name: `${icon} ${t.title}`.slice(0, 250),
          value: `📚 **Matkul:** ${courseStr}\n⏰ **Deadline:** ${deadlineStr}\n🏷️ **Tipe:** ${scopeStr} | **Status:** \`${t.status}\`${subtaskLine}`,
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
