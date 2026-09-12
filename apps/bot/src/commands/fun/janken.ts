import { EmbedBuilder, MessageReaction, PartialUser, SlashCommandBuilder, User } from "discord.js";
import { Command } from "../../types.js";
import { getAuthor, isSlash, sendChannel } from "../../lib/context.js";
import { AUTHOR_ICON, AUTHOR_NAME, BRAND_COLOR, FOOTER_ICON, FOOTER_TEXT } from "../../lib/constants.js";

const CHOICES = ["🗻", "✂", "📰"] as const;
type Choice = (typeof CHOICES)[number];

function beats(a: Choice, b: Choice): boolean {
  return (a === "🗻" && b === "✂") || (a === "✂" && b === "📰") || (a === "📰" && b === "🗻");
}

const command: Command = {
  name: "janken",
  category: "fun",
  description: "Rock Paper Scissors / Janken",
  data: new SlashCommandBuilder().setName("janken").setDescription("Bermain suit Jepang (Batu, Gunting, Kertas) bersama bot"),

  async run(client, context) {
    const author = getAuthor(context);

    const embed = new EmbedBuilder()
      .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
      .setTitle("Janken!")
      .setThumbnail(FOOTER_ICON)
      .setDescription("React untuk mulai bermain!")
      .addFields({ name: "**Batu**", value: "🗻" }, { name: "**Gunting**", value: "✂" }, { name: "**Kertas**", value: "📰" })
      .setColor(BRAND_COLOR)
      .setTimestamp()
      .setFooter({ text: `${FOOTER_TEXT} | Command requested by: ${author.tag}`, iconURL: FOOTER_ICON });

    const msg = isSlash(context) ? await context.reply({ embeds: [embed], fetchReply: true }) : await sendChannel(context.channel, { embeds: [embed] });

    if (!msg) return;

    await msg.react("🗻");
    await msg.react("✂");
    await msg.react("📰");

    const me: Choice = CHOICES[Math.floor(Math.random() * CHOICES.length)];

    try {
      const collected = await msg.awaitReactions({
        filter: (reaction: MessageReaction, user: User | PartialUser) => CHOICES.includes(reaction.emoji.name as Choice) && user.id === author.id,
        max: 1,
        time: 60_000,
        errors: ["time"],
      });

      const reaction = collected.first();
      const playerChoice = reaction?.emoji.name as Choice | undefined;
      if (!playerChoice) return;

      const resultEmbed = new EmbedBuilder()
        .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
        .setTitle("Hasil Janken!")
        .setThumbnail(FOOTER_ICON)
        .addFields({ name: "Pilihan kamu", value: playerChoice }, { name: "Pilihan FATISDA26 Helper", value: me })
        .setColor(BRAND_COLOR)
        .setTimestamp()
        .setFooter({ text: `${FOOTER_TEXT} | Command requested by: ${author.tag}`, iconURL: FOOTER_ICON });

      await msg.edit({ embeds: [resultEmbed] });

      if (me === playerChoice) {
        await msg.reply("Hasilnya Seri!");
      } else if (beats(playerChoice, me)) {
        await msg.reply("Kamu Menang! 🎉");
      } else {
        await msg.reply("Kamu Kalah! 😢");
      }
    } catch {
      await msg.reply("Process cancelled, you failed to respond in time!");
    }
  },
};

export default command;
