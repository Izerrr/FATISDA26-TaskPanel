import useSWR from "swr";
import type { ExamSchedule, ExamType, Kelas, Prodi } from "@/types";

export interface UseExamScheduleOptions {
  prodi?: Prodi | null;
  semester?: number | string | null;
  kelas?: Kelas | string | null;
  type?: ExamType;
}

export interface ExamScheduleResponse {
  success: boolean;
  type: ExamType;
  prodi: Prodi;
  count: number;
  exams: ExamSchedule[];
}

const fetcher = async (url: string): Promise<ExamScheduleResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Gagal memuat jadwal ujian.");
  }
  return res.json();
};

export function useExamSchedule(options: UseExamScheduleOptions = {}) {
  const { prodi, semester, kelas, type = "UTS" } = options;

  const params = new URLSearchParams();
  if (prodi) params.set("prodi", prodi);
  if (semester !== undefined && semester !== null) params.set("semester", String(semester));
  if (kelas) params.set("kelas", String(kelas));
  params.set("type", type);

  const key = `/api/schedule/exam?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ExamScheduleResponse>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    exams: data?.exams ?? [],
    count: data?.count ?? 0,
    type: data?.type ?? type,
    isLoading,
    isError: error,
    mutate,
  };
}

