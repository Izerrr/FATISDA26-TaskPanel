import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types.js";
import { reply } from "../../lib/context.js";
import { BRAND_COLOR } from "../../lib/constants.js";

const command: Command = {
  name: "invite",
  description: "Mendapatkan tautan undangan resmi untuk bot ini",
  data: new SlashCommandBuilder().setName("invite").setDescription("Mendapatkan tautan undangan resmi untuk bot ini"),

  async run(client, context) {
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`;

    const embed = new EmbedBuilder().setTitle("🔗 Invite FATISDA26 Helper").setDescription(`Klik [Di Sini](${inviteLink}) untuk mengundang bot ini ke server kamu!`).setColor(BRAND_COLOR).setTimestamp();

    await reply(context, { embeds: [embed] });
  },
};

export default command;
