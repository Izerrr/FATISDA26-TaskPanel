import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { getStringArg, reply } from "../../lib/context.js";
import { BRAND_COLOR } from "../../lib/constants.js";

const command: Command = {
  name: "help",
  description: "Menampilkan daftar semua perintah bot yang tersedia",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Menampilkan daftar semua perintah bot")
    .addStringOption((option) => option.setName("command").setDescription("Nama perintah spesifik untuk info lebih detail").setRequired(false)),

  async run(client, context, args) {
    const commandName = getStringArg(context, args, "command") ?? args[0] ?? null;

    if (commandName) {
      const target = client.commands.get(commandName.toLowerCase());
      if (!target) {
        await reply(context, {
          content: `❌ Perintah \`${commandName}\` tidak ditemukan.`,
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Help: ${target.name}`)
        .setColor(BRAND_COLOR)
        .addFields(
          { name: "Deskripsi", value: target.description || "Tidak ada deskripsi." },
          { name: "Kategori", value: target.category || "General" },
          { name: "Aliases", value: target.aliases?.length ? target.aliases.join(", ") : "Tidak ada" },
        )
        .setTimestamp();

      await reply(context, { embeds: [embed] });
      return;
    }

    // Jika tidak mencari command spesifik, tampilkan seluruh menu
    const categories: Record<string, string[]> = {};
    client.commands.forEach((cmd) => {
      const cat = cmd.category || "General";
      (categories[cat] ??= []).push(`\`${cmd.name}\``);
    });

    const embed = new EmbedBuilder().setTitle("📚 Menu Perintah FATISDA26 Assistant").setDescription("Gunakan `/help [nama_command]` untuk melihat detail per-command.").setColor(BRAND_COLOR).setTimestamp();

    for (const [category, cmds] of Object.entries(categories)) {
      embed.addFields({ name: `➤ ${category.toUpperCase()}`, value: cmds.join(", "), inline: false });
    }

    await reply(context, { embeds: [embed] });
  },
};

export default command;
