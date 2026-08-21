import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
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
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
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

        token.discordId = discordId;
        token.username = username;
        token.avatar = avatar;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        /*
         * Pastikan user memang berada di
         * server FATISDA yang dikonfigurasi.
         */
        const accessToken = account.access_token;

        const guildId = process.env.DISCORD_GUILD_ID;

        if (!guildId) {
          throw new Error("DISCORD_GUILD_ID belum dikonfigurasi.");
        }

        if (accessToken) {
          const guilds = await fetchUserGuilds(accessToken);

          const isFatisdaMember = guilds.some((guild) => guild.id === guildId);

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

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.discordId ?? "";

        session.user.name = token.username ?? null;

        session.user.image = token.avatar ?? null;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
