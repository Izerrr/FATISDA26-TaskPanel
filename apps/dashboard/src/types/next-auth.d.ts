import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      provider?: "discord" | "google";
      name?: string | null;
      email?: string | null;
      nim?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    discordId?: string;
    provider?: "discord" | "google";
    email?: string | null;
    nim?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    username?: string;
    avatar?: string | null;
    roles?: string[];
    prodi?: string | null;
    kelas?: string | null;
  }
}
