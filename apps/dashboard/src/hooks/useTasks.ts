"use client";

import useSWR from "swr";
import type { Task } from "@/types";

interface TaskResponse {
  tasks: Task[];
}

async function fetcher(url: string): Promise<TaskResponse> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal memuat tugas.");
  }

  return response.json();
}

export function useTasks(guildId?: string | null) {
  const url = guildId ? `/api/tasks?guildId=${encodeURIComponent(guildId)}` : "/api/tasks";

  const { data, error, isLoading, mutate } = useSWR<TaskResponse>(url, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000,
  });

  return {
    tasks: data?.tasks ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}
