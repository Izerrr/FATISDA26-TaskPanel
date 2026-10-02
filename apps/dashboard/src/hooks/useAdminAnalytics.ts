"use client";

import useSWR from "swr";
import type { AnalyticsData } from "@/types";

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Gagal memuat data analytics");
  }
  return res.json();
}

export function useAdminAnalytics() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ analytics: AnalyticsData }>(
    "/api/admin/analytics",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // auto-refresh setiap 1 menit
    }
  );

  return {
    analytics: data?.analytics ?? null,
    isLoading,
    isValidating,
    isError: Boolean(error),
    errorMessage: error?.message,
    mutate,
  };
}
