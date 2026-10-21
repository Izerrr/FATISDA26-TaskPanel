"use client";

import useSWR from "swr";
import type { DiscordGuild } from "@/types";

interface GuildResponse {
  guilds: DiscordGuild[];
}

async function fetcher(url: string): Promise<GuildResponse> {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return { guilds: [] };
    }

    return await response.json();
  } catch {
    return { guilds: [] };
  }
}

export function useGuilds() {
  const { data, error, isLoading, mutate } = useSWR<GuildResponse>("/api/guilds", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    keepPreviousData: true,
  });

  return {
    guilds: data?.guilds ?? [],
    isLoading: isLoading && !data,
    isError: Boolean(error && !data),
    error,
    mutate,
  };
}
