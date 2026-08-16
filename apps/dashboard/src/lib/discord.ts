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

export async function fetchGuildMembers(guildId: string): Promise<DiscordMember[]> {
  const res = await fetch(`https://discord.com/api/guilds/${guildId}/members?limit=1000`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
  });
  if (!res.ok) return [];
  return (await res.json()) as DiscordMember[];
}

export async function fetchUserGuilds(accessToken: string) {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function sendDiscordNotification(guildId: string, content: string) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "FATISDA Task",
        avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
        embeds: [{
          title: "📋 Panel Tugas",
          description: content,
          color: 0x0077B6,
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (e) {
    console.error("[Webhook] Gagal:", e);
  }
}
