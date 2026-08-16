import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

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

        const username = (profile as { username?: string }).username ?? "pengguna";

        const avatar = (profile as { image_url?: string; avatar?: string }).image_url ?? (profile as { avatar?: string }).avatar ?? null;

        token.discordId = discordId;
        token.username = username;
        token.avatar = avatar;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        await prisma.user.upsert({
          where: {
            id: discordId,
          },
          create: {
            id: discordId,
            username,
            avatar,
            roles: ["STUDENT"],
            discordRoles: [],
          },
          update: {
            username,
            avatar,
          },
        });
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
