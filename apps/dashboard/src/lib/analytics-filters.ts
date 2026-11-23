import type { Prisma } from "@prisma/client";

/**
 * Matches only users who have actually accessed the TaskPanel web app
 * (excluding raw Discord guild members/bots synced purely for directory lookup).
 */
export const ACCESSED_USER_WHERE: Prisma.UserWhereInput = {
  OR: [
    { hasAccessedApp: true },
    { lastActiveAt: { not: null } },
    { lastLoginAt: { not: null } },
    { googleId: { not: null } },
    { email: { not: null } },
  ],
};

export interface DiscordUserLike {
  user?: {
    id: string;
    bot?: boolean;
  } | null;
}

export function partitionDiscordGuildMembers<T extends DiscordUserLike>(members: T[]): {
  humanMembers: T[];
  botIds: string[];
} {
  const humanMembers: T[] = [];
  const botIds: string[] = [];

  for (const member of members) {
    if (!member.user) continue;
    if (member.user.bot) {
      botIds.push(member.user.id);
    } else {
      humanMembers.push(member);
    }
  }

  return { humanMembers, botIds };
}
