import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { fetchUserGuilds, syncCurrentUser } from "./discord";
import { verifyLinkIntent } from "./link-token";

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
        // Cek apakah ada cryptographically signed linking intent aktif
        let linkUserId: string | null = null;
        try {
          const { cookies } = await import("next/headers");
          const signedIntent = cookies().get("fatisda_link_intent")?.value;
          if (signedIntent) {
            const secret = process.env.NEXTAUTH_SECRET || "fatisda_default_auth_secret";
            linkUserId = verifyLinkIntent(signedIntent, secret);
          }
        } catch {
          linkUserId = null;
        }

        if (account.provider === "google") {
          const googleAccountId = account.providerAccountId;
          const email = ((profile as { email?: string }).email ?? "").toLowerCase();
          const nim = email.split("@")[0].toUpperCase();
          const username = (profile as { name?: string }).name ?? nim;
          const avatar = (profile as { picture?: string }).picture ?? null;

          // 1. Cek apakah ada target user dari linking cookie
          let targetUser: any = null;
          if (linkUserId) {
            targetUser = await (prisma.user as any).findUnique({
              where: { id: linkUserId },
            });
          }

          // 2. Jika tidak ada linking cookie, cari apakah user ini sudah pernah ditautkan
          if (!targetUser) {
            targetUser = await (prisma.user as any).findFirst({
              where: {
                OR: [
                  { googleId: googleAccountId },
                  { email: email },
                  { id: `google_${googleAccountId}` },
                ],
              },
            });
          }

          if (targetUser) {
            // Tautkan Google ID & Email ke user yang ditemukan
            const tempGoogleId = `google_${googleAccountId}`;
            if (tempGoogleId !== targetUser.id) {
              try {
                // Migrasikan tugas yang mungkin pernah dibuat dengan temp Google ID
                await prisma.task.updateMany({
                  where: { createdById: tempGoogleId },
                  data: { createdById: targetUser.id },
                });
                await prisma.task.updateMany({
                  where: { assignedTo: tempGoogleId },
                  data: { assignedTo: targetUser.id },
                });
                await (prisma.user as any).deleteMany({
                  where: { id: tempGoogleId },
                });
              } catch (migrateErr) {
                console.warn("[NextAuth] Gagal migrasi tugas temp google user:", migrateErr);
              }
            }

            const updatedUser = await (prisma.user as any).update({
              where: { id: targetUser.id },
              data: {
                googleId: googleAccountId,
                email,
                nim,
                avatar: targetUser.avatar ?? avatar,
                hasAccessedApp: true,
                lastLoginAt: new Date(),
                lastActiveAt: new Date(),
              },
            });

            token.userId = updatedUser.id;
            token.discordId = updatedUser.discordId ?? updatedUser.id;
            token.provider = updatedUser.discordId ? "discord" : "google";
            token.email = email;
            token.nim = nim;
            token.username = updatedUser.username;
            token.avatar = updatedUser.avatar;
            token.roles = updatedUser.roles;
            token.prodi = updatedUser.prodi;
            token.kelas = updatedUser.kelas;
          } else {
            // Akun Google baru murni
            const googleId = `google_${googleAccountId}`;
            await (prisma.user as any).create({
              data: {
                id: googleId,
                provider: "google",
                googleId: googleAccountId,
                email,
                nim,
                username,
                avatar,
                roles: ["STUDENT"],
                discordRoles: [],
                hasAccessedApp: true,
                lastLoginAt: new Date(),
                lastActiveAt: new Date(),
              },
            });

            token.userId = googleId;
            token.discordId = googleId;
            token.provider = "google";
            token.email = email;
            token.nim = nim;
            token.username = username;
            token.avatar = avatar;
            token.roles = ["STUDENT"];
            token.prodi = null;
            token.kelas = null;
          }

          try {
            const { cookies } = await import("next/headers");
            cookies().delete("fatisda_link_intent");
            cookies().delete("fatisda_link_user_id");
          } catch {}
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

          // Cek apakah ada linking cookie dari user google yang sedang aktif
          let targetUser: any = null;
          if (linkUserId && linkUserId !== discordId) {
            targetUser = await (prisma.user as any).findUnique({
              where: { id: linkUserId },
            });
          }

          if (targetUser && targetUser.id.startsWith("google_")) {
            // Gabungkan user Google ke Discord (akun Discord jadi id utama)
            try {
              const { googleId, email, nim } = targetUser;

              await prisma.task.updateMany({
                where: { createdById: targetUser.id },
                data: { createdById: discordId },
              });
              await prisma.task.updateMany({
                where: { assignedTo: targetUser.id },
                data: { assignedTo: discordId },
              });

              await (prisma.user as any).update({
                where: { id: discordId },
                data: {
                  discordId,
                  googleId: googleId ?? undefined,
                  email: email ?? undefined,
                  nim: nim ?? undefined,
                  hasAccessedApp: true,
                  lastLoginAt: new Date(),
                  lastActiveAt: new Date(),
                },
              });

              await (prisma.user as any).delete({
                where: { id: targetUser.id },
              });
            } catch (mergeErr) {
              console.warn("[NextAuth] Gagal merge google user ke discord:", mergeErr);
            }
          } else {
            await (prisma.user as any).update({
              where: { id: discordId },
              data: {
                discordId,
                hasAccessedApp: true,
                lastLoginAt: new Date(),
                lastActiveAt: new Date(),
              },
            });
          }

          /*
           * Ambil data terbaru setelah sync supaya
           * JWT memiliki informasi role terbaru.
           */
          const user = await (prisma.user as any).findUnique({
            where: {
              id: discordId,
            },
          });

          token.roles = user?.roles ?? ["STUDENT"];
          token.prodi = user?.prodi ?? null;
          token.kelas = user?.kelas ?? null;
          token.email = user?.email ?? null;
          token.nim = user?.nim ?? null;

          try {
            const { cookies } = await import("next/headers");
            cookies().delete("fatisda_link_intent");
            cookies().delete("fatisda_link_user_id");
          } catch {}
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
