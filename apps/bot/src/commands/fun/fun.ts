import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { reply } from "../../lib/context.js";
import { AUTHOR_ICON, AUTHOR_NAME, BRAND_COLOR, FOOTER_ICON, FOOTER_TEXT } from "../../lib/constants.js";

const command: Command = {
  name: "fun",
  category: "fun",
  description: "Fun commands list",
  data: new SlashCommandBuilder().setName("fun").setDescription("Menampilkan daftar perintah hiburan/roleplay acak"),

  async run(client, context) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("Hello There! ")
      .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
      .setDescription("Command RP yang bisa digunakan.")
      .setThumbnail(FOOTER_ICON)
      .addFields(
        { name: "➤ Janken", value: "`/janken` atau `a!janken`" },
        { name: "➤ Tanya FATISDA26 Helper", value: "`/tanya` atau `a!tanya`" },
        { name: "➤ Meme", value: "`/meme` atau `a!meme`" },
        { name: "➤ Hug", value: "`/hug` atau `a!hug @user`" },
        { name: "➤ Pat", value: "`/pat` atau `a!pat @user`" },
        { name: "➤ Wink", value: "`/wink` atau `a!wink`" },
      )
      .setImage(FOOTER_ICON)
      .setTimestamp()
      .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

    await reply(context, { embeds: [embed] });
  },
};

export default command;
