import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds email" } },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.discordId = account.providerAccountId;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.username = (profile as any).username ?? "pengguna";
        token.avatar = (profile as any).image_url ?? (profile as any).avatar ?? null;
        try {
          await prisma.user.upsert({
            where: { id: account.providerAccountId },
            create: {
              id: account.providerAccountId,
              username: (profile as any).username ?? "pengguna",
              avatar: (profile as any).image_url ?? (profile as any).avatar ?? null,
            },
            update: {
              username: (profile as any).username ?? "pengguna",
              avatar: (profile as any).image_url ?? (profile as any).avatar ?? null,
            },
          });
        } catch (err) {
          console.error("[Auth] Gagal menyimpan user:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.discordId as string;
        session.user.name = token.username as string;
        session.user.image = token.avatar as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
