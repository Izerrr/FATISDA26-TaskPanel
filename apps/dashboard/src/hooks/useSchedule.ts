"use client";

import { useEffect, useState } from "react";
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
  agama?: string;
}

export function useSchedule(options: UseScheduleOptions = {}) {
  const { user } = useRole();

  const [prefAgama, setPrefAgama] = useState<string>("islam");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("fatisda_agama_preference");
      if (saved) setPrefAgama(saved);

      const handleAgamaChange = () => {
        const updated = localStorage.getItem("fatisda_agama_preference");
        if (updated) setPrefAgama(updated);
      };

      window.addEventListener("fatisda_agama_change", handleAgamaChange);
      return () => window.removeEventListener("fatisda_agama_change", handleAgamaChange);
    } catch {
      // Ignore localStorage security exceptions
    }
  }, []);

  const prodi = options.prodi ?? user?.prodi;
  const kelas = options.kelas ?? user?.kelas;
  const semester = options.semester ?? user?.semester ?? 1;
  const agama = options.agama ?? prefAgama;

  const key =
    prodi && kelas && semester
      ? `/api/schedule?prodi=${encodeURIComponent(prodi)}&kelas=${encodeURIComponent(kelas)}&semester=${semester}&agama=${encodeURIComponent(agama)}`
      : null;

  const storageKey = key ? `fatisda_sched_cache_${key}` : null;
  const [cachedData, setCachedData] = useState<ScheduleResponse | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setCachedData(JSON.parse(raw) as ScheduleResponse);
      }
    } catch {
      // Ignore storage error
    }
  }, [storageKey]);

  const { data, error, isLoading, mutate } = useSWR<ScheduleResponse>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    keepPreviousData: true,
    onSuccess: (fresh) => {
      if (typeof window !== "undefined" && storageKey && fresh) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(fresh));
        } catch {
          // Ignore quota error
        }
      }
    },
  });

  const resolved = data ?? cachedData;

  return {
    schedules: resolved?.entries ?? resolved?.schedules ?? [],
    message: resolved?.message ?? null,
    isLoading: isLoading && !cachedData,
    isError: Boolean(error && !cachedData),
    isOfflineCache: Boolean(error && cachedData),
    mutate,
  };
}
