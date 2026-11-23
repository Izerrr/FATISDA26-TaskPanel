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

export function hasRoleMappingsConfigured(): boolean {
  return Boolean(
    getRoleId("DISCORD_ROLE_ADMIN") ||
      getRoleId("DISCORD_ROLE_KETUA_ANGKATAN") ||
      getRoleId("DISCORD_ROLE_PJ_KELAS") ||
      getRoleId("DISCORD_ROLE_PJ_MATKUL"),
  );
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
  const psdkuRoleId = getRoleId("DISCORD_ROLE_INFORMATIKA_PSDKU_KEBUMEN") || getRoleId("DISCORD_ROLE_PSDKU_KEBUMEN") || getRoleId("DISCORD_ROLE_PSDKU");
  if (hasRole(discordRoles, psdkuRoleId)) {
    return "INFORMATIKA_PSDKU_KEBUMEN";
  }

  const inforRoleId = getRoleId("DISCORD_ROLE_INFORMATIKA") || getRoleId("DISCORD_ROLE_INFOR") || getRoleId("DISCORD_ROLE_IF");
  if (hasRole(discordRoles, inforRoleId)) {
    return "INFORMATIKA";
  }

  const sainsDataRoleId = getRoleId("DISCORD_ROLE_SAINS_DATA") || getRoleId("DISCORD_ROLE_SAINSDATA") || getRoleId("DISCORD_ROLE_SD");
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

interface ExistingSyncUser {
  id: string;
  discordId: string | null;
  username: string;
  name: string | null;
  avatar: string | null;
  avatarSource: string | null;
  prodi: Prodi | null;
  kelas: Kelas | null;
}

const SYNC_USER_SELECT = {
  id: true,
  discordId: true,
  username: true,
  name: true,
  avatar: true,
  avatarSource: true,
  prodi: true,
  kelas: true,
} as const;

async function upsertSyncedMember(member: GuildMember, existingUser: ExistingSyncUser | null) {
  const discordRoles = member.roles.cache.map((r) => r.id);
  const isGuildOwner = member.guild.ownerId === member.user.id;
  const avatar = member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : null;
  const discordHandle = member.user.username;
  const defaultDisplayName = member.nickname ?? member.user.globalName ?? member.user.username;
  const nextProdi = mappedProdi(discordRoles);
  const nextKelas = mappedKelas(discordRoles);
  const shouldSyncRoles = hasRoleMappingsConfigured();
  const nextRoles = mappedRoles(discordRoles, isGuildOwner);

  if (existingUser) {
    const useDiscordAvatar = existingUser.avatarSource !== "google" || !existingUser.avatar;

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        discordId: member.user.id,
        discordUsername: discordHandle,
        discordAvatar: avatar,
        name: existingUser.name ?? defaultDisplayName,
        username: existingUser.username || discordHandle,
        avatar: useDiscordAvatar ? (avatar ?? existingUser.avatar) : existingUser.avatar,
        discordRoles,
        ...(shouldSyncRoles ? { roles: nextRoles as any } : {}),
        ...(nextProdi !== null ? { prodi: nextProdi as any } : {}),
        ...(nextKelas !== null ? { kelas: nextKelas as any } : {}),
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      id: member.user.id,
      discordId: member.user.id,
      discordUsername: discordHandle,
      discordAvatar: avatar,
      avatarSource: "discord",
      name: defaultDisplayName,
      username: discordHandle,
      avatar,
      discordRoles,
      roles: nextRoles as any,
      prodi: nextProdi as any,
      kelas: nextKelas as any,
    },
  });
}

export async function syncMemberToDatabase(member: GuildMember) {
  if (member.user.bot) return;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: member.user.id }, { discordId: member.user.id }],
      },
      select: SYNC_USER_SELECT,
    });

    await upsertSyncedMember(member, existingUser);
  } catch (error) {
    console.error(`[Sync] Gagal menyinkronkan member ${member.user.tag}:`, error);
  }
}

export async function syncAllGuildMembers(guild: Guild): Promise<number> {
  await syncGuildToDatabase(guild);

  const members = await guild.members.fetch();
  const nonBotMembers = Array.from(members.values()).filter((member) => !member.user.bot);
  if (nonBotMembers.length === 0) {
    return 0;
  }

  const memberIds = nonBotMembers.map((member) => member.user.id);
  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [{ id: { in: memberIds } }, { discordId: { in: memberIds } }],
    },
    select: SYNC_USER_SELECT,
  });

  const existingByDiscordId = new Map<string, ExistingSyncUser>();
  for (const user of existingUsers) {
    existingByDiscordId.set(user.id, user);
    if (user.discordId) {
      existingByDiscordId.set(user.discordId, user);
    }
  }

  const CHUNK_SIZE = 20;
  let count = 0;

  for (let i = 0; i < nonBotMembers.length; i += CHUNK_SIZE) {
    const chunk = nonBotMembers.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (member) => {
        try {
          await upsertSyncedMember(member, existingByDiscordId.get(member.user.id) ?? null);
          count++;
        } catch (error) {
          console.error(`[Sync] Gagal menyinkronkan member ${member.user.tag}:`, error);
        }
      }),
    );
  }

  return count;
}
