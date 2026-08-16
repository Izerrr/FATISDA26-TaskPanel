import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { getAuthor, reply } from "../../lib/context.js";
import { AUTHOR_ICON, AUTHOR_NAME, BRAND_COLOR, FOOTER_ICON, FOOTER_TEXT } from "../../lib/constants.js";

const command: Command = {
  name: "instagram",
  aliases: ["insta"],
  category: "info",
  description: "Instagram link FATISDA26",
  data: new SlashCommandBuilder().setName("instagram").setDescription("Menampilkan link Instagram resmi FATISDA26"),

  async run(client, context) {
    const author = getAuthor(context);

    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("Hello There! ")
      .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
      .setDescription("Link Instagram FATISDA26, Yaitu:")
      .addFields({ name: "Link", value: "https://instagram.com/FATISDA26" })
      .setImage(FOOTER_ICON)
      .setTimestamp()
      .setFooter({ text: `${FOOTER_TEXT} | Command requested by: ${author.tag}`, iconURL: FOOTER_ICON });

    await reply(context, { embeds: [embed] });
  },
};

export default command;
