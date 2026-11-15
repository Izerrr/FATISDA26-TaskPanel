"use client";

import useSWR from "swr";

export interface VaultSuggestionItem {
  id: string;
  courseId: string | null;
  courseName: string;
  prodi: string;
  kelas: string | null;
  title: string;
  url: string;
  type: "DRIVE" | "MODUL" | "SILABUS" | "OTHER" | string;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  reviewNote: string | null;
  authorId: string;
  author?: {
    id: string;
    name?: string | null;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
  reviewedAt: string | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { suggestions: [] };
  return res.json();
};

export function useVaultSuggestions(courseName?: string | null, status?: "PENDING" | "APPROVED" | "REJECTED") {
  const params = new URLSearchParams();
  if (courseName) params.set("courseName", courseName);
  if (status) params.set("status", status);
  const query = params.toString();
  const key = query ? `/api/vault/suggestions?${query}` : "/api/vault/suggestions";

  const { data, error, isLoading, mutate } = useSWR<{ suggestions: VaultSuggestionItem[] }>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  return {
    suggestions: data?.suggestions ?? [],
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
