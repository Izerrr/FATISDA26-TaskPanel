"use client";

import useSWR from "swr";
import type { Schedule } from "@/types";
import { useRole } from "@/hooks/useRole";

interface ScheduleResponse {
  entries?: Schedule[];
  schedules?: Schedule[];
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
  const { user } = useRole();

  const prodi = user?.prodi;
  const kelas = user?.kelas;
  const semester = user?.semester;

  const key = prodi && kelas && semester ? `/api/schedule?prodi=${encodeURIComponent(prodi)}&kelas=${encodeURIComponent(kelas)}&semester=${semester}` : null;

  const { data, error, isLoading, mutate } = useSWR<ScheduleResponse>(key, fetcher);

  return {
    schedules: data?.entries ?? data?.schedules ?? [],
    message: data?.message ?? null,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
