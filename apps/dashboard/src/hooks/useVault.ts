"use client";

import useSWR from "swr";

export interface VaultResourceLink {
  id: string;
  title: string;
  url: string;
  type: "DRIVE" | "MODULE" | "SYLLABUS" | "COMMUNITY" | "OTHER";
  description?: string;
}

export interface VaultData {
  id?: string;
  courseId?: string | null;
  courseName: string;
  prodi: string;
  kelas?: string | null;
  semester?: number | null;
  driveUrl?: string | null;
  modulUrl?: string | null;
  silabusUrl?: string | null;
  communityUrl?: string | null;
  notes?: string | null;
  extraLinks?: VaultResourceLink[];
  updatedAt?: string;
  updatedBy?: { id: string; username: string; avatar?: string | null };
}

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal mengambil data vault");
  }
  return res.json();
}

export function useVault(courseName?: string, courseId?: string) {
  const params = new URLSearchParams();
  if (courseName) params.set("courseName", courseName);
  if (courseId) params.set("courseId", courseId);

  const key = `/api/vault${params.toString() ? `?${params.toString()}` : ""}`;
  const { data, error, isLoading, mutate } = useSWR<{ vaults: VaultData[] }>(key, fetcher);

  return {
    vaults: data?.vaults ?? [],
    vault: data?.vaults?.[0] ?? null,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
