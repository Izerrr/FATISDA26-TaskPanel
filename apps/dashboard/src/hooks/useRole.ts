"use client";
import { useSession } from "next-auth/react";
import { useGuild } from "@/components/providers/GuildProvider";
import { useGuilds } from "./useGuilds";

export type Role = "admin" | "moderator" | "member";

export function useRole() {
  const { data: session } = useSession();
  const { selectedGuild } = useGuild();
  const { guilds } = useGuilds();

  if (!session?.user?.id || !selectedGuild) {
    return { role: "member" as Role, isAdmin: false, isModerator: false, isMember: true };
  }

  const guild = guilds.find((g) => g.id === selectedGuild);
  if (!guild) {
    return { role: "member" as Role, isAdmin: false, isModerator: false, isMember: true };
  }

  if (guild.owner) {
    return { role: "admin" as Role, isAdmin: true, isModerator: true, isMember: true };
  }

  const perms = parseInt(guild.permissions);
  const isAdmin = (perms & 0x8) === 0x8;
  const isMod = (perms & 0x20) === 0x20;

  if (isAdmin) return { role: "admin" as Role, isAdmin: true, isModerator: true, isMember: true };
  if (isMod) return { role: "moderator" as Role, isAdmin: false, isModerator: true, isMember: true };

  return { role: "member" as Role, isAdmin: false, isModerator: false, isMember: true };
}
