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

interface UseScheduleOptions {
  semester?: number;
  prodi?: string;
  kelas?: string;
}

export function useSchedule(options: UseScheduleOptions = {}) {
  const { user } = useRole();

  const prodi = options.prodi ?? user?.prodi;
  const kelas = options.kelas ?? user?.kelas;
  const semester = options.semester ?? user?.semester ?? 2;

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
