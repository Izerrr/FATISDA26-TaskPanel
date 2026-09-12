import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { isSlash, reply } from "../../lib/context.js";
import { syncAllGuildMembers } from "../../lib/sync.js";

const command: Command = {
  name: "sync",
  category: "academic",
  description: "Sinkronisasi seluruh data anggota, role, dan kelas Discord ke database TaskPanel",
  data: new SlashCommandBuilder().setName("sync").setDescription("Sinkronisasi seluruh data anggota dan role Discord ke database TaskPanel").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async run(_client, context) {
    const guild = context.guild;
    if (!guild) {
      await reply(context, {
        content: "❌ Perintah ini hanya dapat dijalankan di dalam server Discord!",
        ephemeral: true,
      });
      return;
    }

    if (isSlash(context)) {
      await context.deferReply({ ephemeral: true });
    }

    try {
      const syncedCount = await syncAllGuildMembers(guild);

      const msg = `✅ Berhasil menyinkronkan **${syncedCount}** anggota server **${guild.name}** ke database TaskPanel!`;

      if (isSlash(context)) {
        await context.editReply({ content: msg });
      } else {
        await reply(context, { content: msg });
      }
    } catch (error) {
      console.error("[Command /sync]", error);
      const errMsg = "❌ Gagal melakukan sinkronisasi dengan database TaskPanel.";
      if (isSlash(context)) {
        await context.editReply({ content: errMsg });
      } else {
        await reply(context, { content: errMsg });
      }
    }
  },
};

export default command;
