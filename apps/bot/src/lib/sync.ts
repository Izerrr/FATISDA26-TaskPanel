import { Guild, GuildMember } from "discord.js";
import { prisma } from "./prisma.js";
import { Kelas, Prodi, TaskPanelRole } from "../types.js";

function getRoleId(envKey: string): string | null {
  const value = process.env[envKey];
  return value?.trim() ? value.trim() : null;
}

function hasRole(discordRoles: string[], targetRoleId: string | null): boolean {
  return Boolean(targetRoleId && discordRoles.includes(targetRoleId));
}

export function mappedRoles(discordRoles: string[], isGuildOwner: boolean): TaskPanelRole[] {
  const roles: TaskPanelRole[] = [];

  if (isGuildOwner) {
    roles.push("OWNER");
  }

  if (hasRole(discordRoles, getRoleId("DISCORD_ROLE_ADMIN"))) {
    roles.push("ADMIN");
  }

  if (hasRole(discordRoles, getRoleId("DISCORD_ROLE_KETUA_ANGKATAN"))) {
    roles.push("KETUA_ANGKATAN");
  }

  if (hasRole(discordRoles, getRoleId("DISCORD_ROLE_PJ_KELAS"))) {
    roles.push("PJ_KELAS");
  }

  if (hasRole(discordRoles, getRoleId("DISCORD_ROLE_PJ_MATKUL"))) {
    roles.push("PJ_MATKUL");
  }

  if (roles.length === 0) {
    roles.push("STUDENT");
  }

  return roles;
}

export function mappedProdi(discordRoles: string[]): Prodi | null {
  const psdkuRoleId =
    getRoleId("DISCORD_ROLE_INFORMATIKA_PSDKU_KEBUMEN") ||
    getRoleId("DISCORD_ROLE_PSDKU_KEBUMEN") ||
    getRoleId("DISCORD_ROLE_PSDKU");
  if (hasRole(discordRoles, psdkuRoleId)) {
    return "INFORMATIKA_PSDKU_KEBUMEN";
  }

  const inforRoleId =
    getRoleId("DISCORD_ROLE_INFORMATIKA") ||
    getRoleId("DISCORD_ROLE_INFOR") ||
    getRoleId("DISCORD_ROLE_IF");
  if (hasRole(discordRoles, inforRoleId)) {
    return "INFORMATIKA";
  }

  const sainsDataRoleId =
    getRoleId("DISCORD_ROLE_SAINS_DATA") ||
    getRoleId("DISCORD_ROLE_SAINSDATA") ||
    getRoleId("DISCORD_ROLE_SD");
  if (hasRole(discordRoles, sainsDataRoleId)) {
    return "SAINS_DATA";
  }

  return null;
}

export function mappedKelas(discordRoles: string[]): Kelas | null {
  const candidates: [Kelas, string[]][] = [
    ["A", ["DISCORD_ROLE_KELAS_A", "DISCORD_ROLE_A", "DISCORD_ROLE_INFORMATIKA_A", "DISCORD_ROLE_SAINS_DATA_A"]],
    ["B", ["DISCORD_ROLE_KELAS_B", "DISCORD_ROLE_B", "DISCORD_ROLE_INFORMATIKA_B", "DISCORD_ROLE_SAINS_DATA_B"]],
    ["C", ["DISCORD_ROLE_KELAS_C", "DISCORD_ROLE_C", "DISCORD_ROLE_INFORMATIKA_C", "DISCORD_ROLE_SAINS_DATA_C"]],
    ["D", ["DISCORD_ROLE_KELAS_D", "DISCORD_ROLE_D", "DISCORD_ROLE_INFORMATIKA_D", "DISCORD_ROLE_SAINS_DATA_D"]],
    ["E", ["DISCORD_ROLE_KELAS_E", "DISCORD_ROLE_E", "DISCORD_ROLE_INFORMATIKA_E", "DISCORD_ROLE_SAINS_DATA_E"]],
  ];

  for (const [kelas, envKeys] of candidates) {
    for (const key of envKeys) {
      if (hasRole(discordRoles, getRoleId(key))) {
        return kelas;
      }
    }
  }

  return null;
}

export async function syncGuildToDatabase(guild: Guild) {
  try {
    await prisma.guild.upsert({
      where: { id: guild.id },
      create: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
      },
      update: {
        name: guild.name,
        icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
      },
    });
  } catch (error) {
    console.error(`[Sync] Gagal menyinkronkan guild ${guild.id}:`, error);
  }
}

export async function syncMemberToDatabase(member: GuildMember) {
  if (member.user.bot) return;

  try {
    const discordRoles = member.roles.cache.map((r) => r.id);
    const isGuildOwner = member.guild.ownerId === member.user.id;
    const avatar = member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : null;

    await prisma.user.upsert({
      where: { id: member.user.id },
      create: {
        id: member.user.id,
        username: member.nickname ?? member.user.username,
        avatar,
        discordRoles,
        roles: mappedRoles(discordRoles, isGuildOwner) as any,
        prodi: mappedProdi(discordRoles) as any,
        kelas: mappedKelas(discordRoles) as any,
      },
      update: {
        username: member.nickname ?? member.user.username,
        avatar,
        discordRoles,
        roles: mappedRoles(discordRoles, isGuildOwner) as any,
        prodi: mappedProdi(discordRoles) as any,
        kelas: mappedKelas(discordRoles) as any,
      },
    });
  } catch (error) {
    console.error(`[Sync] Gagal menyinkronkan member ${member.user.tag}:`, error);
  }
}

export async function syncAllGuildMembers(guild: Guild): Promise<number> {
  await syncGuildToDatabase(guild);

  const members = await guild.members.fetch();
  let count = 0;

  for (const [, member] of members) {
    if (!member.user.bot) {
      await syncMemberToDatabase(member);
      count++;
    }
  }

  return count;
}
