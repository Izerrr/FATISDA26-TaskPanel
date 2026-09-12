import { EmbedBuilder, Message } from "discord.js";
import { ExtendedClient } from "../../types.js";
import { AUTHOR_ICON, AUTHOR_NAME, BRAND_COLOR, FOOTER_ICON, FOOTER_TEXT } from "../../lib/constants.js";

const PREFIX = "a!";

export const name = "messageCreate";

export const execute = async (message: Message, client: ExtendedClient) => {
  if (message.author.bot) return;

  // Auto-responder
  if (message.content.startsWith("Selamat Malam")) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("Hello There! ")
      .setDescription(`Selamat malam juga kak ${message.author.username}~`)
      .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
      .setImage("https://tenor.com/view/walking-anime-goodbye-gif-20674172.gif")
      .setTimestamp()
      .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

    return message.reply({ embeds: [embed] });
  }

  if (message.content.startsWith("Selamat Pagi")) {
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("Hello There! ")
      .setDescription(`Selamat pagi juga kak ${message.author.username}~`)
      .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
      .setImage("https://tenor.com/view/walking-anime-goodbye-gif-20674172.gif")
      .setTimestamp()
      .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });

    return message.reply({ embeds: [embed] });
  }

  // Prefix command handler
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmdName = args.shift()?.toLowerCase();
  if (!cmdName) return;

  const command =
    client.commands.get(cmdName) ??
    client.commands.find((c) => c.aliases?.includes(cmdName) ?? false);

  if (!command) return;

  try {
    await command.run(client, message, args);
  } catch (error) {
    console.error(error);
    if (message.channel.isSendable()) {
      await message.channel.send("❌ Terjadi kesalahan saat menjalankan command ini!");
    }
  }
};
