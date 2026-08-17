"use client";

import useSWR from "swr";
import type { Schedule } from "@/types";

interface ScheduleResponse {
  schedules: Schedule[];
  message?: string;
}

async function fetcher(url: string): Promise<ScheduleResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Gagal memuat jadwal");
  }

  return response.json();
}

export function useSchedule() {
  const { data, error, isLoading, mutate } = useSWR<ScheduleResponse>("/api/schedule", fetcher);

  return {
    schedules: data?.schedules ?? [],
    message: data?.message ?? null,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
