import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { getAuthor, getStringArg, reply } from "../../lib/context.js";
import { AUTHOR_ICON, AUTHOR_NAME, BRAND_COLOR, FOOTER_ICON, FOOTER_TEXT } from "../../lib/constants.js";

const ANSWERS = [
  "Iya, pasti!",
  "Tidak mungkin.",
  "Mungkin aja~",
  "Woof! Tentu saja!",
  "Hmm... sepertinya tidak.",
  "Coba lagi nanti!",
  "Jawabannya: Ya!",
  "Kayaknya nggak deh...",
  "Sudah jelas iya!",
  "50/50, siapa tau?",
  "FATISDA26 Helper rasa iya!",
  "FATISDA26 Helper rasa tidak...",
];

const command: Command = {
  name: "tanya",
  category: "fun",
  description: "Tanya FATISDA26 Helper pertanyaan apapun!",
  data: new SlashCommandBuilder()
    .setName("tanya")
    .setDescription("Tanya FATISDA26 Helper pertanyaan apapun!")
    .addStringOption((option) => option.setName("pertanyaan").setDescription("Pertanyaan yang ingin kamu tanyakan").setRequired(true)),

  async run(client, context, args) {
    const author = getAuthor(context);
    const question = getStringArg(context, args, "pertanyaan");

    if (!question) {
      await reply(context, {
        content: "Tanya apa dulu? Contoh: `/tanya pertanyaan:Apakah aku ganteng?` atau `a!tanya Apakah aku cantik?`",
        ephemeral: true,
      });
      return;
    }

    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setAuthor({ name: AUTHOR_NAME, iconURL: AUTHOR_ICON })
      .setTitle("🔮 Tanya FATISDA26 Helper")
      .addFields({ name: "Pertanyaan", value: question }, { name: "Jawaban FATISDA26 Helper", value: answer })
      .setTimestamp()
      .setFooter({ text: `${FOOTER_TEXT} | Command requested by: ${author.tag}`, iconURL: FOOTER_ICON });

    await reply(context, { embeds: [embed] });
  },
};

export default command;
