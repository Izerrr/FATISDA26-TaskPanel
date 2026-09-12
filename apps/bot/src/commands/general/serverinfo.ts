import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { getAuthor, reply } from "../../lib/context.js";
import { AUTHOR_ICON, AUTHOR_NAME, BRAND_COLOR, FOOTER_ICON, FOOTER_TEXT } from "../../lib/constants.js";

const command: Command = {
  name: "serverinfo",
  description: "Menampilkan statistik dan informasi server FATISDA26",
  category: "general",
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Menampilkan statistik dan informasi server FATISDA26"),

  async run(client, context) {
    const guild = context.guild;
    if (!guild) return;

    const user = getAuthor(context);

    await guild.members.fetch(); // Fetch all members to get accurate count

    const owner = await guild.fetchOwner();
    const onlineMembers = guild.members.cache.filter((m) => m.presence?.status === "online").size;

    const embed = new EmbedBuilder()
      .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
      .setThumbnail(guild.iconURL({ extension: "png" }))
      .setColor(BRAND_COLOR)
      .setTitle(`${guild.name} Server Stats`)
      .addFields(
        { name: "➤ Owner", value: owner.user.tag, inline: true },
        { name: "➤ Members", value: `${guild.memberCount} users`, inline: true },
        { name: "➤ Members Online", value: `${onlineMembers} online`, inline: true },
        {
          name: "➤ Total Bots",
          value: `${guild.members.cache.filter((m) => m.user.bot).size} bots`,
          inline: true,
        },
        { name: "➤ Creation Date", value: guild.createdAt.toLocaleDateString("en-US"), inline: true },
        { name: "➤ Roles Count", value: `${guild.roles.cache.size} roles`, inline: true },
        { name: "➤ Verified", value: guild.verified ? "Yes ✅" : "No ❌", inline: true },
        {
          name: "➤ Boosters",
          value: guild.premiumSubscriptionCount && guild.premiumSubscriptionCount >= 1 ? `${guild.premiumSubscriptionCount} boosters` : "No boosters",
          inline: true,
        },
        {
          name: "➤ Emojis",
          value: guild.emojis.cache.size >= 1 ? `${guild.emojis.cache.size} emojis` : "No emojis",
          inline: true,
        },
      )
      .setImage(FOOTER_ICON)
      .setTimestamp()
      .setFooter({ text: `${FOOTER_TEXT} | Command requested by: ${user.tag}`, iconURL: FOOTER_ICON });

    await reply(context, { embeds: [embed] });
  },
};

export default command;
