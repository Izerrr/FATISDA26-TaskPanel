"use client";

import useSWR from "swr";
import type { DiscordGuild } from "@/types";

interface GuildResponse {
  guilds: DiscordGuild[];
}

async function fetcher(url: string): Promise<GuildResponse> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal memuat server Discord.");
  }

  return response.json();
}

export function useGuilds() {
  const { data, error, isLoading, mutate } = useSWR<GuildResponse>("/api/guilds", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    guilds: data?.guilds ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}
