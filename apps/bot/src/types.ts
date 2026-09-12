import {
  Client,
  Collection,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
  Message,
} from "discord.js";

/**
 * Every command in this bot is hybrid: it responds to both a slash
 * interaction (`/ban @user`) and a prefix message (`a!ban @user`).
 * `run()` is the single source of truth — interactionCreate and
 * messageCreate both call into it, branching internally on `isSlash()`
 * (see src/lib/context.ts) instead of each command needing two
 * separate implementations.
 */
export type CommandContext = ChatInputCommandInteraction | Message;

export interface Command {
  // SlashCommandBuilder narrows to one of these once you call
  // .addStringOption()/.addUserOption()/etc — the union covers all of them.
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  name: string;
  description: string;
  category?: string;
  aliases?: string[];
  run: (client: ExtendedClient, context: CommandContext, args: string[]) => Promise<unknown>;
}

export class ExtendedClient extends Client {
  commands: Collection<string, Command> = new Collection();
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE";
export type TaskScope = "PERSONAL" | "CLASS";
export type Kelas = "A" | "B" | "C" | "D" | "E";
export type Prodi = "INFORMATIKA" | "SAINS_DATA" | "INFORMATIKA_PSDKU_KEBUMEN";
