import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command, Kelas, Prodi } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON, APP_URL } from "../../lib/constants.js";
import { prisma } from "../../lib/prisma.js";
import { parseWibDeadline } from "../../lib/dateParser.js";

const ALLOWED_ROLES = ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"];

const command: Command = {
  name: "tugas-buat",
  category: "academic",
  description: "Buat tugas kuliah baru untuk kelas di TaskPanel",
  data: new SlashCommandBuilder()
    .setName("tugas-buat")
    .setDescription("Buat tugas kuliah baru untuk kelas di TaskPanel")
    .addStringOption((opt) =>
      opt
        .setName("judul")
        .setDescription("Judul tugas (contoh: Tugas 2 Analisis Algoritma)")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("matkul")
        .setDescription("Nama atau kode mata kuliah (contoh: Algoritma & Pemrograman)")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("deadline")
        .setDescription("Tenggat pengumpulan (contoh: 'besok 23:59', '2026-10-25 23:59', '25-10-2026')")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("kelas")
        .setDescription("Kelas sasaran (A/B/C/D/E, default: kelas Anda)")
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
        .setDescription("Program studi target (default: prodi Anda)")
        .setRequired(false)
        .addChoices(
          { name: "Informatika (Solo)", value: "INFORMATIKA" },
          { name: "Sains Data", value: "SAINS_DATA" },
          { name: "Informatika PSDKU Kebumen", value: "INFORMATIKA_PSDKU_KEBUMEN" },
        ),
    )
    .addStringOption((opt) =>
      opt
        .setName("deskripsi")
        .setDescription("Instruksi atau catatan pengumpulan tugas (opsional)")
        .setRequired(false),
    ),

  async run(_client, context, args) {
    const authorId = isSlash(context) ? context.user.id : context.author.id;

    // Verifikasi otorisasi user di TaskPanel (Admin/PJ/Pengurus) atau permission Discord
    const member = context.member as any;
    const hasDiscordPerm =
      member?.permissions?.has(PermissionFlagsBits.ManageMessages) ||
      member?.permissions?.has(PermissionFlagsBits.ManageGuild);

    const dbUser = await prisma.user.findUnique({ where: { id: authorId } });
    const hasDbRole = dbUser?.roles?.some((r: string) => ALLOWED_ROLES.includes(r));

    if (!hasDiscordPerm && !hasDbRole) {
      await reply(context, {
        content:
          "❌ **Akses Ditolak:** Anda memerlukan peran **PJ Kelas**, **PJ Matkul**, atau **Admin** di TaskPanel untuk membuat tugas kelas.\n" +
          "Silakan hubungi PJ kelas atau buat tugas personal langsung di TaskPanel Web.",
        ephemeral: true,
      });
      return;
    }

    const judul = isSlash(context) ? context.options.getString("judul", true) : args[0];
    const matkulInput = isSlash(context) ? context.options.getString("matkul", true) : args[1];
    const deadlineInput = isSlash(context) ? context.options.getString("deadline", true) : args[2];
    const kelasOpt = isSlash(context) ? (context.options.getString("kelas") as Kelas | null) : (args[3]?.toUpperCase() as Kelas | null);
    const prodiOpt = isSlash(context) ? (context.options.getString("prodi") as Prodi | null) : null;
    const deskripsi = isSlash(context) ? context.options.getString("deskripsi") : args.slice(4).join(" ") || null;

    if (!judul || !matkulInput || !deadlineInput) {
      await reply(context, {
        content: "❌ Mohon lengkapi parameter tugas: `/tugas-buat judul:<judul> matkul:<matkul> deadline:<waktu>`",
        ephemeral: true,
      });
      return;
    }

    // Parse deadline
    const parsedDueDate = parseWibDeadline(deadlineInput);
    if (!parsedDueDate) {
      await reply(context, {
        content:
          "❌ Format waktu deadline tidak dikenali!\n" +
          "Gunakan format seperti:\n" +
          "• `besok 23:59` atau `lusa 18:00`\n" +
          "• `2026-10-25 23:59` (YYYY-MM-DD)\n" +
          "• `25-10-2026 23:59` (DD-MM-YYYY)",
        ephemeral: true,
      });
      return;
    }

    const targetProdi: Prodi = prodiOpt || dbUser?.prodi || "INFORMATIKA";
    const targetKelas: Kelas | null = (kelasOpt || dbUser?.kelas || null) as Kelas | null;

    try {
      // Pastikan target Guild terdaftar di database agar tidak melanggar foreign key
      const targetGuildId = context.guildId || process.env.DISCORD_GUILD_ID || "1547427568599302287";
      await prisma.guild.upsert({
        where: { id: targetGuildId },
        create: {
          id: targetGuildId,
          name: context.guild?.name || "FATISDA UNS 2026",
        },
        update: {},
      });

      // Cari mata kuliah yang cocok berdasarkan kode atau nama
      let matchedCourse = await prisma.course.findFirst({
        where: {
          OR: [
            { code: { equals: matkulInput.trim(), mode: "insensitive" } },
            { name: { contains: matkulInput.trim(), mode: "insensitive" } },
          ],
          prodi: targetProdi,
        },
      });

      // Jika tidak ditemukan di tabel Course, cari di Schedule untuk mendapatkan nama resmi matkul
      if (!matchedCourse) {
        const scheduleRef = await prisma.schedule.findFirst({
          where: {
            courseName: { contains: matkulInput.trim(), mode: "insensitive" },
            prodi: targetProdi,
          },
        });

        if (scheduleRef) {
          matchedCourse = await prisma.course.findFirst({
            where: { name: { equals: scheduleRef.courseName, mode: "insensitive" } },
          });

          if (!matchedCourse) {
            const words = scheduleRef.courseName.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
            const generatedCode = words.length > 1 ? words.map((w) => w[0]?.toUpperCase()).join("").slice(0, 6) : words[0]?.slice(0, 4).toUpperCase() || "MK";
            matchedCourse = await prisma.course.create({
              data: {
                code: generatedCode,
                name: scheduleRef.courseName,
                prodi: targetProdi,
                kelas: targetKelas,
              },
            });
          }
        }
      }

      // Pastikan author terdaftar sebagai User di database jika belum
      let creatorId = authorId;
      if (!dbUser) {
        const authorUsername = isSlash(context) ? context.user.username : context.author.username;
        const createdUser = await prisma.user.create({
          data: {
            id: authorId,
            discordId: authorId,
            username: authorUsername,
            prodi: targetProdi,
            kelas: targetKelas,
            roles: ["PJ_KELAS"],
          },
        });
        creatorId = createdUser.id;
      }

      // Buat tugas kelas di database
      const newTask = await prisma.task.create({
        data: {
          guildId: targetGuildId,
          title: judul.trim(),
          description: deskripsi?.trim() || null,
          status: "TODO",
          scope: "CLASS",
          prodi: targetProdi,
          kelas: targetKelas,
          courseId: matchedCourse?.id || null,
          createdById: creatorId,
          dueDate: parsedDueDate,
        },
        include: {
          course: true,
          createdBy: true,
        },
      });

      const dueTimestamp = Math.floor(parsedDueDate.getTime() / 1000);
      const courseStr = newTask.course ? `\`${newTask.course.code}\` ${newTask.course.name}` : matkulInput.trim();
      const scopeLabel = `Kelas ${newTask.kelas ?? "Semua"}`;

      const embed = new EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle("✅ Tugas Kelas Berhasil Dibuat di TaskPanel!")
        .setDescription(
          `Tugas baru telah didaftarkan ke sistem dan akan masuk ke dalam **Morning Briefing** serta **Pengingat Deadline Otomatis** bot.\n`,
        )
        .addFields(
          { name: "📌 Judul Tugas", value: `**${newTask.title}**`, inline: false },
          { name: "📚 Mata Kuliah", value: courseStr, inline: true },
          { name: "🏷️ Target Kelas", value: `${targetProdi} (${scopeLabel})`, inline: true },
          {
            name: "⏰ Tenggat Waktu (Deadline)",
            value: `<t:${dueTimestamp}:F>\n(<t:${dueTimestamp}:R>)`,
            inline: false,
          },
          ...(newTask.description ? [{ name: "📝 Catatan / Deskripsi", value: newTask.description }] : []),
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      const taskPanelButton = new ButtonBuilder()
        .setLabel("Lihat di TaskPanel Web")
        .setStyle(ButtonStyle.Link)
        .setURL(`${APP_URL}/dashboard/tasks`);

      const scheduleButton = new ButtonBuilder()
        .setLabel("Jadwal Kuliah")
        .setStyle(ButtonStyle.Link)
        .setURL(`${APP_URL}/dashboard/schedule`);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(taskPanelButton, scheduleButton);

      await reply(context, {
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error("[Command /tugas-buat]", error);
      await reply(context, {
        content: "❌ Terjadi kesalahan saat menyimpan tugas baru ke database.",
        ephemeral: true,
      });
    }
  },
};

export default command;
