import { GuildMember } from "discord.js";
import { syncMemberToDatabase } from "../../lib/sync.js";

export const name = "guildMemberUpdate";

export const execute = async (_oldMember: GuildMember, newMember: GuildMember) => {
  await syncMemberToDatabase(newMember);
};
