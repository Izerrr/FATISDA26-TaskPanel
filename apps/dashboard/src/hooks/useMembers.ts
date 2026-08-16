"use client";
import useSWR from "swr";

export interface Member {
  id: string;
  username: string;
  avatar: string | null;
  roles?: string[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMembers(guildId: string | null) {
  const { data, error, isLoading } = useSWR(
    guildId ? `/api/guilds/${guildId}/members` : null,
    fetcher
  );
  return {
    members: (data?.members as Member[]) || [],
    isLoading,
    isError: !!error,
  };
}
