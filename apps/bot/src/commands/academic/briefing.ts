import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command, ExtendedClient, Kelas, Prodi } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { BRAND_COLOR, FOOTER_TEXT, FOOTER_ICON } from "../../lib/constants.js";
import { prisma } from "../../lib/prisma.js";
import { sendDailyMorningBriefing } from "../../lib/scheduler.js";

const command: Command = {
  name: "briefing",
  category: "academic",
  description: "Kirim Morning Briefing jadwal kuliah & tugas hari ini secara manual",
  data: new SlashCommandBuilder()
    .setName("briefing")
    .setDescription("Kirim Morning Briefing jadwal kuliah & tugas hari ini secara manual")
    .addStringOption((opt) =>
      opt
        .setName("prodi")
        .setDescription("Program studi target")
        .setRequired(false)
        .addChoices({ name: "Informatika", value: "INFORMATIKA" }, { name: "Sains Data", value: "SAINS_DATA" }, { name: "Informatika PSDKU Kebumen", value: "INFORMATIKA_PSDKU_KEBUMEN" }),
    )
    .addStringOption((opt) =>
      opt.setName("kelas").setDescription("Kelas target (A/B/C/D)").setRequired(false).addChoices({ name: "Kelas A", value: "A" }, { name: "Kelas B", value: "B" }, { name: "Kelas C", value: "C" }, { name: "Kelas D", value: "D" }),
    )
    .addIntegerOption((opt) => opt.setName("semester").setDescription("Semester perkuliahan target (1-8, default: semester profil atau 1)").setRequired(false).setMinValue(1).setMaxValue(8))
    .addBooleanOption((opt) => opt.setName("di_channel_ini").setDescription("Kirimkan briefing langsung ke channel saat ini").setRequired(false)),

  async run(client: ExtendedClient, context, args) {
    const authorId = isSlash(context) ? context.user.id : context.author.id;
    const currentChannelId = context.channelId;

    let prodiOpt = isSlash(context) ? (context.options.getString("prodi") as Prodi | null) : (args[0]?.toUpperCase() as Prodi | null);
    let kelasOpt = isSlash(context) ? (context.options.getString("kelas") as Kelas | null) : (args[1]?.toUpperCase() as Kelas | null);
    let semesterOpt = isSlash(context) ? context.options.getInteger("semester") : args[2] ? parseInt(args[2], 10) : null;
    if (isNaN(semesterOpt as number)) semesterOpt = null;
    const sendHere = isSlash(context) ? Boolean(context.options.getBoolean("di_channel_ini")) : false;

    // Ambil profil user jika opsi tidak diisi
    if (!prodiOpt || !kelasOpt || semesterOpt === null) {
      const dbUser = await prisma.user.findUnique({ where: { id: authorId } });
      if (dbUser) {
        if (!prodiOpt && dbUser.prodi) prodiOpt = dbUser.prodi;
        if (!kelasOpt && dbUser.kelas) kelasOpt = dbUser.kelas;
        if (semesterOpt === null && dbUser.semester) semesterOpt = dbUser.semester;
      }
    }
    semesterOpt = semesterOpt ?? 1;

    try {
      if (isSlash(context)) {
        await context.deferReply({ ephemeral: false });
      }

      let customTargets;
      if (prodiOpt && kelasOpt) {
        customTargets = [
          {
            prodi: prodiOpt,
            kelas: kelasOpt,
            semester: semesterOpt,
            channelId: sendHere && currentChannelId ? currentChannelId : undefined,
          },
        ];
      }

      const result = await sendDailyMorningBriefing(client, customTargets);

      const embed = new EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle("🌅 Morning Briefing Eksekusi Selesai")
        .setDescription(
          [
            `**Status Pengiriman:**`,
            `• Terkirim: **${result.sent} channel**`,
            `• Dilewati (tidak ada jadwal/tugas/channel): **${result.skipped}**`,
            result.errors.length > 0 ? `• Kendala: \n${result.errors.map((e) => `  - ${e}`).join("\n")}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
        .setTimestamp();

      if (isSlash(context)) {
        await context.editReply({ embeds: [embed] });
      } else {
        await reply(context, { embeds: [embed] });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isSlash(context)) {
        await context.editReply({ content: `❌ Gagal menjalankan briefing: ${errMsg}` });
      } else {
        await reply(context, { content: `❌ Gagal menjalankan briefing: ${errMsg}` });
      }
    }
  },
};

export default command;
