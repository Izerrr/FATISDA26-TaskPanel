import type {
  ChatInputCommandInteraction,
  Message,
  User,
  TextBasedChannel,
  BaseMessageOptions,
} from "discord.js";
import type { CommandContext } from "../types.js";

/** Narrows a hybrid CommandContext down to the slash-interaction branch. */
export function isSlash(context: CommandContext): context is ChatInputCommandInteraction {
  return typeof (context as ChatInputCommandInteraction).isChatInputCommand === "function"
    ? (context as ChatInputCommandInteraction).isChatInputCommand()
    : false;
}

/** The user who triggered the command, regardless of slash vs prefix. */
export function getAuthor(context: CommandContext): User {
  return isSlash(context) ? context.user : context.author;
}

/** The channel the command was triggered in. */
export function getChannel(context: CommandContext): TextBasedChannel | null {
  return context.channel;
}

/**
 * Sends a reply through whichever channel the command came from:
 * `interaction.reply()` for slash, `message.channel.send()` for prefix.
 * `ephemeral` is silently ignored on the prefix path since DMs-only
 * replies don't have a prefix-command equivalent.
 */
export async function reply(
  context: CommandContext,
  payload: BaseMessageOptions & { content?: string; ephemeral?: boolean }
) {
  if (isSlash(context)) {
    if (context.deferred) {
      const { ephemeral: _ephemeral, ...editPayload } = payload;
      return context.editReply(editPayload);
    }
    if (context.replied) {
      return context.followUp(payload);
    }
    return context.reply(payload);
  }
  const { ephemeral: _ephemeral, ...messagePayload } = payload;
  if (context.channel?.isSendable()) {
    return context.channel.send(messagePayload);
  }
  return undefined;
}

/**
 * Safely sends to a TextBasedChannel, narrowing out the rare channel
 * types (like PartialGroupDMChannel) that don't support .send().
 * Used by commands that need to send outside the reply() flow —
 * e.g. after a deferReply(), or when posting to a different channel.
 */
export async function sendChannel(
  channel: CommandContext["channel"] | null | undefined,
  payload: BaseMessageOptions & { content?: string }
) {
  if (channel?.isSendable()) {
    return channel.send(payload);
  }
  return undefined;
}

/** Reads a string option on slash, or the raw arg tokens on prefix. */
export function getStringArg(
  context: CommandContext,
  args: string[],
  optionName: string,
  fromIndex = 0
): string | null {
  if (isSlash(context)) {
    return context.options.getString(optionName);
  }
  const value = args.slice(fromIndex).join(" ").trim();
  return value.length > 0 ? value : null;
}
