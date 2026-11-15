const MENTION_PATTERN = "@([a-zA-Z0-9_.-]{2,32})";

export interface MentionSegment {
  text: string;
  isMention: boolean;
}

/**
 * Extracts unique mentioned usernames (lowercase, without '@') from text.
 */
export function extractMentionUsernames(text: string): string[] {
  if (!text) return [];
  const regex = new RegExp(MENTION_PATTERN, "g");
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const cleaned = match[1].replace(/\.+$/, "").toLowerCase();
    if (cleaned.length >= 2) {
      seen.add(cleaned);
    }
  }
  return Array.from(seen);
}

/**
 * Splits text into plain text segments and @mention tokens for safe UI rendering.
 */
export function splitTextWithMentions(text: string): MentionSegment[] {
  if (!text) return [];
  const regex = new RegExp(MENTION_PATTERN, "g");
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const full = match[0];
    const start = match.index;
    const trimmed = full.replace(/\.+$/, "");

    if (start > lastIndex) {
      segments.push({ text: text.slice(lastIndex, start), isMention: false });
    }
    if (trimmed.length > 2) {
      segments.push({ text: trimmed, isMention: true });
      const trailingDots = full.slice(trimmed.length);
      if (trailingDots) {
        segments.push({ text: trailingDots, isMention: false });
      }
    } else {
      segments.push({ text: full, isMention: false });
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isMention: false });
  }

  return segments.length > 0 ? segments : [{ text, isMention: false }];
}
