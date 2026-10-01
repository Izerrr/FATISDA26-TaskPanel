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
  const isGoogle = user?.provider === "google" || Boolean(user?.id?.startsWith("google_"));
  const roles: Role[] = isGoogle ? ["STUDENT"] : (user?.roles ?? ["STUDENT"]);

  return {
    role: roles[0],
    roles,
    isGoogle,
    isAdmin: !isGoogle && roles.includes("ADMIN"),
    isPJKelas: !isGoogle && roles.includes("PJ_KELAS"),
    isPJMatkul: !isGoogle && roles.includes("PJ_MATKUL"),
    isStudent: true,
    canCreateClassTask: !isGoogle && roles.some((r) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(r)),
    user,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
