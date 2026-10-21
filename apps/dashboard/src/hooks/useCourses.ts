"use client";

import useSWR from "swr";

import type { Course } from "@/types";

interface CoursesResponse {
  courses: Course[];
}

const fetcher = async (url: string): Promise<CoursesResponse> => {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal memuat mata kuliah.");
  }

  return response.json();
};

export function useCourses(semester?: number) {
  const url = typeof semester === "number" ? `/api/courses?semester=${semester}` : "/api/courses";
  const { data, error, isLoading, mutate } = useSWR<CoursesResponse>(url, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    keepPreviousData: true,
  });

  return {
    courses: data?.courses ?? [],
    isLoading: isLoading && !data,
    isError: Boolean(error && !data),
    mutate,
  };
}
