"use client";

import useSWR from "swr";
import type { User } from "@/types";

interface MeResponse {
  user: User | null;
}

async function fetcher(url: string): Promise<MeResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Gagal memuat profil.");
  }

  return response.json();
}

export function useMe() {
  const { data, error, isLoading } = useSWR<MeResponse>("/api/me", fetcher);

  return {
    user: data?.user ?? null,
    isLoading,
    isError: Boolean(error),
  };
}
