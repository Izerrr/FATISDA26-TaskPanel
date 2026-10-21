import useSWR from "swr";
import { DEFAULT_EXAM_MODE, type ExamModeSetting } from "@/lib/settings-shared";

const fetcher = async (url: string): Promise<{ examMode: ExamModeSetting }> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil status mode ujian");
  return res.json();
};

export function useExamMode() {
  const { data, error, isLoading, mutate } = useSWR<{ examMode: ExamModeSetting }>(
    "/api/settings/public",
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
      dedupingInterval: 15000,
    },
  );

  return {
    examMode: data?.examMode ?? DEFAULT_EXAM_MODE,
    isLoading,
    error,
    mutate,
  };
}

