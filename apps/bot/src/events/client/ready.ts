import { ExtendedClient } from "../../types.js";
import { syncAllGuildMembers, syncGuildToDatabase } from "../../lib/sync.js";

export const name = "ready";
export const once = true;

export const execute = async (client: ExtendedClient) => {
  console.log(`🤖 Bot online! Logged in as ${client.user?.tag}`);

  try {
    const targetGuildId = process.env.DISCORD_GUILD_ID;
    const guild = targetGuildId
      ? client.guilds.cache.get(targetGuildId) ?? (await client.guilds.fetch(targetGuildId).catch(() => null))
      : client.guilds.cache.first();

    if (guild) {
      console.log(`🔄 Menyinkronkan database dengan server: ${guild.name}...`);
      await syncGuildToDatabase(guild);
      const syncedCount = await syncAllGuildMembers(guild);
      console.log(`✅ Sukses menyinkronkan ${syncedCount} anggota server ke database TaskPanel.`);
    }
  } catch (error) {
    console.error("[Ready Sync Error]", error);
  }
};
