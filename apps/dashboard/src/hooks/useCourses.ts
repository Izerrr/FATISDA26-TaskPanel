"use client";

import { useMemo } from "react";
import { useAgamaPreference } from "@/hooks/useAgamaPreference";
import useSWR from "swr";
import type { Course } from "@/types";
import { matchesAgamaFilter } from "@/lib/schedule/constants";

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

export interface UseCoursesOptions {
  semester?: number;
  agama?: string;
  all?: boolean;
}

export function useCourses(options?: number | UseCoursesOptions) {
  const parsedOptions: UseCoursesOptions =
    typeof options === "number" ? { semester: options } : options ?? {};

  const [prefAgama] = useAgamaPreference();

  const effectiveAgama = parsedOptions.all ? "all" : (parsedOptions.agama ?? prefAgama);

  const queryParams = new URLSearchParams();
  if (typeof parsedOptions.semester === "number") {
    queryParams.set("semester", String(parsedOptions.semester));
  }
  if (effectiveAgama) {
    queryParams.set("agama", effectiveAgama);
  }
  if (parsedOptions.all) {
    queryParams.set("all", "true");
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/api/courses?${queryString}` : "/api/courses";

  const { data, error, isLoading, mutate } = useSWR<CoursesResponse>(url, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    keepPreviousData: true,
  });

  const filteredCourses = useMemo(() => {
    const list = data?.courses ?? [];
    if (parsedOptions.all || effectiveAgama === "all" || effectiveAgama === "semua") {
      return list;
    }
    return list.filter((c) => matchesAgamaFilter(c.name, effectiveAgama));
  }, [data?.courses, parsedOptions.all, effectiveAgama]);

  return {
    courses: filteredCourses,
    allCourses: data?.courses ?? [],
    isLoading: isLoading && !data,
    isError: Boolean(error && !data),
    mutate,
  };
}
