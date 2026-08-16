"use client";
import useSWR from "swr";

export interface Task {
  id: string;
  guildId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  assignedTo: string | null;
  assignee: { id: string; username: string; avatar: string | null } | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTasks(guildId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    guildId ? `/api/tasks?guildId=${guildId}` : null,
    fetcher,
    { refreshInterval: 8000, revalidateOnFocus: true }
  );
  return {
    tasks: (data?.tasks as Task[]) || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
