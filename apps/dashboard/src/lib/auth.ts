import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { fetchUserGuilds, syncCurrentUser } from "./discord";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds email",
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 jam (daily reset jika tidak ada aktivitas)
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = (profile as { email?: string })?.email?.toLowerCase();
        if (!email || !email.endsWith("@student.uns.ac.id")) {
          return "/login?error=invalid_domain";
        }
      }
      return true;
    },

    async jwt({ token, account, profile }) {
      if (account && profile) {
        if (account.provider === "google") {
          const googleAccountId = account.providerAccountId;
          const googleId = `google_${googleAccountId}`;
          const email = ((profile as { email?: string }).email ?? "").toLowerCase();
          const nim = email.split("@")[0].toUpperCase();
          const username = (profile as { name?: string }).name ?? nim;
          const avatar = (profile as { picture?: string }).picture ?? null;

          token.provider = "google";
          token.userId = googleId;
          token.discordId = googleId;
          token.email = email;
          token.nim = nim;
          token.username = username;
          token.avatar = avatar;
          token.roles = ["STUDENT"];

          // Upsert Google student ke database
          await prisma.user.upsert({
            where: {
              id: googleId,
            },
            create: {
              id: googleId,
              provider: "google",
              email,
              nim,
              username,
              avatar,
              roles: ["STUDENT"],
              discordRoles: [],
            },
            update: {
              username,
              avatar,
              email,
              nim,
            },
          });

          // Ambil prodi, kelas, semester jika sudah pernah diset
          const user = await prisma.user.findUnique({
            where: {
              id: googleId,
            },
            select: {
              roles: true,
              prodi: true,
              kelas: true,
              semester: true,
            },
          });

          token.roles = ["STUDENT"];
          token.prodi = user?.prodi ?? null;
          token.kelas = user?.kelas ?? null;
        } else {
          // Discord provider
          const discordId = account.providerAccountId;

          const username =
            (
              profile as {
                username?: string;
              }
            ).username ?? "pengguna";

          const avatar =
            (
              profile as {
                image_url?: string;
                avatar?: string;
              }
            ).image_url ??
            (
              profile as {
                avatar?: string;
              }
            ).avatar ??
            null;

          token.provider = "discord";
          token.userId = discordId;
          token.discordId = discordId;
          token.username = username;
          token.avatar = avatar;
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 604800 * 1000;

          /*
           * Pastikan user memang berada di
           * salah satu server FATISDA yang didukung.
           */
          const accessToken = account.access_token;

          const candidateGuildIds = Array.from(new Set([process.env.DISCORD_GUILD_ID, "1547427568599302287", "1509522755928985622", "882584293409456139"].filter(Boolean) as string[]));

          if (accessToken) {
            const guilds = await fetchUserGuilds(accessToken);

            const isFatisdaMember = guilds.some((guild) => candidateGuildIds.includes(guild.id));

            if (!isFatisdaMember) {
              throw new Error("Akun Discord kamu belum menjadi anggota server FATISDA 2026.");
            }
          }

          /*
           * Sync role, prodi, kelas, dan Discord
           * roles ke database.
           */
          await syncCurrentUser(discordId);

          /*
           * Ambil data terbaru setelah sync supaya
           * JWT memiliki informasi role terbaru.
           */
          const user = await prisma.user.findUnique({
            where: {
              id: discordId,
            },
            select: {
              roles: true,
              prodi: true,
              kelas: true,
            },
          });

          token.roles = user?.roles ?? ["STUDENT"];
          token.prodi = user?.prodi ?? null;
          token.kelas = user?.kelas ?? null;
        }
      }

      // Refresh Discord OAuth2 token jika telah kedaluwarsa (hanya jika provider discord)
      if (token.provider === "discord" && typeof token.accessTokenExpires === "number" && Date.now() > token.accessTokenExpires && token.refreshToken) {
        try {
          const response = await fetch("https://discord.com/api/v10/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.DISCORD_CLIENT_ID!,
              client_secret: process.env.DISCORD_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });

          const refreshed = await response.json();
          if (response.ok && refreshed.access_token) {
            token.accessToken = refreshed.access_token;
            token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
            token.accessTokenExpires = Date.now() + (refreshed.expires_in ?? 604800) * 1000;
          }
        } catch (err) {
          console.error("[NextAuth] Failed to refresh Discord access token", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId ?? token.discordId ?? "") as string;
        session.user.name = token.username ?? null;
        session.user.image = token.avatar ?? null;
        session.user.provider = token.provider ?? "discord";
        session.user.email = token.email ?? session.user.email;
        session.user.nim = token.nim ?? null;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
