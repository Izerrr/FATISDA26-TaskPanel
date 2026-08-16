"use client";
import useSWR from "swr";

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useGuilds() {
  const { data, error, isLoading } = useSWR("/api/guilds", fetcher);
  return {
    guilds: (data?.guilds as Guild[]) || [],
    isLoading,
    isError: !!error,
  };
}
