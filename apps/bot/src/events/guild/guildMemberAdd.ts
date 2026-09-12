import { GuildMember, TextChannel } from "discord.js";
import { createWelcomeEmbed, CHANNEL_IDS } from "../../lib/welcomeEmbed.js";
import { syncMemberToDatabase } from "../../lib/sync.js";

export const name = "guildMemberAdd";

export const execute = async (member: GuildMember) => {
  // 1. Sync member ke database TaskPanel
  await syncMemberToDatabase(member);

  // 2. Kirim welcome embed ke welcome channel
  const channel = member.guild.channels.cache.get(CHANNEL_IDS.welcome) as TextChannel | undefined;
  if (!channel) return;

  const embed = createWelcomeEmbed(member, member.guild);
  await channel.send({ embeds: [embed] }).catch(() => {});
};
