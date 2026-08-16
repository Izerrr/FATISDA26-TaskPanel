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
  const { data, error, isLoading } = useSWR<{ user: User }>("/api/me", fetcher);

  const roles = data?.user.roles ?? ["STUDENT"];

  return {
    role: roles[0] as Role,
    roles,
    isAdmin: roles.includes("ADMIN"),
    isPJKelas: roles.includes("PJ_KELAS"),
    isPJMatkul: roles.includes("PJ_MATKUL"),
    isStudent: roles.includes("STUDENT"),
    user: data?.user ?? null,
    isLoading,
    isError: Boolean(error),
  };
}
