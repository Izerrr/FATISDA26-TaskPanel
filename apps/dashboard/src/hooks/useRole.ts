"use client";

import useSWR from "swr";
import type { User, Role } from "@/types";

async function fetcher(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Gagal mengambil user");
  }

  return response.json();
}

export function useRole() {
  const { data, error, isLoading, mutate } = useSWR<{ user: User }>("/api/me", fetcher);

  const user = data?.user ?? null;
  const hasLinkedDiscord = Boolean(user?.discordId);
  const isGoogle = (user?.provider === "google" || Boolean(user?.id?.startsWith("google_"))) && !hasLinkedDiscord;
  const roles: Role[] = user?.roles && user.roles.length > 0 ? (user.roles as Role[]) : ["STUDENT"];

  const isAdmin = roles.includes("ADMIN") || roles.includes("OWNER");
  const isPJKelas = roles.includes("PJ_KELAS");
  const isPJMatkul = roles.includes("PJ_MATKUL");
  const isKetuaAngkatan = roles.includes("KETUA_ANGKATAN");
  const canManageVault = roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r));
  const canAccessAnalytics = roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN"].includes(r));

  return {
    role: roles[0],
    roles,
    isGoogle,
    isAdmin,
    isPJKelas,
    isPJMatkul,
    isKetuaAngkatan,
    isStudent: true,
    canCreateClassTask: canManageVault,
    canManageVault,
    canAccessAnalytics,
    user,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
