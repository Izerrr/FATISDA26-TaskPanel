import { prisma } from "@/lib/prisma";

export interface DiscordMember {
  user: {
    id: string;
    username: string;
    avatar: string | null;
    discriminator?: string;
  };
  nick: string | null;
  roles: string[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export async function fetchGuildMembers(
  guildId: string
): Promise<DiscordMember[]> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return [];

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "[Discord] fetchGuildMembers",
        response.status,
        await response.text()
      );
      return [];
    }

    return (await response.json()) as DiscordMember[];
  } catch (error) {
    console.error("[Discord] fetchGuildMembers", error);
    return [];
  }
}

export async function fetchUserGuilds(
  accessToken: string
): Promise<DiscordGuild[]> {
  try {
    const response = await fetch(
      "https://discord.com/api/v10/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "[Discord] fetchUserGuilds",
        response.status,
        await response.text()
      );
      return [];
    }

    return (await response.json()) as DiscordGuild[];
  } catch (error) {
    console.error("[Discord] fetchUserGuilds", error);
    return [];
  }
}

function roleId(name: string): string | null {
  const value = process.env[name];
  return value?.trim() ? value.trim() : null;
}

function hasRole(roles: string[], target: string | null) {
  return Boolean(target && roles.includes(target));
}

function mappedRoles(discordRoles: string[]) {
  const roles: Array<
    "STUDENT" | "PJ_KELAS" | "PJ_MATKUL" | "ADMIN"
  > = [];

  if (hasRole(discordRoles, roleId("DISCORD_ROLE_ADMIN"))) {
    roles.push("ADMIN");
  }

  if (hasRole(discordRoles, roleId("DISCORD_ROLE_PJ_KELAS"))) {
    roles.push("PJ_KELAS");
  }

  if (hasRole(discordRoles, roleId("DISCORD_ROLE_PJ_MATKUL"))) {
    roles.push("PJ_MATKUL");
  }

  if (roles.length === 0) roles.push("STUDENT");

  return roles;
}

function mappedProdi(discordRoles: string[]) {
  if (hasRole(discordRoles, roleId("DISCORD_ROLE_INFORMATIKA"))) {
    return "INFORMATIKA" as const;
  }

  if (hasRole(discordRoles, roleId("DISCORD_ROLE_SAINS_DATA"))) {
    return "SAINS_DATA" as const;
  }

  return null;
}

function mappedKelas(discordRoles: string[]) {
  const candidates = [
    ["A", "DISCORD_ROLE_KELAS_A"],
    ["B", "DISCORD_ROLE_KELAS_B"],
    ["C", "DISCORD_ROLE_KELAS_C"],
    ["D", "DISCORD_ROLE_KELAS_D"],
    ["E", "DISCORD_ROLE_KELAS_E"],
  ] as const;

  for (const [kelas, envKey] of candidates) {
    if (hasRole(discordRoles, roleId(envKey))) {
      return kelas;
    }
  }

  return null;
}

export async function syncGuildMembers(
  guildId: string
): Promise<DiscordMember[]> {
  const members = await fetchGuildMembers(guildId);

  for (const member of members) {
    const discordRoles = member.roles ?? [];
    const avatar = member.user.avatar
      ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
      : null;

    await prisma.user.upsert({
      where: { id: member.user.id },
      create: {
        id: member.user.id,
        username: member.nick ?? member.user.username,
        avatar,
        discordRoles,
        roles: mappedRoles(discordRoles),
        prodi: mappedProdi(discordRoles),
        kelas: mappedKelas(discordRoles),
      },
      update: {
        username: member.nick ?? member.user.username,
        avatar,
        discordRoles,
        roles: mappedRoles(discordRoles),
        prodi: mappedProdi(discordRoles),
        kelas: mappedKelas(discordRoles),
      },
    });
  }

  return members;
}

export async function sendDiscordNotification(
  _guildId: string,
  content: string
) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "FATISDA Task",
        avatar_url:
          "https://cdn.discordapp.com/embed/avatars/0.png",
        embeds: [
          {
            title: "📋 Panel Tugas",
            description: content,
            color: 0x0077b6,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        "[Discord Webhook]",
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.error("[Discord Webhook]", error);
  }
}
